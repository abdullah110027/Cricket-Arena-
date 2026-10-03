import Link from 'next/link';
import { MapPin, ShieldCheck, Sparkles } from 'lucide-react';

const links = [
  { href: '/', label: 'Home' },
  { href: '/venues', label: 'Venues' },
  { href: '/bookings', label: 'Bookings' },
  { href: '/chat', label: 'AI Assistant' },
  { href: '/owner', label: 'Owner' },
  { href: '/admin', label: 'Admin' },
];

export function Navbar() {
  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-arena-green text-white shadow-soft">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-lg font-black tracking-tight text-slate-900">Cricket Arena</p>
            <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">Book smarter</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="transition hover:text-slate-900">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 sm:flex">
            <MapPin className="h-3.5 w-3.5 text-arena-green" />
            Lahore, PK
          </div>
          <Link
            href="/login"
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="rounded-full bg-arena-green px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-emerald-600"
          >
            Register
          </Link>
        </div>
      </div>
    </header>
  );
}
