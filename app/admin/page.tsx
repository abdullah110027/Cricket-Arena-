import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/lib/session';
import { AdminDashboard } from '@/components/admin/AdminDashboard';

export default async function AdminPage() {
  const user = await getAuthenticatedUser();
  if (!user) redirect('/login?next=/admin');
  if (user.role !== 'ADMIN') redirect('/venues');

  return <AdminDashboard />;
}
