import { SITE_URL } from '@/lib/config';
import { textos, type Idioma } from '@/lib/i18n-consultora';

/** Manda o iPhone para a App Store e o Android para o Google Play (app/baixar/route.ts). */
export const LINK_BAIXAR = `${SITE_URL}/baixar`;

export interface DadosManual {
  nome: string;
  email: string;
  codigo: string | null;
  whatsapp: string | null;
}

export type TipoManual = 'sem-conta' | 'com-conta';

export const codigoDe = (d: DadosManual) => (d.codigo ?? 'SEUCODIGO').toUpperCase();

/**
 * Passo a passo completo, em texto, para mandar pelo WhatsApp.
 * Textos no dicionário (lib/i18n-consultora/{pt,en,es}/manual.ts, `mensagem`).
 * Sem `idioma`, sai em pt (o dono usa assim).
 */
export function textoManual(tipo: TipoManual, d: DadosManual, idioma: Idioma = 'pt'): string {
  const t = textos(idioma).manual.mensagem;
  const codigo = codigoDe(d);
  const inicio = tipo === 'sem-conta' ? t.semConta(d.nome, LINK_BAIXAR, d.email) : t.comConta(d.nome, d.email);
  return inicio + t.comuns(codigo, 3);
}

/** Mensagem curta que acompanha o PDF no WhatsApp. O 1º passo (baixar) vai como link tocável. */
export function textoComPdf(tipo: TipoManual, d: DadosManual, idioma: Idioma = 'pt'): string {
  // Texto do dono (14/11/2026). Para quem não tem conta, o link de baixar vai junto, tocável.
  return textos(idioma).manual.mensagem.comPdf(d.nome, tipo === 'sem-conta' ? LINK_BAIXAR : null);
}
