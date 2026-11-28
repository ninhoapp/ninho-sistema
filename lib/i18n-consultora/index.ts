/**
 * Painel web da CONSULTORA em pt, en e es (dono, 25/11/2026).
 *
 * Só o que a consultora vê: /admin/consultora, o login de consultora, o
 * trocar-senha e as partes do layout dela. O painel do dono continua em pt.
 *
 * Dicionário: lib/i18n-consultora/{pt,en,es}/<secao>.ts. O pt é a fonte e o
 * TIPO: en e es são `typeof` do pt, então faltar ou sobrar chave não compila.
 * Espanhol: Ninho-expo/docs/i18n/glossario-espanhol.md (tú, "asesora",
 * "toma" e nunca "mamada"). Textos com a mesma intenção do app
 * (Ninho-expo/src/i18n/locales/{pt,en,es}/consultora.ts).
 *
 * Idioma: servidor.ts (idiomaDaConsultora) no servidor; no cliente,
 * useIdioma()/useTextos() de components/consultoras/IdiomaConsultora.tsx.
 */
import type { Idioma } from '@/lib/idioma';
import { pt, type Dicionario } from './pt';
import { en } from './en';
import { es } from './es';

export type { Idioma } from '@/lib/idioma';
export type { Dicionario } from './pt';
export * from './formato';

/** Cookie do seletor do painel: vale acima do profiles.locale NESTE navegador. */
export const COOKIE_IDIOMA_PAINEL = 'ninho_idioma_painel';

const DICIONARIOS: Record<Idioma, Dicionario> = { pt, en, es };

/** Todos os textos do painel da consultora no idioma. */
export function textos(idioma: Idioma): Dicionario {
  return DICIONARIOS[idioma] ?? pt;
}

/** Nome de cada idioma escrito no próprio idioma (seletor). */
export const NOMES_IDIOMA: [Idioma, string][] = [
  ['pt', 'Português'],
  ['en', 'English'],
  ['es', 'Español'],
];
