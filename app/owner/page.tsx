'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowUpRight, CalendarDays, CircleDollarSign, MapPin, TicketCheck } from 'lucide-react';
import { apiRequest } from '@/lib/api-client';

type BookingRecord = {
  id: string;
  userId: string;
  venueId: string;
  venueName: string;
  area: string;
  date: string;
  startTime: string;
  endTime: string;
  totalAmount: number;
  bookingStatus: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED';
};

type OwnerVenue = {
  id: string;
  name: string;
  area: string;
  location: string;
  description: string;
  type: 'Indoor' | 'Outdoor';
  pricePerSlot: number;
  facilities: string[];
  active: boolean;
};

type OwnerBooking = BookingRecord & { customerName: string };

export default function OwnerDashboardPage() {
  const [venues, setVenues] = useState<OwnerVenue[]>([]);
  const [bookings, setBookings] = useState<(BookingRecord & { customerName: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiRequest<{ venues: OwnerVenue[]; bookings: OwnerBooking[] }>('/api/owner/dashboard')
      .then((result) => { setVenues(result.venues); setBookings(result.bookings); })
      .catch((loadError: unknown) => setError(loadError instanceof Error ? loadError.message : 'Unable to load your dashboard.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <main className="container-shell py-12"><p className="text-slate-600">Loading owner dashboard...</p></main>;
  }

  if (error) {
    return <main className="container-shell py-12"><div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-800">{error}</div></main>;
  }

  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const confirmedBookings = bookings.filter((booking) => booking.bookingStatus === 'CONFIRMED');
  const upcomingBookings = confirmedBookings.filter((booking) => booking.date >= todayKey);
  const bookingValue = confirmedBookings.reduce((total, booking) => total + booking.totalAmount, 0);

  return (
    <main className="container-shell py-10 sm:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">Owner dashboard</p>
          <h1 className="mt-2 text-3xl font-black text-slate-900">Your venue performance</h1>
        </div>
        <Link href="/owner/venues?new=1" className="inline-flex items-center gap-2 rounded-full bg-emerald-700 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800">
          Add venue <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>

      <section aria-label="Booking summary" className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'My venues', value: venues.length, icon: MapPin },
          { label: 'Total bookings', value: bookings.length, icon: TicketCheck },
          { label: 'Upcoming bookings', value: upcomingBookings.length, icon: CalendarDays },
          { label: 'Confirmed booking value', value: `$${bookingValue.toFixed(2)}`, icon: CircleDollarSign },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-sm font-medium">{label}</span><Icon className="h-5 w-5 text-emerald-700" />
            </div>
            <p className="mt-4 text-3xl font-black text-slate-900">{value}</p>
          </div>
        ))}
      </section>

      <section className="mt-10">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-black text-slate-900">My venues</h2>
          <Link href="/owner/venues" className="text-sm font-semibold text-emerald-700 hover:text-emerald-900">Manage venues</Link>
        </div>
        {venues.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <p className="font-semibold text-slate-900">No venues added yet</p>
            <p className="mt-1 text-sm text-slate-600">Add your first venue to start managing availability and bookings.</p>
            <Link href="/owner/venues?new=1" className="mt-4 inline-flex rounded-full bg-emerald-700 px-4 py-2 text-sm font-semibold text-white">Add a venue</Link>
          </div>
        ) : (
          <div className="mt-4 divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
            {venues.map((venue) => (
              <div key={venue.id} className="flex flex-wrap items-center justify-between gap-4 p-5">
                <div>
                  <h3 className="font-bold text-slate-900">{venue.name}</h3>
                  <p className="mt-1 text-sm text-slate-600">{venue.area} · ${venue.pricePerSlot} per slot</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${venue.active ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                  {venue.active ? 'Active' : 'Inactive'}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-10">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-black text-slate-900">Upcoming bookings</h2>
          <Link href="/owner/bookings" className="text-sm font-semibold text-emerald-700 hover:text-emerald-900">View all</Link>
        </div>
        {upcomingBookings.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white p-7 text-sm text-slate-600">No upcoming bookings for your venues.</div>
        ) : (
          <div className="mt-4 divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
            {upcomingBookings.slice(0, 5).map((booking) => (
              <div key={booking.id} className="flex flex-wrap justify-between gap-3 p-5">
                <div><p className="font-semibold text-slate-900">{booking.venueName}</p><p className="mt-1 text-sm text-slate-600">{booking.date} · {booking.startTime}–{booking.endTime}</p></div>
                <p className="text-sm font-semibold text-slate-800">${booking.totalAmount}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
