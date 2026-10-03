import { SlotModel } from '@/models/Slot';
import { seedVenues } from '@/lib/venues';

const defaultStartTimes = ['09:00', '10:30', '12:00', '14:00', '16:00', '18:00', '20:00'];

function addMinutes(time: string, duration: number): string {
  const [hour, minute] = time.split(':').map(Number);
  const totalMinutes = hour * 60 + minute + duration;
  return `${String(Math.floor(totalMinutes / 60) % 24).padStart(2, '0')}:${String(totalMinutes % 60).padStart(2, '0')}`;
}

export async function ensureSeedSlots(venueId: string, date: string): Promise<void> {
  const venue = seedVenues.find((item) => item.id === venueId);
  if (!venue) return;

  await SlotModel.bulkWrite(
    defaultStartTimes.map((startTime) => ({
      updateOne: {
        filter: { venueId, date, startTime },
        update: {
          $setOnInsert: {
            venueId,
            date,
            startTime,
            endTime: addMinutes(startTime, 90),
            price: venue.pricePerSlot,
            status: 'available',
          },
        },
        upsert: true,
      },
    })),
    { ordered: false },
  );
}
