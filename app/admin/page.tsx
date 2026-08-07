import { redirect } from 'next/navigation';
import { getSession, homeForRole } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export default function AdminIndex() {
  const session = getSession();
  if (!session) redirect('/admin/login');
  redirect(homeForRole(session.role));
}
