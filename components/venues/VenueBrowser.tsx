'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, MapPin, Star, Timer } from 'lucide-react';
import { apiRequest } from '@/lib/api-client';
import { venueAreas, type Venue } from '@/lib/venues';

export function VenueBrowser({ showHero = true }: { showHero?: boolean }) {
  const [selectedArea, setSelectedArea] = useState('All Areas');
  const [isLoading, setIsLoading] = useState(true);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    apiRequest<{ venues: Venue[] }>('/api/venues')
      .then((result) => {
        if (active) setVenues(result.venues);
      })
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Unable to load venues.');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => { active = false; };
  }, []);

  const filteredVenues = useMemo<Venue[]>(() => {
    if (selectedArea === 'All Areas') {
      return venues;
    }

    return venues.filter((venue) => venue.area === selectedArea);
  }, [selectedArea, venues]);

  return (
    <>
      {showHero && (
        <section className="container-shell py-12 sm:py-16 lg:py-20">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <span className="badge">Premium cricket venues</span>
              <h1 className="mt-5 max-w-xl text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
                Find & Book Your Cricket Ground
              </h1>
              <p className="mt-5 max-w-xl text-lg text-slate-600">
                Discover top-quality indoor and outdoor cricket grounds near your preferred area and secure a slot in minutes.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                {['All Areas', ...venueAreas].map((area) => (
                  <button
                    key={area}
                    type="button"
                    onClick={() => setSelectedArea(area)}
                    className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                      selectedArea === area
                        ? 'border-emerald-600 bg-emerald-600 text-white shadow-soft'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:text-slate-900'
                    }`}
                  >
                    {area}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-[30px] border border-slate-200 bg-slate-900 p-6 text-white shadow-soft">
              <div className="flex items-center justify-between text-sm text-slate-300">
                <span>Popular in your area</span>
                <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1">Live</span>
              </div>
              <div className="mt-6 space-y-4">
                <div>
                  <p className="text-2xl font-black">Greenfield Indoor Arena</p>
                  <p className="mt-2 flex items-center gap-2 text-sm text-slate-300">
                    <MapPin className="h-4 w-4 text-emerald-400" />
                    DHA, Lahore
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-2xl bg-white/5 p-3">
                    <p className="text-slate-300">Type</p>
                    <p className="mt-1 font-semibold">Indoor</p>
                  </div>
                  <div className="rounded-2xl bg-white/5 p-3">
                    <p className="text-slate-300">Price</p>
                    <p className="mt-1 font-semibold">$28/slot</p>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3">
                  <div>
                    <p className="text-sm text-emerald-200">Next slot</p>
                    <p className="text-lg font-bold">6:00 PM</p>
                  </div>
                  <Link
                    href="/venues/greenfield-indoor-arena"
                    className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                  >
                    View Ground
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="container-shell pb-16">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">Available grounds</p>
            <h2 className="mt-2 text-3xl font-black text-slate-900">Cricket facilities</h2>
          </div>
          <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm">
            {filteredVenues.length} venue{filteredVenues.length === 1 ? '' : 's'}
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="animate-pulse rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
                <div className="h-40 rounded-2xl bg-slate-200" />
                <div className="mt-4 h-5 w-2/3 rounded bg-slate-200" />
                <div className="mt-3 h-4 w-1/2 rounded bg-slate-200" />
                <div className="mt-6 h-10 rounded-full bg-slate-200" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div role="alert" className="rounded-3xl border border-red-200 bg-red-50 p-10 text-center">
            <p className="font-bold text-red-900">Venue data is unavailable</p>
            <p className="mt-2 text-sm text-red-800">{error}</p>
          </div>
        ) : filteredVenues.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-soft">
            <p className="text-xl font-bold text-slate-900">No grounds available</p>
            <p className="mt-2 text-slate-600">Try another area to discover more cricket venues in your preferred location.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredVenues.map((venue) => (
              <article key={venue.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-soft">
                <div className="h-44 bg-gradient-to-br from-emerald-200 via-emerald-100 to-slate-200 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <span className="rounded-full border border-emerald-700/20 bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
                      {venue.type}
                    </span>
                    <span className="rounded-full border border-slate-200 bg-white/80 px-2.5 py-1 text-xs font-medium text-slate-700">
                      {venue.slotsAvailable} slots
                    </span>
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-black text-slate-900">{venue.name}</h3>
                      <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                        <MapPin className="h-4 w-4 text-emerald-600" />
                        {venue.area}
                      </div>
                    </div>
                  </div>

                  <p className="mt-3 text-sm leading-6 text-slate-600">{venue.description}</p>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      {venue.rating}
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-[0.14em] text-slate-500">From</p>
                      <p className="text-2xl font-black text-slate-900">${venue.pricePerSlot}</p>
                    </div>
                  </div>

                  <div className="mt-5">
                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      <Timer className="h-3.5 w-3.5 text-emerald-600" />
                      Facilities
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {venue.facilities.map((facility) => (
                        <span key={facility} className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600">
                          {facility}
                        </span>
                      ))}
                    </div>
                  </div>

                  <Link
                    href={`/venues/${venue.id}`}
                    className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                  >
                    View Ground
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
