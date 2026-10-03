'use client';

import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api-client';

type OwnerBooking = {
  id: string;
  venueName: string;
  customerName: string;
  customerEmail?: string;
  date: string;
  startTime: string;
  endTime: string;
  totalAmount: number;
  advanceAmount: number;
  remainingAmount: number;
  commissionAmount: number;
  bookingStatus: string;
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED';
  advancePaymentStatus: 'PENDING' | 'PAID' | 'FAILED';
  remainingPaymentStatus: 'PENDING' | 'PAID' | 'FAILED';
};

export default function OwnerBookingsPage() {
  const [bookings, setBookings] = useState<OwnerBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    apiRequest<{ bookings: OwnerBooking[] }>('/api/owner/bookings')
      .then((result) => {
        if (!active) return;
        setBookings(result.bookings);
      })
      .catch((loadError: unknown) => {
        if (!active) return;
        setError(loadError instanceof Error ? loadError.message : 'Unable to load bookings.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  if (loading) return <main className="container-shell py-12 text-slate-600">Loading bookings...</main>;

  return (
    <main className="container-shell py-10 sm:py-14">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">Owner bookings</p>
      <h1 className="mt-2 text-3xl font-black text-slate-900">Bookings for your venues</h1>
      {error ? <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div> : null}
      {!error && bookings.length === 0 ? <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center"><h2 className="font-semibold text-slate-900">No bookings yet</h2><p className="mt-2 text-sm text-slate-600">Bookings for your venues will appear here.</p></div> : null}
      {bookings.length > 0 ? (
        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="hidden grid-cols-[1.2fr_1fr_1fr_1fr_0.9fr_1fr_0.9fr] gap-4 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 lg:grid">
            <span>Venue</span><span>Date</span><span>Time</span><span>Customer</span><span>Amount</span><span>Payment</span><span>Status</span>
          </div>
          <div className="divide-y divide-slate-200">
            {bookings.map((booking) => (
              <article key={booking.id} className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr_1fr_0.9fr_1fr_0.9fr] lg:items-center lg:gap-4">
                <div><span className="text-xs font-semibold uppercase text-slate-500 lg:hidden">Venue</span><p className="font-semibold text-slate-900">{booking.venueName}</p>{booking.customerEmail ? <p className="mt-1 text-xs text-slate-500">{booking.customerEmail}</p> : <p className="mt-1 text-xs text-slate-500">{booking.id}</p>}</div>
                <div><span className="text-xs font-semibold uppercase text-slate-500 lg:hidden">Date</span><p className="text-sm text-slate-700">{new Date(`${booking.date}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p></div>
                <div><span className="text-xs font-semibold uppercase text-slate-500 lg:hidden">Time</span><p className="text-sm text-slate-700">{booking.startTime}–{booking.endTime}</p></div>
                <div><span className="text-xs font-semibold uppercase text-slate-500 lg:hidden">Customer</span><p className="text-sm text-slate-700">{booking.customerName}</p></div>
                <div><span className="text-xs font-semibold uppercase text-slate-500 lg:hidden">Amount</span><div className="text-sm text-slate-700"><p className="font-semibold text-slate-900">${booking.totalAmount.toFixed(2)}</p><p className="mt-1 text-xs">Advance ${booking.advanceAmount.toFixed(2)} · Cash ${booking.remainingAmount.toFixed(2)}</p></div></div>
                <div><span className="text-xs font-semibold uppercase text-slate-500 lg:hidden">Payment</span><p className="text-sm text-slate-700">{booking.paymentStatus}</p><p className="mt-1 text-xs text-slate-500">Advance: {booking.advancePaymentStatus}</p></div>
                <div><span className="text-xs font-semibold uppercase text-slate-500 lg:hidden">Status</span><span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">{booking.bookingStatus}</span></div>
              </article>
            ))}
          </div>
        </div>
      ) : null}
    </main>
  );
}
