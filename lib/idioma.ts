/**
 * Idioma das páginas públicas que a pessoa abre FORA do app (links de e-mail,
 * push, convite e indicação). Mesma regra do app e das edge functions
 * (Ninho-expo, supabase/functions/_shared/idioma.ts): português quando é
 * português, espanhol quando é espanhol, qualquer outro idioma vira inglês;
 * sem informação nenhuma, português (o público original do Ninho).
 *
 * Espanhol desde 25/11/2026: latino neutro, "tú". Palavras obrigatórias em
 * Ninho-expo/docs/i18n/glossario-espanhol.md ("toma", nunca "mamada").
 *
 * O /admin fica em português: não use isto lá.
 */
export type Idioma = 'pt' | 'en' | 'es';

/** "pt-BR", "es-419", "en-US", "es"... → 'pt' | 'en' | 'es'. Vazio → null. */
export function idiomaDoTexto(valor: string | null | undefined): Idioma | null {
  const v = (valor ?? '').trim().toLowerCase();
  // Vazio ou "*" (qualquer idioma): não diz nada.
  if (!/^[a-z]{2}/.test(v)) return null;
  if (v.startsWith('pt')) return 'pt';
  if (v.startsWith('es')) return 'es';
  return 'en';
}

/** Só a 1ª língua do cabeçalho Accept-Language ("es-419,es;q=0.9" → 'es'). */
export function idiomaDoNavegador(acceptLanguage: string | null | undefined): Idioma {
  return idiomaDoTexto((acceptLanguage ?? '').split(',')[0]?.split(';')[0]) ?? 'pt';
}

/** `?lang=` da URL (só pt, en ou es, nada de texto livre). */
export function idiomaDoParametro(lang: string | null | undefined): Idioma | null {
  const v = (lang ?? '').trim().toLowerCase();
  return v === 'pt' || v === 'en' || v === 'es' ? v : null;
}

/**
 * Para as respostas sem cache: `?lang=` da URL ganha; sem ele, a 1ª língua do
 * navegador. NÃO use em resposta com cache público (ver app/abrir/route.ts).
 */
export function idiomaDaRequisicao(req: Request): Idioma {
  let lang: string | null = null;
  try {
    lang = new URL(req.url).searchParams.get('lang');
  } catch {
    lang = null;
  }
  return idiomaDoParametro(lang) ?? idiomaDoNavegador(req.headers.get('accept-language'));
}

/** Escolhe o texto do idioma: `tr(idioma, 'Olá', 'Hello', 'Hola')`. */
export function tr(idioma: Idioma, pt: string, en: string, es: string): string {
  if (idioma === 'en') return en;
  if (idioma === 'es') return es;
  return pt;
}

/** Valor do <html lang>. */
export function htmlLang(idioma: Idioma): string {
  return tr(idioma, 'pt-BR', 'en', 'es');
}

/** Política de Privacidade e Termos no idioma (páginas em public/legal). */
export function linkPrivacidade(idioma: Idioma): string {
  return tr(idioma, '/privacy', '/privacy-en', '/privacy-es');
}
