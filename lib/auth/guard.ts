/**
 * Guardas de sessão para Server Components / Server Actions do painel.
 * Server-only.
 */
import { redirect } from 'next/navigation';
import { getSession, type Role, type SessionData } from '@/lib/auth/session';

export function requireSession(): SessionData {
  const s = getSession();
  if (!s) redirect('/admin/login');
  return s;
}

export function requireRole(roles: Role | Role[]): SessionData {
  const s = requireSession();
  const allowed = Array.isArray(roles) ? roles : [roles];
  if (!allowed.includes(s.role)) {
    // Cada papel cai na sua própria home se tentar acessar outra área.
    redirect('/admin');
  }
  return s;
}
