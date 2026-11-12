/**
 * Ninho · Atribuição de instalação aos parceiros (influenciadores) e às
 * consultoras de sono (link /c/<código>, desde 08/11/2026, mesma lógica).
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

/**
 * Região aproximada de quem tocou ou de quem abriu o app (00145), pelos
 * cabeçalhos da Vercel: país, estado e cidade. Nunca o IP. Serve para casar a
 * instalação quando o IP muda (Retransmissão Privada do iCloud no Safari,
 * Wi-Fi ↔ 4G): ver cliqueAproximado.
 */
export function geoDe(headers: Headers): { geo_pais: string | null; geo_regiao: string | null; geo_cidade: string | null } {
  const ler = (k: string) => {
    const v = (headers.get(k) || '').trim();
    if (!v) return null;
    try {
      return decodeURIComponent(v).slice(0, 80);
    } catch {
      return v.slice(0, 80);
    }
  };
  return { geo_pais: ler('x-vercel-ip-country'), geo_regiao: ler('x-vercel-ip-country-region'), geo_cidade: ler('x-vercel-ip-city') };
}

/** Plataforma de quem chama a API (o app): iPhone ou Android. */
export function plataformaDoApp(ua: string): 'ios' | 'android' | null {
  if (/android|okhttp/i.test(ua)) return 'android';
  if (/iphone|ipad|ios|darwin|cfnetwork/i.test(ua)) return 'ios';
  return null;
}

/** Janela do casamento aproximado: toque até 2 h antes da abertura do app. */
export const JANELA_APROXIMADA_MIN = 120;

/**
 * Casamento APROXIMADO (00145, pedido do dono: indicação automática, sem
 * "Permitir colar"). Quando o IP não casa, procura o toque mais recente, nas
 * últimas 2 horas, do mesmo tipo de aparelho e da mesma região (país e
 * estado), que ainda não virou instalação. Devolve o id do toque, ou null.
 * Sem país de um dos lados, não casa.
 */
export async function cliqueAproximado(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sb: any,
  opcoes: {
    headers: Headers;
    ua: string;
    /** Restringe o toque: só convite (landed='convite') ou só links de indicação. */
    convite: boolean;
  },
): Promise<string | null> {
  const plataforma = plataformaDoApp(opcoes.ua);
  const { geo_pais, geo_regiao } = geoDe(opcoes.headers);
  if (!plataforma || !geo_pais) return null;
  const desde = new Date(Date.now() - JANELA_APROXIMADA_MIN * 60_000).toISOString();
  let q = sb
    .from('link_clicks')
    .select('id, landed')
    .eq('device', plataforma)
    .eq('geo_pais', geo_pais)
    .gte('clicked_at', desde);
  if (geo_regiao) q = q.eq('geo_regiao', geo_regiao);
  q = opcoes.convite ? q.eq('landed', 'convite') : q.neq('landed', 'convite');
  const { data, error } = await q.order('clicked_at', { ascending: false }).limit(10);
  if (error) {
    console.warn('[atribuicao] aproximado falhou:', error.message);
    return null;
  }
  const ids = ((data ?? []) as { id: string }[]).map((r) => r.id);
  if (ids.length === 0) return null;
  if (opcoes.convite) return ids[0];
  // Indicação: o toque que já virou instalação de outra pessoa não vale.
  const { data: usados } = await sb.from('install_events').select('click_id').in('click_id', ids);
  const ja = new Set(((usados ?? []) as { click_id: string }[]).map((u) => u.click_id));
  return ids.find((id) => !ja.has(id)) ?? null;
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
export function destinoDoLink(
  code: string,
  device: Device,
  clickId: string,
  origem: 'parceiro' | 'consultora' | 'amiga' = 'parceiro',
): { url: string; landed: Landed } {
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
      `utm_source=${origem}&utm_campaign=${code}&click_id=${clickId}`,
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

/**
 * Safari de verdade no iPhone (não Chrome, Firefox, Edge nem navegador de
 * app). É o único que esconde o IP com a Retransmissão Privada do iCloud.
 */
export function ehSafariIphone(ua: string): boolean {
  return (
    /iPhone|iPad|iPod/i.test(ua) &&
    /Version\/[\d.]+.*Safari\//.test(ua) &&
    !/CriOS|FxiOS|EdgiOS|OPiOS|GSA\/|YaBrowser|DuckDuckGo/i.test(ua) &&
    !ehNavegadorEmbutido(ua)
  );
}

/** Domínio dos links rastreados (o app só aceita link copiado daqui). */
export const DOMINIO_LINKS = 'www.useninho.com.br';

/**
 * O que a página copia para o app ler na 1ª abertura:
 * https://www.useninho.com.br/r/<código>?c=<id do clique> (parceiro) ou
 * https://www.useninho.com.br/c/<código>?c=<id do clique> (consultora).
 */
export function linkParaCopiar(codigo: string, clickId: string, tipo: 'r' | 'c' | 'i' = 'r'): string {
  const u = new URL(`https://${DOMINIO_LINKS}/${tipo}/${encodeURIComponent(codigo)}`);
  if (clickId) u.searchParams.set('c', clickId);
  return u.toString();
}
