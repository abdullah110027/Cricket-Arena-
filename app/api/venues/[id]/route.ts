import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ensureSeedVenues, serializeVenue } from '@/lib/venue-data';
import { VenueModel } from '@/models/Venue';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();
    await ensureSeedVenues();
    const venue = await VenueModel.findOne({
      _id: params.id,
      active: true,
      $or: [{ approvalStatus: 'APPROVED' }, { approvalStatus: { $exists: false } }],
    }).lean();
    if (!venue) return NextResponse.json({ error: 'Venue not found.' }, { status: 404 });
    return NextResponse.json({ venue: serializeVenue(venue as unknown as Record<string, unknown> & { _id: string }) });
  } catch (error) {
    console.error('Venue lookup failed:', error);
    return NextResponse.json({ error: 'Unable to load venue.' }, { status: 503 });
  }
}
