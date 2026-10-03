import { NextResponse } from 'next/server';
import { Types } from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb';
import { getAuthenticatedUser } from '@/lib/session';
import { BookingModel } from '@/models/Booking';
import { VenueModel } from '@/models/Venue';

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  if (user.role !== 'OWNER') return NextResponse.json({ error: 'Owner access required.' }, { status: 403 });
  try {
    await connectToDatabase();
    const venues = await VenueModel.find({ ownerId: new Types.ObjectId(user.id) }).sort({ createdAt: -1 }).lean();
    const bookings = venues.length ? await BookingModel.find({ venueId: { $in: venues.map((venue) => venue._id) } }).populate('userId', 'name email').sort({ date: 1, startTime: 1 }).lean() : [];
    return NextResponse.json({
      venues: venues.map((venue) => ({ ...venue, id: String(venue._id), ownerId: String(venue.ownerId), _id: undefined })),
      bookings: bookings.map((booking) => ({ ...booking, id: String(booking._id), userId: booking.userId && typeof booking.userId === 'object' ? { id: String(booking.userId._id), name: booking.userId.name, email: booking.userId.email } : null, _id: undefined })),
    });
  } catch (error) {
    console.error('Owner dashboard failed:', error);
    return NextResponse.json({ error: 'Unable to load owner dashboard.' }, { status: 503 });
  }
}
