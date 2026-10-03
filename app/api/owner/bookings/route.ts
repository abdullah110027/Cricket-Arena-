import { Types } from 'mongoose';
import { NextResponse } from 'next/server';
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
    const venueIds = await VenueModel.find({ ownerId: new Types.ObjectId(user.id) }).distinct('_id');
    const bookings = venueIds.length ? await BookingModel.find({ venueId: { $in: venueIds } }).populate('userId', 'name email').sort({ date: 1, startTime: 1 }).lean() : [];
    return NextResponse.json({ bookings: bookings.map((booking) => ({
      ...booking,
      id: String(booking._id),
      userId: booking.userId && typeof booking.userId === 'object' ? String(booking.userId._id) : '',
      customerName: booking.userId && typeof booking.userId === 'object' ? booking.userId.name : 'Unknown customer',
      customerEmail: booking.userId && typeof booking.userId === 'object' ? booking.userId.email : '',
      totalAmount: Number(booking.totalAmount ?? 0),
      advanceAmount: Number(booking.advanceAmount ?? 0),
      remainingAmount: Number(booking.remainingAmount ?? 0),
      commissionAmount: Number(booking.commissionAmount ?? 0),
      paymentStatus: booking.paymentStatus ?? 'PENDING',
      advancePaymentStatus: booking.advancePaymentStatus ?? 'PENDING',
      remainingPaymentStatus: booking.remainingPaymentStatus ?? 'PENDING',
      paymentMethod: booking.paymentMethod ?? 'MOCK_CHECKOUT',
      _id: undefined,
    })) });
  } catch (error) {
    console.error('Owner bookings lookup failed:', error);
    return NextResponse.json({ error: 'Unable to load venue bookings.' }, { status: 503 });
  }
}
