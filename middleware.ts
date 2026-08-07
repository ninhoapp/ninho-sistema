/**
 * Protege /admin/* — exige presença do cookie de sessão.
 * A validação criptográfica (HMAC) e o controle de papel acontecem
 * server-side no layout/páginas do painel (runtime node).
 */
import { NextRequest, NextResponse } from 'next/server';
// Importa da constante isolada, NUNCA de '@/lib/auth/session': aquele módulo
// usa node:crypto, que o Edge Runtime não suporta, e o deploy quebra.
import { SESSION_COOKIE } from '@/lib/auth/cookie';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Rotas públicas dentro de /admin
  if (pathname === '/admin/login') {
    return NextResponse.next();
  }

  const hasCookie = req.cookies.has(SESSION_COOKIE);
  if (!hasCookie) {
    const url = req.nextUrl.clone();
    url.pathname = '/admin/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
