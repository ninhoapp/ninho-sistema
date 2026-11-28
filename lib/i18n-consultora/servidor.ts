/**
 * Idioma do painel da consultora, no servidor (páginas e actions).
 * Ordem: cookie do seletor (ninho_idioma_painel) → profiles.locale da
 * consultora logada (o app grava ao trocar em Configurações → Idioma) →
 * 1ª língua do navegador → pt. Nunca grava em profiles.locale: o app
 * sobrescreve com o idioma dele ao abrir.
 */
import { cache } from 'react';
import { cookies, headers } from 'next/headers';
import { getSession } from '@/lib/auth/session';
import { appDb } from '@/lib/supabase/server';
import { idiomaDoNavegador, idiomaDoParametro, idiomaDoTexto, type Idioma } from '@/lib/idioma';
import { COOKIE_IDIOMA_PAINEL } from './index';

async function doCookie(): Promise<Idioma | null> {
  return idiomaDoParametro((await cookies()).get(COOKIE_IDIOMA_PAINEL)?.value);
}

async function doNavegador(): Promise<Idioma> {
  return idiomaDoNavegador((await headers()).get('accept-language'));
}

/** locale do perfil do app da consultora (sessão do painel → consultoras → profiles). */
async function doPerfil(perfilPainelId: string): Promise<Idioma | null> {
  try {
    const sb = appDb();
    const { data: c } = await sb.from('consultoras').select('profile_id').eq('painel_perfil_id', perfilPainelId).maybeSingle();
    const profileId = (c as { profile_id: string | null } | null)?.profile_id;
    if (!profileId) return null;
    const { data: p } = await sb.from('profiles').select('locale').eq('id', profileId).maybeSingle();
    return idiomaDoTexto((p as { locale: string | null } | null)?.locale);
  } catch {
    return null; // banco piscou: segue para o navegador
  }
}

/** Idioma da consultora logada. Fora do papel consultora: sempre pt. Uma leitura por requisição. */
export const idiomaDaConsultora = cache(async (): Promise<Idioma> => {
  const s = await getSession();
  if (!s || s.role !== 'consultora') return 'pt';
  return (await doCookie()) ?? (await doPerfil(s.sub)) ?? (await doNavegador());
});

/** Antes de entrar (login): ?lang= → cookie → navegador → pt. */
export async function idiomaDoLogin(lang?: string | null): Promise<Idioma> {
  return idiomaDoParametro(lang) ?? (await doCookie()) ?? (await doNavegador());
}
