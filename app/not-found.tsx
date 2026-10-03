import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="container-shell py-20 text-center">
      <div className="mx-auto max-w-lg rounded-3xl border border-slate-200 bg-white p-10 shadow-soft">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">Not found</p>
        <h1 className="mt-2 text-4xl font-black text-slate-900">This page is not live yet.</h1>
        <p className="mt-4 text-slate-600">The route exists in the architecture, but the feature is intentionally deferred to a later phase.</p>
        <Link href="/" className="mt-6 inline-flex rounded-full bg-arena-green px-5 py-3 text-sm font-semibold text-white">
          Back to home
        </Link>
      </div>
    </main>
  );
}
