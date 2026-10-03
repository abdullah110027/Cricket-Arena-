import { randomUUID } from 'crypto';
import { Types } from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAuthenticatedUser } from '@/lib/session';
import { VenueModel } from '@/models/Venue';

function validVenue(body: Record<string, unknown>): boolean {
  return typeof body.name === 'string' && !!body.name.trim() &&
    typeof body.area === 'string' && !!body.area.trim() &&
    typeof body.location === 'string' && !!body.location.trim() &&
    typeof body.description === 'string' && !!body.description.trim() &&
    (body.type === 'Indoor' || body.type === 'Outdoor') &&
    typeof body.pricePerSlot === 'number' && Number.isFinite(body.pricePerSlot) && body.pricePerSlot > 0 &&
    Number.isInteger(body.slotDuration) && Number(body.slotDuration) > 0 &&
    Array.isArray(body.facilities) && body.facilities.every((facility) => typeof facility === 'string');
}

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  if (user.role !== 'OWNER') return NextResponse.json({ error: 'Owner access required.' }, { status: 403 });
  try {
    await connectToDatabase();
    const venues = await VenueModel.find({ ownerId: new Types.ObjectId(user.id) }).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ venues: venues.map((venue) => ({ ...venue, id: String(venue._id), ownerId: String(venue.ownerId), _id: undefined })) });
  } catch (error) {
    console.error('Owner venue lookup failed:', error);
    return NextResponse.json({ error: 'Unable to load your venues.' }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  if (user.role !== 'OWNER') return NextResponse.json({ error: 'Owner access required.' }, { status: 403 });
  try {
    const body = await request.json() as Record<string, unknown>;
    if (!validVenue(body)) return NextResponse.json({ error: 'Complete all fields with a valid price and slot duration.' }, { status: 400 });
    await connectToDatabase();
    const venue = await VenueModel.create({
      _id: randomUUID(),
      ownerId: new Types.ObjectId(user.id),
      isSystem: false,
      name: (body.name as string).trim(),
      area: (body.area as string).trim(),
      location: (body.location as string).trim(),
      description: (body.description as string).trim(),
      type: body.type,
      pricePerSlot: body.pricePerSlot,
      facilities: (body.facilities as string[]).map((facility) => facility.trim()).filter(Boolean),
      slotDuration: body.slotDuration,
      approvalStatus: 'PENDING',
      active: true,
      rating: 0,
      slotsAvailable: 0,
    });
    return NextResponse.json({ venue: { ...venue.toObject(), id: String(venue._id), ownerId: user.id, _id: undefined } }, { status: 201 });
  } catch (error) {
    console.error('Owner venue creation failed:', error);
    return NextResponse.json({ error: 'Unable to create venue.' }, { status: 500 });
  }
}
