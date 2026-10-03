'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiRequest } from '@/lib/api-client';

type OwnerVenue = {
  id: string;
  name: string;
  area: string;
  location: string;
  description: string;
  type: 'Indoor' | 'Outdoor';
  pricePerSlot: number;
  facilities: string[];
  slotDuration: number;
  active: boolean;
};

type ManagedSlot = {
  id: string;
  venueId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'available' | 'unavailable' | 'booked';
  price: number;
};

const times = Array.from({ length: 13 }, (_, index) => `${String(index + 8).padStart(2, '0')}:00`);
const inputClass = 'rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-600';

export default function OwnerSlotsPage() {
  const [venues, setVenues] = useState<OwnerVenue[]>([]);
  const [slots, setSlots] = useState<ManagedSlot[]>([]);
  const [venueId, setVenueId] = useState('');
  const [date, setDate] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  });
  const [price, setPrice] = useState('');
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadSlots = async (selectedVenueId: string, selectedDate: string) => {
    if (!selectedVenueId) {
      setSlots([]);
      return;
    }
    try {
      const result = await apiRequest<{ slots: ManagedSlot[] }>(`/api/owner/slots?venueId=${encodeURIComponent(selectedVenueId)}&date=${encodeURIComponent(selectedDate)}`);
      setSlots(result.slots);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load slots.');
    }
  };

  useEffect(() => {
    apiRequest<{ venues: OwnerVenue[] }>('/api/owner/venues')
      .then(({ venues: owned }) => {
        const requestedVenue = new URLSearchParams(window.location.search).get('venue');
        const initialVenue = owned.some((venue) => venue.id === requestedVenue) ? requestedVenue! : owned[0]?.id ?? '';
        setVenues(owned);
        setVenueId(initialVenue);
        setPrice(String(owned.find((venue) => venue.id === initialVenue)?.pricePerSlot ?? ''));
        if (initialVenue) {
          void loadSlots(initialVenue, date);
        }
      })
      .catch((loadError: unknown) => setError(loadError instanceof Error ? loadError.message : 'Unable to load your venues.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (venueId) {
      void loadSlots(venueId, date);
    }
  }, [venueId, date]);

  const selectedVenue = venues.find((venue) => venue.id === venueId);
  const visibleSlots = useMemo(() => slots.filter((slot) => slot.date === date), [slots, date]);

  const selectVenue = (id: string) => {
    setVenueId(id);
    setPrice(String(venues.find((venue) => venue.id === id)?.pricePerSlot ?? ''));
  };

  const createSlots = async () => {
    setError('');
    setNotice('');
    try {
      const result = await apiRequest<{ slots: ManagedSlot[] }>('/api/owner/slots', {
        method: 'POST',
        body: JSON.stringify({ venueId, date, startTimes: selectedTimes, price: Number(price) }),
      });
      setSlots(result.slots);
      setNotice('Slots saved. Existing time slots were left unchanged.');
      setSelectedTimes([]);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Unable to create slots.');
    }
  };

  const toggleSlot = async (slot: ManagedSlot) => {
    try {
      await apiRequest(`/api/owner/slots/${encodeURIComponent(slot.id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: slot.status === 'unavailable' ? 'available' : 'unavailable' }),
      });
      await loadSlots(venueId, date);
    } catch (slotError) {
      setError(slotError instanceof Error ? slotError.message : 'Unable to update slot.');
    }
  };

  if (loading) return <main className="container-shell py-12 text-slate-600">Loading slot manager...</main>;

  return (
    <main className="container-shell py-10 sm:py-14">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">Availability</p>
      <h1 className="mt-2 text-3xl font-black text-slate-900">Manage Slots</h1>

      {error ? <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div> : null}
      {notice ? <div role="status" className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{notice}</div> : null}

      {venues.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center"><p className="font-semibold text-slate-900">Add a venue first</p><p className="mt-1 text-sm text-slate-600">Slot schedules belong to a venue in your account.</p><a href="/owner/venues?new=1" className="mt-4 inline-flex rounded-full bg-emerald-700 px-4 py-2 text-sm font-semibold text-white">Add venue</a></div>
      ) : (
        <>
          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">Venue<select className={inputClass} value={venueId} onChange={(event) => selectVenue(event.target.value)}>{venues.map((venue) => <option key={venue.id} value={venue.id}>{venue.name}</option>)}</select></label>
              <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">Date<input className={inputClass} type="date" min={new Date().toISOString().slice(0, 10)} value={date} onChange={(event) => setDate(event.target.value)} /></label>
              <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">Price per slot<input className={inputClass} type="number" min="0.01" step="0.01" value={price} onChange={(event) => setPrice(event.target.value)} /></label>
            </div>
            <fieldset className="mt-6">
              <legend className="text-sm font-semibold text-slate-800">Start times</legend>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
                {times.map((time) => <label key={time} className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700"><input type="checkbox" checked={selectedTimes.includes(time)} onChange={(event) => setSelectedTimes((current) => event.target.checked ? [...current, time] : current.filter((item) => item !== time))} />{time}</label>)}
              </div>
            </fieldset>
            <p className="mt-3 text-xs text-slate-500">Each slot uses this venue&apos;s {selectedVenue?.slotDuration ?? 90}-minute duration. Existing slots will not be overwritten.</p>
            <button type="button" disabled={!selectedTimes.length || !date || !venueId} onClick={createSlots} className="mt-5 rounded-full bg-emerald-700 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300">Create selected slots</button>
          </section>

          <section className="mt-10">
            <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-xl font-black text-slate-900">Slots for {date}</h2><p className="mt-1 text-sm text-slate-600">{selectedVenue?.name}</p></div></div>
            {visibleSlots.length === 0 ? <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white p-7 text-sm text-slate-600">No slots for this date. Select times above to create availability.</div> : (
              <div className="mt-4 divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
                {visibleSlots.map((slot) => <div key={slot.id} className="flex flex-wrap items-center justify-between gap-4 p-4"><div><p className="font-semibold text-slate-900">{slot.startTime}–{slot.endTime}</p><p className="mt-1 text-sm text-slate-600">${slot.price} · {slot.date}</p></div><div className="flex items-center gap-3"><span className={`text-sm font-semibold ${slot.status === 'available' ? 'text-emerald-800' : 'text-slate-500'}`}>{slot.status === 'available' ? 'Available' : 'Unavailable'}</span><button type="button" onClick={() => toggleSlot(slot)} className="rounded-full border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700">{slot.status === 'available' ? 'Mark unavailable' : 'Make available'}</button></div></div>)}
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}
