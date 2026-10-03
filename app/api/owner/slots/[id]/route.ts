import { Types } from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAuthenticatedUser } from '@/lib/session';
import { SlotModel } from '@/models/Slot';
import { VenueModel } from '@/models/Venue';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  if (user.role !== 'OWNER') return NextResponse.json({ error: 'Owner access required.' }, { status: 403 });
  if (!Types.ObjectId.isValid(params.id)) return NextResponse.json({ error: 'Invalid slot.' }, { status: 400 });
  try {
    const body = await request.json();
    if (body.status !== 'available' && body.status !== 'unavailable') return NextResponse.json({ error: 'Invalid slot status.' }, { status: 400 });
    await connectToDatabase();
    const venueIds = await VenueModel.find({ ownerId: new Types.ObjectId(user.id), isSystem: false }).distinct('_id');
    const slot = await SlotModel.findOneAndUpdate(
      { _id: new Types.ObjectId(params.id), venueId: { $in: venueIds }, status: { $ne: 'booked' } },
      { $set: { status: body.status } },
      { new: true },
    ).lean();
    if (!slot) return NextResponse.json({ error: 'Slot not found, not owned by this account, or already booked.' }, { status: 404 });
    return NextResponse.json({ slot: { ...slot, id: String(slot._id), _id: undefined } });
  } catch (error) {
    console.error('Owner slot update failed:', error);
    return NextResponse.json({ error: 'Unable to update slot.' }, { status: 500 });
  }
}
