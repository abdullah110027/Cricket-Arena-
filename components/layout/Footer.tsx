import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div>
          <p className="text-lg font-black text-slate-900">Cricket Arena</p>
          <p className="mt-3 text-sm text-slate-600">
            Discover premium cricket venues, manage your bookings, and simplify ground access.
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Explore</p>
          <ul className="mt-4 space-y-2 text-sm text-slate-600">
            <li><Link href="/venues">All venues</Link></li>
            <li><Link href="/bookings">My bookings</Link></li>
            <li><Link href="/chat">AI assistant</Link></li>
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">For owners</p>
          <ul className="mt-4 space-y-2 text-sm text-slate-600">
            <li><Link href="/owner">Owner dashboard</Link></li>
            <li><Link href="/owner/venues">Manage venues</Link></li>
            <li><Link href="/owner/bookings">Manage bookings</Link></li>
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Admin</p>
          <ul className="mt-4 space-y-2 text-sm text-slate-600">
            <li><Link href="/admin">Overview</Link></li>
            <li><Link href="/admin">Venue approvals</Link></li>
            <li><Link href="/admin">Platform reports</Link></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
