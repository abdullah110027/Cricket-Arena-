import { Types } from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { calculateBookingAmounts } from '@/lib/payments';
import { getAuthenticatedUser } from '@/lib/session';
import { BookingModel } from '@/models/Booking';
import { SlotModel } from '@/models/Slot';
import { VenueModel } from '@/models/Venue';

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  if (user.role !== 'USER') return NextResponse.json({ error: 'Player account required.' }, { status: 403 });

  try {
    await connectToDatabase();
    const bookings = await BookingModel.find({ userId: user.id }).populate('venueId', 'name area').sort({ createdAt: -1 }).lean();
    return NextResponse.json({ bookings: bookings.map((booking) => {
      const venue = booking.venueId && typeof booking.venueId === 'object' ? booking.venueId : null;
      return {
        ...booking,
        id: String(booking._id),
        userId: user.id,
        venueId: venue ? String(venue._id) : String(booking.venueId),
        venueName: venue?.name ?? 'Venue unavailable',
        area: venue?.area ?? '',
        slotId: String(booking.slotId),
        totalAmount: Number(booking.totalAmount ?? 0),
        advanceAmount: Number(booking.advanceAmount ?? 0),
        remainingAmount: Number(booking.remainingAmount ?? 0),
        commissionAmount: Number(booking.commissionAmount ?? 0),
        paymentStatus: booking.paymentStatus ?? 'PENDING',
        advancePaymentStatus: booking.advancePaymentStatus ?? 'PENDING',
        remainingPaymentStatus: booking.remainingPaymentStatus ?? 'PENDING',
        paymentMethod: booking.paymentMethod ?? 'MOCK_CHECKOUT',
        paidAt: booking.paidAt ? new Date(booking.paidAt).toISOString() : null,
        _id: undefined,
      };
    }) });
  } catch (error) {
    console.error('Booking history lookup failed:', error);
    return NextResponse.json({ error: 'Unable to load your bookings.' }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Please sign in before booking.' }, { status: 401 });
  if (user.role !== 'USER') return NextResponse.json({ error: 'Player account required.' }, { status: 403 });

  let slotReserved = false;
  let venueId = '';
  let slotObjectId: Types.ObjectId | null = null;
  try {
    const body = await request.json();
    venueId = typeof body.venueId === 'string' ? body.venueId : '';
    const slotId = typeof body.slotId === 'string' ? body.slotId : '';
    const date = typeof body.date === 'string' ? body.date : '';
    if (!venueId || !Types.ObjectId.isValid(slotId) || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: 'Choose a valid venue, date, and slot.' }, { status: 400 });
    }

    await connectToDatabase();
    const venue = await VenueModel.findOne({
      _id: venueId,
      active: true,
      $or: [{ approvalStatus: 'APPROVED' }, { approvalStatus: { $exists: false } }],
    }).lean();
    if (!venue) return NextResponse.json({ error: 'Venue is unavailable.' }, { status: 404 });

    slotObjectId = new Types.ObjectId(slotId);
    const slot = await SlotModel.findOne({ _id: slotObjectId, venueId, date, status: 'available' }).lean();
    if (!slot) return NextResponse.json({ error: 'That slot is no longer available.' }, { status: 409 });
    slotReserved = true;

    const amounts = calculateBookingAmounts(Number(slot.price ?? venue.pricePerSlot ?? 0));
    const booking = await BookingModel.create({
      userId: user.id,
      venueId,
      slotId: slot._id,
      date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      totalAmount: amounts.totalAmount,
      advanceAmount: amounts.advanceAmount,
      remainingAmount: amounts.remainingAmount,
      commissionAmount: amounts.commissionAmount,
      bookingStatus: 'PENDING',
      paymentStatus: 'PENDING',
      advancePaymentStatus: 'PENDING',
      remainingPaymentStatus: 'PENDING',
      paymentMethod: 'MOCK_CHECKOUT',
    });
    await SlotModel.updateOne({ _id: slotObjectId, venueId, date, status: 'available' }, { $set: { status: 'booked' } }).catch(() => undefined);
    return NextResponse.json({ booking: { ...booking.toObject(), id: String(booking._id), userId: user.id, venueName: venue.name, area: venue.area } }, { status: 201 });
  } catch (error) {
    if (slotReserved && slotObjectId) {
      await SlotModel.updateOne({ _id: slotObjectId, venueId, status: 'booked' }, { $set: { status: 'available' } }).catch(() => undefined);
    }
    console.error('Booking creation failed:', error);
    return NextResponse.json({ error: 'Unable to create booking.' }, { status: 500 });
  }
}
