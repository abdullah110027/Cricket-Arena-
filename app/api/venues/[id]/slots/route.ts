import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ensureSeedVenues } from '@/lib/venue-data';
import { ensureSeedSlots } from '@/lib/seed-slots';
import { SlotModel } from '@/models/Slot';
import { VenueModel } from '@/models/Venue';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const date = request.nextUrl.searchParams.get('date') ?? '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return NextResponse.json({ error: 'A valid date is required.' }, { status: 400 });

  try {
    await connectToDatabase();
    await ensureSeedVenues();
    const venue = await VenueModel.findOne({
      _id: params.id,
      active: true,
      $or: [{ approvalStatus: 'APPROVED' }, { approvalStatus: { $exists: false } }],
    }).select('_id isSystem').lean();
    if (!venue) return NextResponse.json({ error: 'Venue not found.' }, { status: 404 });
    if (venue.isSystem) await ensureSeedSlots(params.id, date);
    const slots = await SlotModel.find({ venueId: params.id, date }).sort({ startTime: 1 }).lean();
    return NextResponse.json({ slots: slots.map((slot) => ({ ...slot, id: String(slot._id), _id: undefined })) });
  } catch (error) {
    console.error('Slot lookup failed:', error);
    return NextResponse.json({ error: 'Unable to load availability.' }, { status: 503 });
  }
}
