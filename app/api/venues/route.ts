import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ensureSeedVenues, serializeVenue } from '@/lib/venue-data';
import { VenueModel } from '@/models/Venue';

export async function GET() {
  try {
    await connectToDatabase();
    await ensureSeedVenues();
    const venues = await VenueModel.find({
      active: true,
      $or: [{ approvalStatus: 'APPROVED' }, { approvalStatus: { $exists: false } }],
    }).sort({ name: 1 }).lean();
    return NextResponse.json({ venues: venues.map((venue) => serializeVenue(venue as unknown as Record<string, unknown> & { _id: string })) });
  } catch (error) {
    console.error('Venue listing failed:', error);
    return NextResponse.json({ error: 'Unable to load venues.' }, { status: 503 });
  }
}
