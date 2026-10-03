'use client';

import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api-client';

type VenueApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

type AdminVenue = {
  id: string;
  name: string;
  area: string;
  location: string;
  description: string;
  type: 'Indoor' | 'Outdoor';
  pricePerSlot: number;
  facilities: string[];
  approvalStatus: VenueApprovalStatus;
  active: boolean;
  ownerId: string | null;
  ownerName: string;
  createdAt?: string | null;
};

type AdminDashboardData = {
  stats: {
    totalUsers: number;
    totalOwners: number;
    totalVenues: number;
    totalBookings: number;
    pendingApprovals: number;
    totalCommission: number;
  };
  venues: {
    pending: AdminVenue[];
    approved: AdminVenue[];
    rejected: AdminVenue[];
  };
  recentBookings: Array<{
    id: string;
    userName: string;
    venueName: string;
    totalAmount: number;
    commissionAmount: number;
    paymentStatus: string;
    advancePaymentStatus: string;
    remainingPaymentStatus: string;
    bookingStatus: string;
  }>;
};

const approvalStyles: Record<VenueApprovalStatus, string> = {
  PENDING: 'bg-amber-50 text-amber-800 border-amber-200',
  APPROVED: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  REJECTED: 'bg-rose-50 text-rose-800 border-rose-200',
};

export function AdminDashboard() {
  const [dashboard, setDashboard] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const result = await apiRequest<AdminDashboardData>('/api/admin/dashboard');
      setDashboard(result);
      setError('');
    } catch (loadError: unknown) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load the admin dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboard();
  }, []);

  const handleVenueUpdate = async (venueId: string, updates: { approvalStatus?: VenueApprovalStatus; active?: boolean }) => {
    setUpdating(venueId);
    try {
      await apiRequest<{ venue: AdminVenue }>(`/api/admin/venues/${encodeURIComponent(venueId)}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
      await loadDashboard();
    } catch (updateError: unknown) {
      setError(updateError instanceof Error ? updateError.message : 'Unable to update venue status.');
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <main className="container-shell py-12">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-slate-600">Loading admin dashboard…</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="container-shell py-12">
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-8 text-red-800">{error}</div>
      </main>
    );
  }

  const stats = dashboard?.stats ?? {
    totalUsers: 0,
    totalOwners: 0,
    totalVenues: 0,
    totalBookings: 0,
    pendingApprovals: 0,
    totalCommission: 0,
  };

  const sections: { key: keyof AdminDashboardData['venues']; label: string; description: string }[] = [
    { key: 'pending', label: 'Pending approvals', description: 'Venues waiting for review' },
    { key: 'approved', label: 'Approved venues', description: 'Visible to players in search' },
    { key: 'rejected', label: 'Rejected venues', description: 'Disabled from search and review' },
  ];

  return (
    <main className="container-shell py-10 sm:py-14">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">Admin dashboard</p>
        <h1 className="mt-2 text-3xl font-black text-slate-900">Platform control center</h1>
      </div>

      <section aria-label="Platform metrics" className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {[
          { label: 'Total users', value: stats.totalUsers },
          { label: 'Total owners', value: stats.totalOwners },
          { label: 'Total venues', value: stats.totalVenues },
          { label: 'Total bookings', value: stats.totalBookings },
          { label: 'Pending approvals', value: stats.pendingApprovals },
          { label: 'Commission total', value: `$${stats.totalCommission.toFixed(2)}` },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
            <p className="text-sm font-medium text-slate-500">{label}</p>
            <p className="mt-4 text-3xl font-black text-slate-900">{value}</p>
          </div>
        ))}
      </section>

      <section className="mt-10 rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-slate-900">Recent booking payments</h2>
            <p className="text-sm text-slate-600">Payment status and commission snapshots</p>
          </div>
        </div>
        {dashboard?.recentBookings && dashboard.recentBookings.length > 0 ? (
          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
            <div className="grid grid-cols-5 gap-3 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <span>User</span>
              <span>Venue</span>
              <span>Total</span>
              <span>Payment</span>
              <span>Commission</span>
            </div>
            {dashboard.recentBookings.map((booking) => (
              <div key={booking.id} className="grid grid-cols-5 gap-3 border-t border-slate-200 px-4 py-3 text-sm text-slate-700">
                <span>{booking.userName}</span>
                <span>{booking.venueName}</span>
                <span>${booking.totalAmount.toFixed(2)}</span>
                <span>{booking.paymentStatus}</span>
                <span>${booking.commissionAmount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">No recent booking payments yet.</div>
        )}
      </section>

      <section className="mt-10 space-y-8">
        {sections.map(({ key, label, description }) => {
          const venues = dashboard?.venues[key] ?? [];
          return (
            <div key={key} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black text-slate-900">{label}</h2>
                  <p className="text-sm text-slate-600">{description}</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{venues.length}</span>
              </div>

              {venues.length === 0 ? (
                <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
                  No venues in this state.
                </div>
              ) : (
                <div className="mt-5 space-y-4">
                  {venues.map((venue) => (
                    <article key={venue.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-black text-slate-900">{venue.name}</h3>
                            <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${approvalStyles[venue.approvalStatus]}`}>
                              {venue.approvalStatus}
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-slate-600">{venue.area} · {venue.type} · {venue.location}</p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${venue.active ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>
                          {venue.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>

                      <p className="mt-4 text-sm leading-6 text-slate-700">{venue.description}</p>

                      <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-600">
                        <span className="rounded-full bg-white px-2.5 py-1">Owner: {venue.ownerName}</span>
                        <span className="rounded-full bg-white px-2.5 py-1">${venue.pricePerSlot.toFixed(2)}/slot</span>
                        {venue.facilities.length > 0 ? <span className="rounded-full bg-white px-2.5 py-1">{venue.facilities.join(' · ')}</span> : null}
                      </div>

                      <div className="mt-5 flex flex-wrap gap-2">
                        {venue.approvalStatus !== 'APPROVED' ? (
                          <button
                            type="button"
                            onClick={() => handleVenueUpdate(venue.id, { approvalStatus: 'APPROVED' })}
                            disabled={updating === venue.id}
                            className="rounded-full bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
                          >
                            {updating === venue.id ? 'Updating…' : 'Approve'}
                          </button>
                        ) : null}

                        {venue.approvalStatus !== 'REJECTED' ? (
                          <button
                            type="button"
                            onClick={() => handleVenueUpdate(venue.id, { approvalStatus: 'REJECTED' })}
                            disabled={updating === venue.id}
                            className="rounded-full border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-60"
                          >
                            Reject
                          </button>
                        ) : null}

                        <button
                          type="button"
                          onClick={() => handleVenueUpdate(venue.id, { active: !venue.active })}
                          disabled={updating === venue.id}
                          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-60"
                        >
                          {venue.active ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </section>
    </main>
  );
}
