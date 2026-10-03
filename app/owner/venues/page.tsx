'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api-client';
import type { VenueType } from '@/lib/venues';

type OwnerVenue = {
  id: string;
  name: string;
  area: string;
  location: string;
  description: string;
  type: VenueType;
  pricePerSlot: number;
  facilities: string[];
  slotDuration: number;
  active: boolean;
};

const fieldClass = 'w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-600';

export default function OwnerVenuesPage() {
  const router = useRouter();
  const [venues, setVenues] = useState<OwnerVenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState('');
  const [detailsId, setDetailsId] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', area: '', location: '', description: '', type: 'Outdoor' as VenueType, pricePerSlot: '', facilities: '', slotDuration: '90' });

  const refresh = async () => {
    try {
      const result = await apiRequest<{ venues: OwnerVenue[] }>('/api/owner/venues');
      setVenues(result.venues);
      setError('');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load venues.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    if (new URLSearchParams(window.location.search).get('new') === '1') setFormOpen(true);
  }, []);

  const startAdd = () => {
    setEditingId('');
    setError('');
    setForm({ name: '', area: '', location: '', description: '', type: 'Outdoor', pricePerSlot: '', facilities: '', slotDuration: '90' });
    setFormOpen(true);
  };

  const startEdit = (venue: OwnerVenue) => {
    setEditingId(venue.id);
    setError('');
    setForm({ name: venue.name, area: venue.area, location: venue.location, description: venue.description, type: venue.type, pricePerSlot: String(venue.pricePerSlot), facilities: venue.facilities.join(', '), slotDuration: String(venue.slotDuration) });
    setFormOpen(true);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    try {
      const payload = {
      ...form,
      pricePerSlot: Number(form.pricePerSlot),
      facilities: form.facilities.split(',').map((item) => item.trim()).filter(Boolean),
      slotDuration: Number(form.slotDuration),
      };
      const path = editingId ? `/api/owner/venues/${encodeURIComponent(editingId)}` : '/api/owner/venues';
      await apiRequest(path, { method: editingId ? 'PATCH' : 'POST', body: JSON.stringify(payload) });
      setFormOpen(false);
      await refresh();
      router.replace('/owner/venues');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to save venue.');
    }
  };

  const toggleActive = async (venue: OwnerVenue) => {
    try {
      await apiRequest(`/api/owner/venues/${encodeURIComponent(venue.id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ active: !venue.active }),
      });
      await refresh();
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : 'Unable to update venue status.');
    }
  };

  if (loading) return <main className="container-shell py-12 text-slate-600">Loading your venues...</main>;

  return (
    <main className="container-shell py-10 sm:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">Owner venues</p><h1 className="mt-2 text-3xl font-black text-slate-900">My Venues</h1></div>
        <button type="button" onClick={startAdd} className="rounded-full bg-emerald-700 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800">Add venue</button>
      </div>

      {error ? <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div> : null}

      {formOpen ? (
        <form onSubmit={submit} className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
          <div className="flex items-center justify-between gap-3"><h2 className="text-xl font-black text-slate-900">{editingId ? 'Edit venue' : 'Add venue'}</h2><button type="button" onClick={() => setFormOpen(false)} className="text-sm font-semibold text-slate-600 hover:text-slate-900">Cancel</button></div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">Venue name<input required className={`${fieldClass} mt-1`} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
            <label className="text-sm font-medium text-slate-700">Area<input required className={`${fieldClass} mt-1`} value={form.area} onChange={(event) => setForm({ ...form, area: event.target.value })} /></label>
            <label className="text-sm font-medium text-slate-700">Location<input required className={`${fieldClass} mt-1`} value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} /></label>
            <label className="text-sm font-medium text-slate-700">Indoor / Outdoor<select className={`${fieldClass} mt-1`} value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as VenueType })}><option>Indoor</option><option>Outdoor</option></select></label>
            <label className="text-sm font-medium text-slate-700">Price per slot<input required min="0.01" step="0.01" type="number" className={`${fieldClass} mt-1`} value={form.pricePerSlot} onChange={(event) => setForm({ ...form, pricePerSlot: event.target.value })} /></label>
            <label className="text-sm font-medium text-slate-700">Slot duration (minutes)<input required min="1" step="1" type="number" className={`${fieldClass} mt-1`} value={form.slotDuration} onChange={(event) => setForm({ ...form, slotDuration: event.target.value })} /></label>
            <label className="text-sm font-medium text-slate-700 sm:col-span-2">Facilities <span className="font-normal text-slate-500">(comma-separated)</span><input className={`${fieldClass} mt-1`} value={form.facilities} onChange={(event) => setForm({ ...form, facilities: event.target.value })} placeholder="Floodlights, parking, changing rooms" /></label>
            <label className="text-sm font-medium text-slate-700 sm:col-span-2">Description<textarea required rows={3} className={`${fieldClass} mt-1`} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
          </div>
          <button type="submit" className="mt-5 rounded-full bg-emerald-700 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800">{editingId ? 'Save changes' : 'Create venue'}</button>
        </form>
      ) : null}

      {venues.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center"><h2 className="font-bold text-slate-900">No venues yet</h2><p className="mt-2 text-sm text-slate-600">Add your first venue to manage its slots and bookings.</p><button onClick={startAdd} type="button" className="mt-4 rounded-full bg-emerald-700 px-4 py-2 text-sm font-semibold text-white">Add a venue</button></div>
      ) : (
        <div className="mt-6 space-y-4">
          {venues.map((venue) => (
            <article key={venue.id} className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div><div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-black text-slate-900">{venue.name}</h2><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${venue.active ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>{venue.active ? 'Active' : 'Inactive'}</span></div><p className="mt-1 text-sm text-slate-600">{venue.area} · {venue.location} · {venue.type} · ${venue.pricePerSlot}/slot</p></div>
                <div className="flex flex-wrap gap-2"><button type="button" onClick={() => setDetailsId(detailsId === venue.id ? '' : venue.id)} className="rounded-full border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700">{detailsId === venue.id ? 'Hide details' : 'View details'}</button><button type="button" onClick={() => startEdit(venue)} className="rounded-full border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700">Edit</button><button type="button" onClick={() => toggleActive(venue)} className="rounded-full border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700">{venue.active ? 'Deactivate' : 'Activate'}</button><Link href={`/owner/slots?venue=${encodeURIComponent(venue.id)}`} className="rounded-full bg-emerald-700 px-3 py-2 text-sm font-semibold text-white">Manage slots</Link></div>
              </div>
              {detailsId === venue.id ? <div className="mt-5 border-t border-slate-200 pt-4 text-sm text-slate-700"><p>{venue.description}</p><p className="mt-2"><strong>Slot length:</strong> {venue.slotDuration} minutes</p><p className="mt-2"><strong>Facilities:</strong> {venue.facilities.length ? venue.facilities.join(', ') : 'None listed'}</p></div> : null}
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
