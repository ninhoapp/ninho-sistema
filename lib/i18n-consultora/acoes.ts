'use server';

/** Seletor de idioma do painel: grava só o cookie deste navegador (nunca profiles.locale). */
import { cookies } from 'next/headers';
import { idiomaDoParametro } from '@/lib/idioma';
import { COOKIE_IDIOMA_PAINEL } from './index';

export async function escolherIdiomaPainel(idioma: string): Promise<void> {
  const v = idiomaDoParametro(idioma);
  if (!v) return;
  (await cookies()).set(COOKIE_IDIOMA_PAINEL, v, {
    path: '/admin',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
  });
}
