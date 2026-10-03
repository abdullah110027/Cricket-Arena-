import { Types } from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { calculateBookingAmounts } from '@/lib/payments';
import { getAuthenticatedUser } from '@/lib/session';
import { BookingModel } from '@/models/Booking';
import { SlotModel } from '@/models/Slot';
import { VenueModel } from '@/models/Venue';

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  if (user.role !== 'USER') return NextResponse.json({ error: 'Player account required.' }, { status: 403 });

  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const venueId = typeof body.venueId === 'string' ? body.venueId : '';
  const slotId = typeof body.slotId === 'string' ? body.slotId : '';
  const date = typeof body.date === 'string' ? body.date : '';

  if (!venueId || !Types.ObjectId.isValid(slotId) || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'Choose a valid venue, date, and slot.' }, { status: 400 });
  }

  let slotReserved = false;
  let slotObjectId: Types.ObjectId | null = null;
  try {
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

    const existingBooking = await BookingModel.findOne({ userId: user.id, venueId, slotId, date }).lean();
    if (existingBooking && ['PAID', 'PENDING'].includes(String(existingBooking.paymentStatus ?? 'PENDING')) && existingBooking.bookingStatus !== 'CANCELLED') {
      return NextResponse.json({ error: 'This booking has already been created or is already in progress.' }, { status: 409 });
    }

    const amounts = calculateBookingAmounts(Number(slot.price ?? venue.pricePerSlot ?? 0));
    const booking = await BookingModel.create({
      userId: user.id,
      venueId,
      slotId: slotObjectId,
      date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      totalAmount: amounts.totalAmount,
      advanceAmount: amounts.advanceAmount,
      remainingAmount: amounts.remainingAmount,
      commissionAmount: amounts.commissionAmount,
      bookingStatus: 'CONFIRMED',
      paymentStatus: 'PAID',
      advancePaymentStatus: 'PAID',
      remainingPaymentStatus: 'PENDING',
      paymentMethod: 'MOCK_CHECKOUT',
      paidAt: new Date(),
    });

    slotReserved = true;
    await SlotModel.updateOne({ _id: slotObjectId, venueId, date }, { $set: { status: 'booked' } }).catch(() => undefined);

    return NextResponse.json({
      booking: {
        ...booking.toObject(),
        id: String(booking._id),
        userId: user.id,
        venueName: venue.name,
        area: venue.area,
        _id: undefined,
      },
    }, { status: 201 });
  } catch (error) {
    if (slotReserved && slotObjectId) {
      await SlotModel.updateOne({ _id: slotObjectId, venueId, date, status: 'booked' }, { $set: { status: 'available' } }).catch(() => undefined);
    }
    console.error('Mock payment checkout failed:', error);
    return NextResponse.json({ error: 'Unable to process the mock payment.' }, { status: 500 });
  }
}
