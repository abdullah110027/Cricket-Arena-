import { Types } from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAuthenticatedUser } from '@/lib/session';
import { SlotModel } from '@/models/Slot';
import { VenueModel } from '@/models/Venue';

function endTime(startTime: string, duration: number): string {
  const [hour, minute] = startTime.split(':').map(Number);
  const total = hour * 60 + minute + duration;
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  if (user.role !== 'OWNER') return NextResponse.json({ error: 'Owner access required.' }, { status: 403 });
  try {
    await connectToDatabase();
    const venueIds = (await VenueModel.find({ ownerId: new Types.ObjectId(user.id) }).distinct('_id')) as string[];
    const venueId = request.nextUrl.searchParams.get('venueId');
    const date = request.nextUrl.searchParams.get('date');
    if (venueId && !venueIds.includes(venueId)) return NextResponse.json({ error: 'Venue not found or not owned by this account.' }, { status: 404 });
    const filter: Record<string, unknown> = { venueId: venueId ? { $in: [venueId] } : { $in: venueIds } };
    if (date) filter.date = date;
    const slots = await SlotModel.find(filter).sort({ date: 1, startTime: 1 }).lean();
    return NextResponse.json({ slots: slots.map((slot) => ({ ...slot, id: String(slot._id), _id: undefined })) });
  } catch (error) {
    console.error('Owner slot lookup failed:', error);
    return NextResponse.json({ error: 'Unable to load slots.' }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  if (user.role !== 'OWNER') return NextResponse.json({ error: 'Owner access required.' }, { status: 403 });
  try {
    const body = await request.json();
    const venueId = typeof body.venueId === 'string' ? body.venueId : '';
    const date = typeof body.date === 'string' ? body.date : '';
    const times = Array.isArray(body.startTimes) ? body.startTimes as unknown[] : [];
    const price = Number(body.price);
    if (!venueId || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !times.length || !times.every((time) => typeof time === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(time)) || !Number.isFinite(price) || price <= 0) {
      return NextResponse.json({ error: 'Choose a valid venue, date, start time, and price.' }, { status: 400 });
    }
    await connectToDatabase();
    const venue = await VenueModel.findOne({ _id: venueId, ownerId: new Types.ObjectId(user.id), isSystem: false }).select('slotDuration').lean();
    if (!venue) return NextResponse.json({ error: 'Venue not found or not owned by this account.' }, { status: 404 });

    const operations = [...new Set(times as string[])].map((startTime) => ({
      updateOne: {
        filter: { venueId, date, startTime },
        update: { $setOnInsert: { venueId, date, startTime, endTime: endTime(startTime, venue.slotDuration), price, status: 'available' } },
        upsert: true,
      },
    }));
    await SlotModel.bulkWrite(operations, { ordered: false });
    const slots = await SlotModel.find({ venueId, date }).sort({ startTime: 1 }).lean();
    return NextResponse.json({ slots: slots.map((slot) => ({ ...slot, id: String(slot._id), _id: undefined })) }, { status: 201 });
  } catch (error) {
    console.error('Owner slot creation failed:', error);
    return NextResponse.json({ error: 'Unable to create slots.' }, { status: 500 });
  }
}
