import { seedVenues } from '@/lib/venues';
import { VenueModel } from '@/models/Venue';

export async function ensureSeedVenues(): Promise<void> {
  await VenueModel.bulkWrite(
    seedVenues.map((venue) => ({
      updateOne: {
        filter: { _id: venue.id },
        update: {
          $setOnInsert: {
            ...venue,
            _id: venue.id,
            ownerId: null,
            isSystem: true,
            active: true,
            approvalStatus: 'APPROVED',
            slotDuration: 90,
          },
        },
        upsert: true,
      },
    })),
    { ordered: false },
  );
}

export function serializeVenue(venue: Record<string, unknown> & { _id: string }) {
  const { _id, ownerId: _ownerId, isSystem: _isSystem, createdAt: _createdAt, updatedAt: _updatedAt, ...fields } = venue;
  return { ...fields, id: String(_id), ownerId: undefined };
}
