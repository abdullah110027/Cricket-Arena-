import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAuthenticatedUser } from '@/lib/session';
import { VenueModel } from '@/models/Venue';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  if (user.role !== 'ADMIN') return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });

  try {
    const body = await request.json() as Record<string, unknown>;
    const updates: Record<string, unknown> = {};

    if ('approvalStatus' in body) {
      const approvalStatus = body.approvalStatus;
      if (approvalStatus !== 'PENDING' && approvalStatus !== 'APPROVED' && approvalStatus !== 'REJECTED') {
        return NextResponse.json({ error: 'Invalid approval status.' }, { status: 400 });
      }
      updates.approvalStatus = approvalStatus;
      if (approvalStatus === 'APPROVED') updates.active = true;
      if (approvalStatus === 'REJECTED') updates.active = false;
    }

    if ('active' in body) {
      if (typeof body.active !== 'boolean') return NextResponse.json({ error: 'Invalid venue active state.' }, { status: 400 });
      updates.active = body.active;
    }

    if (!Object.keys(updates).length) return NextResponse.json({ error: 'No changes provided.' }, { status: 400 });

    await connectToDatabase();
    const venue = await VenueModel.findByIdAndUpdate(params.id, { $set: updates }, { new: true, runValidators: true }).lean();
    if (!venue) return NextResponse.json({ error: 'Venue not found.' }, { status: 404 });

    return NextResponse.json({
      venue: {
        ...venue,
        id: String(venue._id),
        ownerId: venue.ownerId ? String(venue.ownerId) : null,
        _id: undefined,
      },
    });
  } catch (error) {
    console.error('Admin venue update failed:', error);
    return NextResponse.json({ error: 'Unable to update venue.' }, { status: 500 });
  }
}
