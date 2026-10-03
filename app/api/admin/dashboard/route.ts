import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAuthenticatedUser } from '@/lib/session';
import { BookingModel } from '@/models/Booking';
import { UserModel } from '@/models/User';
import { VenueModel } from '@/models/Venue';

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  if (user.role !== 'ADMIN') return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });

  try {
    await connectToDatabase();

    const [totalUsers, totalOwners, totalVenues, totalBookings, venues, commissionSummary, recentBookings] = await Promise.all([
      UserModel.countDocuments({}),
      UserModel.countDocuments({ role: 'OWNER' }),
      VenueModel.countDocuments({}),
      BookingModel.countDocuments({}),
      VenueModel.find({}).populate('ownerId', 'name email').sort({ createdAt: -1 }).lean(),
      BookingModel.aggregate([{ $group: { _id: null, commissionTotal: { $sum: '$commissionAmount' } } }]),
      BookingModel.find({}).populate('userId', 'name email').populate('venueId', 'name').sort({ createdAt: -1 }).limit(8).lean(),
    ]);

    const totalCommission = Number(commissionSummary[0]?.commissionTotal ?? 0);

    const normalizedVenues = venues.map((venue) => ({
      id: String(venue._id),
      name: venue.name,
      area: venue.area,
      location: venue.location,
      description: venue.description,
      type: venue.type,
      pricePerSlot: venue.pricePerSlot,
      facilities: venue.facilities ?? [],
      approvalStatus: venue.approvalStatus ?? 'PENDING',
      active: venue.active,
      ownerId: venue.ownerId ? String(venue.ownerId._id ?? venue.ownerId) : null,
      ownerName: venue.ownerId && typeof venue.ownerId === 'object' && 'name' in venue.ownerId ? String(venue.ownerId.name) : 'Unknown owner',
      createdAt: venue.createdAt ? new Date(venue.createdAt).toISOString() : null,
    }));

    const pending = normalizedVenues.filter((venue) => venue.approvalStatus === 'PENDING');
    const approved = normalizedVenues.filter((venue) => venue.approvalStatus === 'APPROVED');
    const rejected = normalizedVenues.filter((venue) => venue.approvalStatus === 'REJECTED');

    return NextResponse.json({
      stats: {
        totalUsers,
        totalOwners,
        totalVenues,
        totalBookings,
        pendingApprovals: pending.length,
        totalCommission,
      },
      venues: {
        pending,
        approved,
        rejected,
      },
      recentBookings: recentBookings.map((booking) => ({
        id: String(booking._id),
        userName: booking.userId && typeof booking.userId === 'object' ? booking.userId.name : 'Unknown user',
        venueName: booking.venueId && typeof booking.venueId === 'object' ? booking.venueId.name : 'Unknown venue',
        totalAmount: Number(booking.totalAmount ?? 0),
        commissionAmount: Number(booking.commissionAmount ?? 0),
        paymentStatus: booking.paymentStatus ?? 'PENDING',
        advancePaymentStatus: booking.advancePaymentStatus ?? 'PENDING',
        remainingPaymentStatus: booking.remainingPaymentStatus ?? 'PENDING',
        bookingStatus: booking.bookingStatus ?? 'PENDING',
      })),
    });
  } catch (error) {
    console.error('Admin dashboard load failed:', error);
    return NextResponse.json({ error: 'Unable to load the admin dashboard.' }, { status: 503 });
  }
}
