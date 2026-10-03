'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CalendarDays, CheckCircle2, MapPin, Star, Timer } from 'lucide-react';
import { apiRequest } from '@/lib/api-client';
import type { Venue, VenueSlot } from '@/lib/venues';

function getDateOptions(dayCount: number) {
  return Array.from({ length: dayCount }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() + index);
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return {
      value,
      label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    };
  });
}

export default function VenueDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const venueId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [venue, setVenue] = useState<Venue | null>(null);
  const [venueLoading, setVenueLoading] = useState(true);
  const [venueError, setVenueError] = useState('');
  const dateOptions = useMemo(() => getDateOptions(7), []);
  const [selectedDate, setSelectedDate] = useState(dateOptions[0]?.value ?? '');
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [bookingState, setBookingState] = useState<{ loading: boolean; error: string | null }>({ loading: false, error: null });
  const [slots, setSlots] = useState<VenueSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    apiRequest<{ venue: Venue }>(`/api/venues/${encodeURIComponent(String(venueId))}`)
      .then((result) => { if (active) setVenue(result.venue); })
      .catch((error: unknown) => { if (active) setVenueError(error instanceof Error ? error.message : 'Unable to load this venue.'); })
      .finally(() => { if (active) setVenueLoading(false); });
    return () => { active = false; };
  }, [venueId]);

  useEffect(() => {
    if (!venueId || !selectedDate) return;
    let active = true;
    setSlotsLoading(true);
    apiRequest<{ slots: VenueSlot[] }>(`/api/venues/${encodeURIComponent(String(venueId))}/slots?date=${encodeURIComponent(selectedDate)}`)
      .then((result) => { if (active) setSlots(result.slots); })
      .catch((error: unknown) => { if (active) setBookingState({ loading: false, error: error instanceof Error ? error.message : 'Unable to load availability.' }); })
      .finally(() => { if (active) setSlotsLoading(false); });
    return () => { active = false; };
  }, [venueId, selectedDate]);

  const selectedSlot = slots.find((slot) => slot.id === selectedSlotId) ?? null;
  const baseAmount = Number(selectedSlot?.price ?? venue?.pricePerSlot ?? 0);
  const totalAmount = baseAmount + 1;
  const advanceAmount = totalAmount / 2;
  const remainingAmount = totalAmount - advanceAmount;

  const handleConfirmBooking = async () => {
    if (!venue || !selectedDate || !selectedSlot) {
      setBookingState({ loading: false, error: 'Please select a valid date and slot.' });
      return;
    }

    setBookingState({ loading: true, error: null });
    try {
      const result = await apiRequest<{ booking: { id: string } }>('/api/payments/checkout', {
        method: 'POST',
        body: JSON.stringify({ venueId: venue.id, date: selectedDate, slotId: selectedSlot.id }),
      });
      router.push(`/bookings?bookingId=${encodeURIComponent(result.booking.id)}&confirmed=1`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to complete the mock payment.';
      setBookingState({ loading: false, error: message });
      if (message.toLowerCase().includes('sign in')) {
        router.push(`/login?next=${encodeURIComponent(`/venues/${venue.id}`)}`);
      }
    }
  };

  if (venueLoading) {
    return <main className="container-shell py-16"><p className="text-slate-600">Loading venue...</p></main>;
  }

  if (!venue) {
    return (
      <main className="container-shell py-16">
        <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-soft">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">{venueError ? 'Venue unavailable' : 'Venue not found'}</p>
          <h1 className="mt-2 text-3xl font-black text-slate-900">{venueError || 'This ground is unavailable.'}</h1>
          <Link href="/venues" className="mt-6 inline-flex rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white">
            Back to venues
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="container-shell py-12 sm:py-16">
      <div className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-soft">
        {venue.image ? (
          <div className="h-72 w-full overflow-hidden border-b border-slate-200 bg-slate-200">
            <img src={venue.image} alt={venue.name} className="h-full w-full object-cover" />
          </div>
        ) : (
          <div className="h-72 bg-gradient-to-br from-emerald-200 via-emerald-100 to-slate-200 p-6">
            <div className="flex h-full items-end justify-between gap-4">
              <div>
                <span className="rounded-full border border-emerald-700/20 bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
                  {venue.type}
                </span>
                <h1 className="mt-4 text-3xl font-black text-slate-900 sm:text-4xl">{venue.name}</h1>
              </div>
              <div className="rounded-2xl border border-white/80 bg-white/70 px-4 py-3 text-right backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Price per slot</p>
                <p className="mt-1 text-2xl font-black text-slate-900">${venue.pricePerSlot}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.25fr_0.75fr]">
          <div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
                <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                {venue.location}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
                <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                {venue.rating} rating
              </span>
            </div>

            <h1 className="mt-6 text-3xl font-black text-slate-900 sm:text-4xl">{venue.name}</h1>
            <p className="mt-6 text-base leading-7 text-slate-600">{venue.description}</p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <CalendarDays className="h-4 w-4 text-emerald-600" />
                  Area
                </div>
                <p className="mt-2 text-lg font-black text-slate-900">{venue.area}</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Timer className="h-4 w-4 text-emerald-600" />
                  Ground type
                </div>
                <p className="mt-2 text-lg font-black text-slate-900">{venue.type}</p>
              </div>
            </div>

            <div className="mt-8">
              <h2 className="text-xl font-black text-slate-900">Facilities</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {venue.facilities.map((facility) => (
                  <span key={facility} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700">
                    {facility}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">Select date</p>
                  <h2 className="mt-2 text-xl font-black text-slate-900">Availability</h2>
                </div>
                <div className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700">
                  {selectedDate ? new Date(`${selectedDate}T00:00:00`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : 'Choose date'}
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {dateOptions.map((dateOption: { value: string; label: string }) => (
                  <button
                    key={dateOption.value}
                    type="button"
                    onClick={() => {
                      setSelectedDate(dateOption.value);
                      setSelectedSlotId(null);
                    }}
                    className={`rounded-full border px-3 py-2 text-sm font-semibold transition ${
                      selectedDate === dateOption.value
                        ? 'border-emerald-600 bg-emerald-600 text-white'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {dateOption.label}
                  </button>
                ))}
              </div>

              <div className="mt-6">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Time slots</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {slotsLoading ? <p className="text-sm text-slate-500">Loading availability...</p> : slots.length === 0 ? <p className="text-sm text-slate-500">No slots are available for this date.</p> : slots.map((slot) => {
                    const isSelected = selectedSlotId === slot.id;
                    const isAvailable = slot.status === 'available';

                    return (
                      <button
                        key={slot.id}
                        type="button"
                        disabled={!isAvailable}
                        onClick={() => setSelectedSlotId(slot.id)}
                        className={`rounded-2xl border p-3 text-left transition ${
                          !isAvailable
                            ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                            : isSelected
                              ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                              : 'border-slate-200 bg-white text-slate-900 hover:border-emerald-300 hover:bg-emerald-50'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold">{slot.startTime}</span>
                          <span className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${
                            isAvailable ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'
                          }`}>
                            {isAvailable ? 'Available' : slot.status === 'unavailable' ? 'Unavailable' : 'Booked'}
                          </span>
                        </div>
                        <p className="mt-2 text-xs text-slate-500">{slot.endTime}{slot.price ? ` · $${slot.price}` : ''}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <aside className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">Booking summary</p>
            <div className="mt-5 space-y-4 text-sm text-slate-600">
              <div className="flex items-center justify-between">
                <span>Ground</span>
                <strong className="text-slate-900">{venue.name}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span>Area</span>
                <strong className="text-slate-900">{venue.area}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span>Date</span>
                <strong className="text-slate-900">{selectedDate ? new Date(`${selectedDate}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not selected'}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span>Time</span>
                <strong className="text-slate-900">{selectedSlot ? `${selectedSlot.startTime} - ${selectedSlot.endTime}` : 'Not selected'}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span>Slot price</span>
                <strong className="text-slate-900">${(selectedSlot?.price ?? venue.pricePerSlot).toFixed(2)}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span>Platform commission</span>
                <strong className="text-slate-900">$1.00</strong>
              </div>
              <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                <span>Total price</span>
                <strong className="text-slate-900">${totalAmount.toFixed(2)}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span>Required advance</span>
                <strong className="text-slate-900">${advanceAmount.toFixed(2)}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span>Remaining cash</span>
                <strong className="text-slate-900">${remainingAmount.toFixed(2)}</strong>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              <div className="flex items-center gap-2 font-semibold">
                <CheckCircle2 className="h-4 w-4" />
                {selectedSlot ? 'Advance payment required to confirm' : 'Choose an available slot'}
              </div>
              <p className="mt-2">{selectedSlot ? `Selected ${selectedSlot.startTime} on ${new Date(`${selectedDate}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}. Advance ${advanceAmount.toFixed(2)} is processed through the mock checkout and the remaining ${remainingAmount.toFixed(2)} is cash payable at the venue.` : 'Available slots are displayed for the selected date only.'}</p>
            </div>

            {bookingState.error ? (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {bookingState.error}
              </div>
            ) : null}

            <button
              type="button"
              disabled={!selectedSlot || bookingState.loading}
              onClick={handleConfirmBooking}
              className={`mt-6 inline-flex w-full items-center justify-center rounded-full px-5 py-3 text-sm font-semibold text-white transition ${
                !selectedSlot || bookingState.loading ? 'pointer-events-none bg-slate-300' : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {bookingState.loading ? 'Booking...' : 'Confirm Booking'}
            </button>

            <Link
              href="/venues"
              className="mt-3 inline-flex w-full items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
            >
              Back to venue list
            </Link>
          </aside>
        </div>
      </div>
    </main>
  );
}
