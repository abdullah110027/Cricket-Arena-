'use client';

import Link from 'next/link';
import { useEffect, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ApiError, apiRequest } from '@/lib/api-client';

type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'OWNER' | 'ADMIN';
};

const ownerLinks = [
  { href: '/owner', label: 'Overview' },
  { href: '/owner/venues', label: 'My Venues' },
  { href: '/owner/slots', label: 'Manage Slots' },
  { href: '/owner/bookings', label: 'Bookings' },
];

export default function OwnerLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);
  const [accessError, setAccessError] = useState('');

  useEffect(() => {
    let active = true;
    apiRequest<{ user: CurrentUser }>('/api/auth/session')
      .then(({ user }) => {
        if (!active) return;
        if (user.role !== 'OWNER') {
          router.replace('/venues');
          return;
        }
        setAuthorized(true);
      })
      .catch((error: unknown) => {
        if (!active) return;
        if (error instanceof ApiError && error.status === 401) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
        else setAccessError(error instanceof Error ? error.message : 'Unable to verify owner access.');
      });
    return () => { active = false; };
  }, [router]);

  if (!authorized) {
    return (
      <main className="container-shell py-16">
        <div role={accessError ? 'alert' : undefined} className={`rounded-2xl border p-8 ${accessError ? 'border-red-200 bg-red-50 text-red-800' : 'border-slate-200 bg-white text-slate-600'}`}>{accessError || 'Checking owner access...'}</div>
      </main>
    );
  }

  return (
    <>
      <nav className="border-b border-slate-200 bg-white">
        <div className="container-shell flex flex-wrap items-center gap-2 py-3">
          {ownerLinks.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${active ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </nav>
      {children}
    </>
  );
}
