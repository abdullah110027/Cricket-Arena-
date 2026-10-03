import { seedVenues } from '@/lib/venues';

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED';

export type BookingRecord = {
  id: string;
  userId: string;
  venueId: string;
  venueName: string;
  area: string;
  date: string;
  startTime: string;
  endTime: string;
  slotId: string;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  bookingStatus: BookingStatus;
  createdAt: string;
};

export const BOOKING_STORAGE_KEY = 'cricket-arena-bookings';
export const CURRENT_USER_KEY = 'cricket-arena-current-user';

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role?: 'USER' | 'OWNER';
};

export function getCurrentUser(): CurrentUser | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = window.localStorage.getItem(CURRENT_USER_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as CurrentUser;
  } catch {
    return null;
  }
}

export function isLoggedIn(): boolean {
  return Boolean(getCurrentUser());
}

function readBookings(): BookingRecord[] {
  if (typeof window === 'undefined') {
    return [];
  }

  const raw = window.localStorage.getItem(BOOKING_STORAGE_KEY);

  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw) as BookingRecord[];
  } catch {
    return [];
  }
}

function writeBookings(bookings: BookingRecord[]) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(BOOKING_STORAGE_KEY, JSON.stringify(bookings));
}

export function getUserBookings(): BookingRecord[] {
  const user = getCurrentUser();

  if (!user) {
    return [];
  }

  return readBookings()
    .filter((booking) => booking.userId === user.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function createBookingForVenue({
  venueId,
  venueName,
  area,
  date,
  slotId,
  startTime,
  endTime,
  price,
}: {
  venueId: string;
  venueName: string;
  area: string;
  date: string;
  slotId: string;
  startTime: string;
  endTime: string;
  price: number;
}): { ok: boolean; booking?: BookingRecord; message?: string } {
  const currentUser = getCurrentUser();

  if (!currentUser) {
    return {
      ok: false,
      message: 'Please log in to confirm this booking.',
    };
  }

  const venue = seedVenues.find((item) => item.id === venueId);

  if (!venue) {
    return {
      ok: false,
      message: 'Selected venue could not be found.',
    };
  }

  const bookings = readBookings();
  const duplicate = bookings.some(
    (booking) =>
      booking.userId === currentUser.id &&
      booking.venueId === venueId &&
      booking.date === date &&
      booking.startTime === startTime &&
      booking.bookingStatus !== 'CANCELLED',
  );

  if (duplicate) {
    return {
      ok: false,
      message: 'This slot is already booked for your account.',
    };
  }

  const slotConflict = bookings.some(
    (booking) =>
      booking.venueId === venueId &&
      booking.date === date &&
      booking.startTime === startTime &&
      booking.bookingStatus !== 'CANCELLED',
  );

  if (slotConflict) {
    return {
      ok: false,
      message: 'This slot has already been booked by another guest.',
    };
  }

  const computedPrice = Number(price || venue.pricePerSlot);
  const booking: BookingRecord = {
    id: `CA-${Date.now()}`,
    userId: currentUser.id,
    venueId,
    venueName: venueName || venue.name,
    area: area || venue.area,
    date,
    startTime,
    endTime,
    slotId,
    totalAmount: computedPrice,
    paymentStatus: 'PENDING',
    bookingStatus: 'CONFIRMED',
    createdAt: new Date().toISOString(),
  };

  writeBookings([...bookings, booking]);

  return {
    ok: true,
    booking,
  };
}
