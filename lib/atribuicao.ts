/**
 * Ninho · Atribuição de instalação aos parceiros (influenciadores).
 * Server-only. Mesmo desenho do SOMI (somi-pesquisa), sem o Kochava:
 *
 *  1. /r/<codigo> grava o clique com o hash do IP e manda para a loja.
 *  2. Na 1ª abertura, o app chama /api/track/match; o servidor faz o hash do
 *     IP de quem chamou e procura um clique igual nos últimos JANELA_DIAS.
 *     Achou → grava a instalação e devolve { ref, click_id } ao app.
 *  3. O app grava a indicação na conta com registrar_indicacao_parceiro()
 *     (migration 00096), que confere o clique de novo no banco.
 *
 * Limites conhecidos (por isso existe o código digitado e o manual):
 *  - a pessoa precisa abrir o link no MESMO celular e na mesma rede em que
 *    vai abrir o app (Wi-Fi ↔ 4G troca o IP; o Retransmissão Privada do
 *    iCloud também);
 *  - redes que dividem o mesmo IP (operadora, empresa) podem casar o clique
 *    de uma pessoa com a instalação de outra. A janela curta reduz isso.
 */
import { createHash } from 'crypto';
import {
  LANDING_URL,
  STORE_ANDROID_URL,
  STORE_IOS_URL,
  type Device,
} from '@/lib/config';

/** Dias em que um clique ainda vale para casar com a 1ª abertura do app. */
export const JANELA_DIAS = Math.max(1, Number(process.env.ATRIBUICAO_JANELA_DIAS || 7));

/**
 * Sal dos hashes. NÃO é o segredo da sessão, de propósito: trocar o segredo
 * da sessão não pode quebrar a atribuição dos cliques já gravados (lição do
 * SOMI, lib/auth/secret.ts de lá). Para rotacionar sem perder cliques, ponha
 * o valor antigo em ATRIBUICAO_SALT_LEGADO (separado por vírgula).
 */
function salAtual(): string {
  return process.env.ATRIBUICAO_SALT || 'ninho-atribuicao';
}

function saisParaLeitura(): string[] {
  const legados = (process.env.ATRIBUICAO_SALT_LEGADO || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return Array.from(new Set([salAtual(), ...legados]));
}

function sha(input: string, sal: string): string {
  return createHash('sha256').update(input + sal).digest('hex').slice(0, 40);
}

/** IP do cliente (a Vercel põe o original em primeiro no x-forwarded-for). */
export function ipDe(headers: Headers): string {
  return headers.get('x-forwarded-for')?.split(',')[0]?.trim() || headers.get('x-real-ip') || '';
}

/**
 * Parte do IP que identifica a rede. IPv4: o endereço inteiro. IPv6: só os
 * primeiros 64 bits (/64), porque o iPhone troca a parte final do endereço
 * (endereços temporários de privacidade) e o Safari e o app podem sair com
 * finais diferentes na mesma rede.
 */
export function redeDoIp(ip: string): string {
  const limpo = ip.trim().toLowerCase().replace(/^\[|\]$/g, '').split('%')[0];
  if (!limpo.includes(':')) return limpo;
  if (limpo.startsWith('::ffff:') && limpo.includes('.')) return limpo.slice(7); // IPv4 dentro de IPv6
  const [ini, fim = ''] = limpo.split('::');
  const a = ini ? ini.split(':') : [];
  const b = limpo.includes('::') ? (fim ? fim.split(':') : []) : [];
  const grupos = limpo.includes('::') ? [...a, ...Array(Math.max(0, 8 - a.length - b.length)).fill('0'), ...b] : a;
  if (grupos.length < 4) return limpo;
  return grupos.slice(0, 4).map((g) => (parseInt(g || '0', 16) || 0).toString(16)).join(':') + '::/64';
}

/** 'v4' | 'v6' | 'nenhum' — só para o log de diagnóstico. */
export function familiaDoIp(ip: string): 'v4' | 'v6' | 'nenhum' {
  if (!ip) return 'nenhum';
  return redeDoIp(ip).includes(':') ? 'v6' : 'v4';
}

/** Hash gravado no clique — só a rede do IP, porque o User-Agent do app é outro. */
export function ipHash(ip: string): string | null {
  return ip ? sha(redeDoIp(ip), salAtual()) : null;
}

/**
 * Todos os hashes possíveis desse IP para a leitura: rede (/64 no IPv6) e,
 * para cliques gravados antes dessa mudança, o endereço inteiro; em cada
 * sal (atual + legados).
 */
export function ipHashesParaLeitura(ip: string): string[] {
  if (!ip) return [];
  const formas = Array.from(new Set([redeDoIp(ip), ip.trim()]));
  return Array.from(new Set(saisParaLeitura().flatMap((s) => formas.map((f) => sha(f, s)))));
}

/** Visitante único = IP + navegador. */
export function visitorHash(ip: string, ua: string): string {
  return sha(`${ip}|${ua}`, salAtual());
}

export type Landed = 'apple' | 'play' | 'landing';

/**
 * Para onde o link do parceiro manda.
 *  - iPhone → App Store. Com STORE_IOS_PT (provider token da App Store
 *    Connect) leva `ct=<codigo>`: a App Store Connect passa a mostrar
 *    downloads por parceiro em Analytics > Fontes > Campanhas (agregado).
 *  - Android → Google Play com `referrer` (Install Referrer).
 *  - Computador → landing com ?ref.
 */
export function destinoDoLink(code: string, device: Device, clickId: string): { url: string; landed: Landed } {
  if (device === 'ios' && STORE_IOS_URL) {
    const pt = (process.env.STORE_IOS_PT || '').trim();
    if (!pt) return { url: STORE_IOS_URL, landed: 'apple' };
    const u = new URL(STORE_IOS_URL);
    u.searchParams.set('pt', pt);
    u.searchParams.set('ct', code.toLowerCase());
    u.searchParams.set('mt', '8');
    return { url: u.toString(), landed: 'apple' };
  }
  if (device === 'android' && STORE_ANDROID_URL) {
    const u = new URL(STORE_ANDROID_URL);
    u.searchParams.set(
      'referrer',
      `utm_source=parceiro&utm_campaign=${code}&click_id=${clickId}`,
    );
    return { url: u.toString(), landed: 'play' };
  }
  const u = new URL(LANDING_URL);
  u.searchParams.set('ref', code.toLowerCase());
  return { url: u.toString(), landed: 'landing' };
}

/** Browser embutido do Instagram/Facebook/TikTok. */
export function ehNavegadorEmbutido(ua: string): boolean {
  return /Instagram|FBAN|FBAV|FB_IAB|musical_ly|TikTok|BytedanceWebview/i.test(ua);
}
