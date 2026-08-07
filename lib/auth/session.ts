/**
 * Ninho · Sessão do painel
 *
 * Cookie httpOnly assinado por HMAC-SHA256 (sem dependência externa).
 * Payload: { sub, username, role, name }. Validade 7 dias.
 * Server-only (usa next/headers + crypto).
 *
 * Papéis: 'admin' e 'conversor'. O Ninho não tem influencer — não há links de
 * divulgação nem atribuição de instalação. A comissão do conversor sai dos
 * leads que ele marca como convertido (lead_outcomes), não de código promo.
 */
import { cookies } from 'next/headers';
import { createHmac, timingSafeEqual } from 'crypto';
import { SESSION_COOKIE } from '@/lib/auth/cookie';

// Reexportado por conveniência de quem já roda em runtime Node. O middleware
// (Edge) precisa importar direto de '@/lib/auth/cookie' — ver o comentário lá.
export { SESSION_COOKIE };

const MAX_AGE = 60 * 60 * 24 * 7; // 7 dias

export type Role = 'admin' | 'conversor';

export interface SessionData {
  sub: string; // id do perfil na tabela do painel
  username: string;
  role: Role;
  name: string;
  exp: number; // epoch seconds
}

function secret(): string {
  return process.env.SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || 'ninho-dev-secret';
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function sign(payload: string): string {
  return b64url(createHmac('sha256', secret()).update(payload).digest());
}

export function serializeSession(data: Omit<SessionData, 'exp'>): string {
  const payload: SessionData = { ...data, exp: Math.floor(Date.now() / 1000) + MAX_AGE };
  const body = b64url(JSON.stringify(payload));
  return `${body}.${sign(body)}`;
}

export function parseSession(token: string | undefined): SessionData | null {
  if (!token) return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const expected = sign(body);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(
      Buffer.from(body.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString()
    ) as SessionData;
    if (!data.exp || data.exp < Math.floor(Date.now() / 1000)) return null;
    return data;
  } catch {
    return null;
  }
}

/** Lê a sessão atual (Server Component / Server Action). */
export function getSession(): SessionData | null {
  return parseSession(cookies().get(SESSION_COOKIE)?.value);
}

export function setSessionCookie(data: Omit<SessionData, 'exp'>) {
  cookies().set(SESSION_COOKIE, serializeSession(data), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE,
  });
}

export function clearSessionCookie() {
  cookies().delete(SESSION_COOKIE);
}

/** Rota destino conforme papel. */
export function homeForRole(role: Role): string {
  return role === 'admin' ? '/admin/visao-geral' : '/admin/conversor';
}
