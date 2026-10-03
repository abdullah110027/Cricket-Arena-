import type { BookingRecord, CurrentUser } from '@/lib/bookings';
import { BOOKING_STORAGE_KEY } from '@/lib/bookings';
import type { Venue, VenueSlot, VenueType } from '@/lib/venues';

export type OwnerVenue = Venue & {
  ownerId: string;
  active: boolean;
  slotDuration: number;
};

export type ManagedSlot = VenueSlot & {
  price: number;
  status: 'available' | 'unavailable';
};

export const OWNER_VENUES_KEY = 'cricket-arena-owner-venues';
export const OWNER_SLOTS_KEY = 'cricket-arena-owner-slots';

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(key, JSON.stringify(value));
  }
}

export function getOwnerVenues(ownerId: string): OwnerVenue[] {
  return readJson<OwnerVenue[]>(OWNER_VENUES_KEY, []).filter((venue) => venue.ownerId === ownerId);
}

export function saveOwnerVenue(
  owner: CurrentUser,
  input: {
    id?: string;
    name: string;
    area: string;
    location: string;
    description: string;
    type: VenueType;
    pricePerSlot: number;
    facilities: string[];
    slotDuration: number;
  },
): { ok: boolean; venue?: OwnerVenue; message?: string } {
  if (owner.role !== 'OWNER') return { ok: false, message: 'Owner access is required.' };
  if (!input.name.trim() || !input.area.trim() || !input.location.trim() || !input.description.trim()) {
    return { ok: false, message: 'Complete all required venue fields.' };
  }
  if (!Number.isFinite(input.pricePerSlot) || input.pricePerSlot <= 0 || !Number.isInteger(input.slotDuration) || input.slotDuration <= 0) {
    return { ok: false, message: 'Enter a valid price and slot duration.' };
  }

  const allVenues = readJson<OwnerVenue[]>(OWNER_VENUES_KEY, []);
  const existing = input.id ? allVenues.find((venue) => venue.id === input.id) : undefined;
  if (input.id && (!existing || existing.ownerId !== owner.id)) {
    return { ok: false, message: 'You can only edit venues that belong to your account.' };
  }

  const venue: OwnerVenue = {
    id: existing?.id ?? `owner-venue-${Date.now()}`,
    ownerId: owner.id,
    name: input.name.trim(),
    area: input.area.trim(),
    location: input.location.trim(),
    description: input.description.trim(),
    type: input.type,
    pricePerSlot: input.pricePerSlot,
    facilities: input.facilities,
    rating: existing?.rating ?? 0,
    slotsAvailable: existing?.slotsAvailable ?? 0,
    active: existing?.active ?? true,
    slotDuration: input.slotDuration,
  };

  writeJson(OWNER_VENUES_KEY, existing ? allVenues.map((item) => item.id === venue.id ? venue : item) : [...allVenues, venue]);
  return { ok: true, venue };
}

export function setOwnerVenueActive(ownerId: string, venueId: string, active: boolean): boolean {
  const allVenues = readJson<OwnerVenue[]>(OWNER_VENUES_KEY, []);
  const index = allVenues.findIndex((venue) => venue.id === venueId && venue.ownerId === ownerId);
  if (index === -1) return false;
  allVenues[index] = { ...allVenues[index], active };
  writeJson(OWNER_VENUES_KEY, allVenues);
  return true;
}

export function getOwnerSlots(ownerId: string, venueId?: string): ManagedSlot[] {
  const venueIds = new Set(getOwnerVenues(ownerId).map((venue) => venue.id));
  return readJson<ManagedSlot[]>(OWNER_SLOTS_KEY, []).filter(
    (slot) => venueIds.has(slot.venueId) && (!venueId || slot.venueId === venueId),
  );
}

export function saveManagedSlots(
  ownerId: string,
  venueId: string,
  date: string,
  startTimes: string[],
  price: number,
): { ok: boolean; message?: string } {
  const venue = getOwnerVenues(ownerId).find((item) => item.id === venueId);
  if (!venue) return { ok: false, message: 'Choose one of your own venues.' };
  if (!date || !Number.isFinite(price) || price <= 0 || startTimes.length === 0) {
    return { ok: false, message: 'Choose a date, at least one time, and a valid price.' };
  }

  const slots = readJson<ManagedSlot[]>(OWNER_SLOTS_KEY, []);
  for (const startTime of startTimes) {
    const [hour, minute] = startTime.split(':').map(Number);
    const end = new Date(2000, 0, 1, hour, minute + venue.slotDuration);
    const endTime = `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`;
    const slotId = `${venueId}-${date}-${startTime}`;
    const existing = slots.find((slot) => slot.id === slotId);
    if (existing) continue;
    slots.push({ id: slotId, venueId, date, startTime, endTime, status: 'available', price });
  }
  writeJson(OWNER_SLOTS_KEY, slots);
  return { ok: true };
}

export function setManagedSlotUnavailable(ownerId: string, slotId: string, unavailable: boolean): boolean {
  const ownedIds = new Set(getOwnerVenues(ownerId).map((venue) => venue.id));
  const slots = readJson<ManagedSlot[]>(OWNER_SLOTS_KEY, []);
  const index = slots.findIndex((slot) => slot.id === slotId && ownedIds.has(slot.venueId));
  if (index === -1) return false;
  slots[index] = { ...slots[index], status: unavailable ? 'unavailable' : 'available' };
  writeJson(OWNER_SLOTS_KEY, slots);
  return true;
}

export function getOwnerBookings(ownerId: string): (BookingRecord & { customerName: string })[] {
  const venueIds = new Set(getOwnerVenues(ownerId).map((venue) => venue.id));
  const bookings = readJson<BookingRecord[]>(BOOKING_STORAGE_KEY, []);
  const users = readJson<CurrentUser[]>('cricket-arena-users', []);
  return bookings
    .filter((booking) => venueIds.has(booking.venueId))
    .map((booking) => ({
      ...booking,
      customerName: users.find((user) => user.id === booking.userId)?.name ?? `Customer ${booking.userId}`,
    }))
    .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
}
