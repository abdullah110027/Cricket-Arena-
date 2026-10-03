'use client';

import Link from 'next/link';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CalendarDays, CheckCircle2, LogIn, ReceiptText } from 'lucide-react';
import { ApiError, apiRequest } from '@/lib/api-client';

type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'OWNER' | 'ADMIN';
};

type BookingRecord = {
  id: string;
  venueId: string;
  venueName: string;
  area: string;
  date: string;
  startTime: string;
  endTime: string;
  totalAmount: number;
  advanceAmount: number;
  remainingAmount: number;
  commissionAmount: number;
  bookingStatus: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED';
  advancePaymentStatus: 'PENDING' | 'PAID' | 'FAILED';
  remainingPaymentStatus: 'PENDING' | 'PAID' | 'FAILED';
  paymentMethod: 'MOCK_CHECKOUT' | 'CASH';
  paidAt: string | null;
};

function BookingsLoading() {
  return (
    <main className="container-shell py-16">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">Loading</p>
        <h1 className="mt-2 text-3xl font-black text-slate-900">Loading your bookings...</h1>
      </div>
    </main>
  );
}

function BookingsContent() {
  const searchParams = useSearchParams();
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const confirmedBookingId = searchParams.get('bookingId');
  const confirmed = searchParams.get('confirmed') === '1';

  useEffect(() => {
    setLoading(true);
    setError('');
    let active = true;
    apiRequest<{ user: CurrentUser }>('/api/auth/session')
      .then((result) => {
        if (active) setUser(result.user);
        return apiRequest<{ bookings: BookingRecord[] }>('/api/bookings');
      })
      .then((result) => { if (active) setBookings(result.bookings); })
      .catch((loadError: unknown) => {
        if (!active) return;
        if (loadError instanceof ApiError && loadError.status === 401) {
          setUser(null);
          setBookings([]);
        } else {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load your bookings.');
        }
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [confirmedBookingId]);

  const successBooking = useMemo(() => {
    if (!confirmedBookingId) {
      return null;
    }

    return bookings.find((booking) => booking.id === confirmedBookingId) ?? null;
  }, [bookings, confirmedBookingId]);

  if (loading) {
    return <BookingsLoading />;
  }

  if (error) {
    return <main className="container-shell py-16"><div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800">{error}</div></main>;
  }

  if (!user) {
    return (
      <main className="container-shell py-16">
        <div className="mx-auto max-w-lg rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-soft">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
            <LogIn className="h-6 w-6" />
          </div>
          <p className="mt-6 text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">Login required</p>
          <h1 className="mt-2 text-3xl font-black text-slate-900">Please sign in to view your bookings.</h1>
          <p className="mt-3 text-slate-600">Your booking history and confirmed reservations will appear here after login.</p>
          <Link href="/login" className="mt-6 inline-flex rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white">
            Go to login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="container-shell py-16">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">My bookings</p>
          <h1 className="mt-2 text-3xl font-black text-slate-900">Welcome, {user.name}</h1>
        </div>
        <Link href="/venues" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
          Browse venues
        </Link>
      </div>

      {confirmed && successBooking ? (
        <div className="mb-8 rounded-3xl border border-emerald-200 bg-emerald-50 p-6 shadow-soft">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-white">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">Booking confirmed</p>
              <h2 className="mt-2 text-2xl font-black text-slate-900">Booking ID: {successBooking.id}</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                <div className="rounded-2xl bg-white/70 p-3">
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Ground</p>
                  <p className="mt-1 font-bold text-slate-900">{successBooking.venueName}</p>
                </div>
                <div className="rounded-2xl bg-white/70 p-3">
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Date</p>
                  <p className="mt-1 font-bold text-slate-900">{new Date(`${successBooking.date}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                </div>
                <div className="rounded-2xl bg-white/70 p-3">
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Time</p>
                  <p className="mt-1 font-bold text-slate-900">{successBooking.startTime} - {successBooking.endTime}</p>
                </div>
                <div className="rounded-2xl bg-white/70 p-3">
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Advance</p>
                  <p className="mt-1 font-bold text-slate-900">${successBooking.advanceAmount.toFixed(2)}</p>
                </div>
                <div className="rounded-2xl bg-white/70 p-3">
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Remaining cash</p>
                  <p className="mt-1 font-bold text-slate-900">${successBooking.remainingAmount.toFixed(2)}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-700">
                <span className="rounded-full bg-white/80 px-2.5 py-1">Total: ${successBooking.totalAmount.toFixed(2)}</span>
                <span className="rounded-full bg-white/80 px-2.5 py-1">Commission: ${successBooking.commissionAmount.toFixed(2)}</span>
                <span className="rounded-full bg-white/80 px-2.5 py-1">Payment: {successBooking.paymentStatus}</span>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {bookings.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-soft">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-600">
            <ReceiptText className="h-6 w-6" />
          </div>
          <h2 className="mt-5 text-2xl font-black text-slate-900">No bookings yet</h2>
          <p className="mt-2 text-slate-600">Your upcoming and previous bookings will appear here once you reserve a slot.</p>
          <Link href="/venues" className="mt-6 inline-flex rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white">
            Explore venues
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          {bookings.map((booking) => (
            <article key={booking.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
                    <CalendarDays className="h-4 w-4" />
                    Booking ID: {booking.id}
                  </div>
                  <h2 className="mt-3 text-2xl font-black text-slate-900">{booking.venueName}</h2>
                  <p className="mt-1 text-sm text-slate-500">{booking.area}</p>
                </div>

                <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-800">
                  {booking.bookingStatus}
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Date</p>
                  <p className="mt-1 font-bold text-slate-900">{new Date(`${booking.date}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Time</p>
                  <p className="mt-1 font-bold text-slate-900">{booking.startTime} - {booking.endTime}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Total</p>
                  <p className="mt-1 font-bold text-slate-900">${booking.totalAmount.toFixed(2)}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Advance</p>
                  <p className="mt-1 font-bold text-slate-900">${booking.advanceAmount.toFixed(2)}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Payment</p>
                  <p className="mt-1 font-bold text-slate-900">{booking.paymentStatus}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-600">
                <span className="rounded-full bg-slate-100 px-2.5 py-1">Remaining cash: ${booking.remainingAmount.toFixed(2)}</span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1">Commission: ${booking.commissionAmount.toFixed(2)}</span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1">Advance status: {booking.advancePaymentStatus}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}

export default function BookingsPage() {
  return (
    <Suspense fallback={<BookingsLoading />}>
      <BookingsContent />
    </Suspense>
  );
}
