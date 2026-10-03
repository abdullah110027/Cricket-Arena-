'use client';

import { type FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api-client';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'USER' as 'USER' | 'OWNER' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await apiRequest('/api/auth/register', { method: 'POST', body: JSON.stringify(form) });
      router.push(form.role === 'OWNER' ? '/owner' : '/bookings');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to create account.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="container-shell py-16">
      <div className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">Create account</p>
        <h1 className="mt-2 text-3xl font-black text-slate-900">Register</h1>
        <form onSubmit={submit} className="mt-8 space-y-5">
          <label className="block text-sm font-medium text-slate-700">Name<input required maxLength={120} autoComplete="name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-emerald-500 focus:bg-white" /></label>
          <label className="block text-sm font-medium text-slate-700">Email<input required type="email" autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-emerald-500 focus:bg-white" /></label>
          <label className="block text-sm font-medium text-slate-700">Password<input required minLength={8} type="password" autoComplete="new-password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-emerald-500 focus:bg-white" /></label>
          <label className="block text-sm font-medium text-slate-700">Account type<select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as 'USER' | 'OWNER' })} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-emerald-500 focus:bg-white"><option value="USER">Player</option><option value="OWNER">Venue owner</option></select></label>
          {error ? <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
          <button type="submit" disabled={submitting} className="w-full rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:bg-slate-300">{submitting ? 'Creating account...' : 'Create account'}</button>
        </form>
      </div>
    </main>
  );
}
