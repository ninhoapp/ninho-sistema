import { redirect } from 'next/navigation';
import { getSession, homeForRole } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export default async function AdminIndex() {
  const session = await getSession();
  if (!session) redirect('/admin/login');
  redirect(homeForRole(session.role));
}
