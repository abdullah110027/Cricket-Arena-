import { Types } from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAuthenticatedUser } from '@/lib/session';
import { VenueModel } from '@/models/Venue';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  if (user.role !== 'OWNER') return NextResponse.json({ error: 'Owner access required.' }, { status: 403 });
  if (!Types.ObjectId.isValid(user.id)) return NextResponse.json({ error: 'Invalid owner session.' }, { status: 401 });

  try {
    const body = await request.json() as Record<string, unknown>;
    const updates: Record<string, unknown> = {};
    for (const field of ['name', 'area', 'location', 'description'] as const) {
      if (field in body) {
        if (typeof body[field] !== 'string' || !body[field].trim()) return NextResponse.json({ error: `Invalid ${field}.` }, { status: 400 });
        updates[field] = body[field].trim();
      }
    }
    if ('type' in body) {
      if (body.type !== 'Indoor' && body.type !== 'Outdoor') return NextResponse.json({ error: 'Invalid venue type.' }, { status: 400 });
      updates.type = body.type;
    }
    if ('pricePerSlot' in body) {
      if (typeof body.pricePerSlot !== 'number' || !Number.isFinite(body.pricePerSlot) || body.pricePerSlot <= 0) return NextResponse.json({ error: 'Invalid price.' }, { status: 400 });
      updates.pricePerSlot = body.pricePerSlot;
    }
    if ('slotDuration' in body) {
      if (!Number.isInteger(body.slotDuration) || Number(body.slotDuration) <= 0) return NextResponse.json({ error: 'Invalid slot duration.' }, { status: 400 });
      updates.slotDuration = body.slotDuration;
    }
    if ('facilities' in body) {
      if (!Array.isArray(body.facilities) || !body.facilities.every((item) => typeof item === 'string')) return NextResponse.json({ error: 'Invalid facilities.' }, { status: 400 });
      updates.facilities = body.facilities;
    }
    if ('active' in body) {
      if (typeof body.active !== 'boolean') return NextResponse.json({ error: 'Invalid venue status.' }, { status: 400 });
      updates.active = body.active;
    }
    if (!Object.keys(updates).length) return NextResponse.json({ error: 'No changes provided.' }, { status: 400 });

    await connectToDatabase();
    const venue = await VenueModel.findOneAndUpdate(
      { _id: params.id, ownerId: new Types.ObjectId(user.id), isSystem: false },
      { $set: updates },
      { new: true, runValidators: true },
    ).lean();
    if (!venue) return NextResponse.json({ error: 'Venue not found or not owned by this account.' }, { status: 404 });
    return NextResponse.json({ venue: { ...venue, id: String(venue._id), ownerId: user.id, _id: undefined } });
  } catch (error) {
    console.error('Owner venue update failed:', error);
    return NextResponse.json({ error: 'Unable to update venue.' }, { status: 500 });
  }
}
