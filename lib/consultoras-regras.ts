/**
 * Ninho · Regras do programa de consultoras de sono — a parte PURA (sem
 * import, sem I/O). É daqui que saem o valor da comissão, as parcelas e o
 * prazo do Pix. `lib/consultoras.ts` monta as cobranças a partir dos usuários
 * do painel (mesesComCobranca + priceForUser) e chama `calcularLinhas`.
 *
 * Fica sem import de propósito: o script `scripts/verificar-consultoras.mjs`
 * importa este arquivo direto com o Node (sem o alias `@/`), para conferir os
 * casos conhecidos do contrato (docs/empresa/pedidos/consultoras-contrato.md
 * no Ninho-expo).
 *
 * Regras do dono (06/11/2026):
 *  - Base = preço cheio da cobrança (o que a família paga na loja).
 *  - Mensal: 25% em cada uma das 6 primeiras cobranças depois da atribuição.
 *  - Anual: 25% uma única vez (a 1ª cobrança anual depois da atribuição).
 *  - Consultora indicada por outra (consultora_indicacoes.indicada_por_id,
 *    gravado na atribuição): 12,5% para cada uma (dono, 07/11/2026; era 15%). Só 1 nível.
 *  - Teste grátis não conta (as cobranças já vêm só do que foi pago).
 *  - Comissão só nasce no CADASTRO (dono, 07/11/2026): a família criou a conta
 *    pelo link ou pelo código da consultora (consultora_indicacoes.metodo
 *    'link' ou 'codigo_cadastro'), ou o dono atribuiu ('manual'). O vínculo
 *    sozinho ('vinculo', regra antiga) não gera comissão.
 *  - PARA no cancelamento ou no reembolso (dono, 07/11/2026): depois do 1º
 *    mês sem cobrança, ou de uma cobrança reembolsada, nenhuma cobrança
 *    seguinte daquela família conta, mesmo se ela voltar a assinar. A
 *    reembolsada também não conta. Ainda não há dado de reembolso no banco:
 *    `Cobranca.reembolsada` fica pronto para quando houver.
 *  - Pix até o 5º dia útil do mês seguinte à competência (mês da cobrança),
 *    pulando sábado, domingo e feriado nacional.
 */

export const PCT_DIRETO = 25;
export const PCT_REDE = 12.5;
export const PARCELAS_MENSAL = 6;

/** A regra de quem gera comissão, em texto para a consultora (site, painel e termo). */
export const TEXTO_QUEM_GERA_COMISSAO =
  'Você ganha comissão pelas famílias que criam a conta no Ninho pelo seu link ou código. A comissão para quando a família cancela ou pede reembolso. Só o vínculo (a família compartilhar a rotina com você) não gera comissão, e famílias que encontraram você pela lista "Encontrar consultora" dentro do Ninho também não.';

/** Aceite da CONSULTORA ao aprovar ou convidar uma família (texto do Darck, migration 00109). */
export const ACEITE_VINCULO_CONSULTORA_VERSAO = 'consultora-vinculo-2026-11-07';
export const ACEITE_VINCULO_CONSULTORA_TEXTO =
  'Atendo esta família como profissional independente, e todas as orientações que eu der são de minha responsabilidade exclusiva. O Ninho não presta aconselhamento de saúde nem supervisiona meu atendimento. Uso a rotina do bebê só para atender esta família, sem copiar, guardar ou divulgar.';

/** Versão do aceite gravada nos pedidos do site (texto do Darck). */
export const ACEITE_SITE_VERSAO = 'site-2026-11-06';

/** Valor de uma linha: centavos arredondados (meio para cima). */
export function valorComissao(base: number, pct: number): number {
  return Math.round((Math.round(base * 100) * pct) / 100) / 100;
}

export function somar(valores: number[]): number {
  return Math.round(valores.reduce((s, v) => s + Math.round(v * 100), 0)) / 100;
}

// ── Prazo do Pix ──────────────────────────────────────────
/**
 * Feriados nacionais (lei federal) de 2026 e 2027, em yyyy-mm-dd. Carnaval e
 * Corpus Christi são ponto facultativo, não feriado nacional — e nenhum dos
 * dois cai nos 5 primeiros dias úteis de um mês nesses anos. Ano novo sem
 * lista: só fim de semana conta (acrescente a lista do ano).
 */
export const FERIADOS_NACIONAIS: ReadonlySet<string> = new Set([
  // 2026
  '2026-01-01', '2026-04-03', '2026-04-21', '2026-05-01', '2026-09-07',
  '2026-10-12', '2026-11-02', '2026-11-15', '2026-11-20', '2026-12-25',
  // 2027
  '2027-01-01', '2027-03-26', '2027-04-21', '2027-05-01', '2027-09-07',
  '2027-10-12', '2027-11-02', '2027-11-15', '2027-11-20', '2027-12-25',
]);

function iso(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export function ehDiaUtil(y: number, m: number, d: number): boolean {
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return dow !== 0 && dow !== 6 && !FERIADOS_NACIONAIS.has(iso(y, m, d));
}

/** N-ésimo dia útil de um mês (m de 1 a 12), em yyyy-mm-dd. */
export function diaUtil(y: number, m: number, n: number): string {
  let conta = 0;
  for (let d = 1; d <= 31; d++) {
    const dt = new Date(Date.UTC(y, m - 1, d));
    if (dt.getUTCMonth() !== m - 1) break;
    if (ehDiaUtil(y, m, d) && ++conta === n) return iso(y, m, d);
  }
  throw new Error(`mês sem ${n} dias úteis: ${y}-${m}`);
}

/** Competência (yyyy-mm) → prazo do Pix (yyyy-mm-dd): 5º dia útil do mês seguinte. */
export function prazoPix(competencia: string): string {
  const [y, m] = competencia.split('-').map(Number);
  const ny = m === 12 ? y + 1 : y;
  const nm = m === 12 ? 1 : m + 1;
  return diaUtil(ny, nm, 5);
}

/** dd/mm/aaaa de um yyyy-mm-dd (sem fuso: é data civil). */
export function dataBr(isoDia: string): string {
  const [y, m, d] = isoDia.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

/** "novembro de 2026". */
export function nomeCompetencia(competencia: string): string {
  const [y, m] = competencia.split('-').map(Number);
  return `${MESES[m - 1]} de ${y}`;
}

/** "novembro". */
export function nomeMes(competencia: string): string {
  return MESES[Number(competencia.split('-')[1]) - 1];
}

// ── Linhas de comissão ────────────────────────────────────
export interface Cobranca {
  /** yyyy-mm (mesma chave do Faturamento). */
  competencia: string;
  /** Instante da cobrança (ISO), para cortar o que veio antes da atribuição. */
  data: string;
  /** Preço cheio desta cobrança, em R$. */
  base: number;
  /** A loja devolveu o dinheiro desta cobrança. Para a comissão daqui em diante. */
  reembolsada?: boolean;
}

/** Métodos de atribuição que geram comissão (consultora_indicacoes.metodo). */
export const METODOS_COM_COMISSAO: ReadonlySet<string> = new Set(['link', 'codigo_cadastro', 'manual']);

function indiceMes(competencia: string): number {
  const [y, m] = competencia.split('-').map(Number);
  return y * 12 + m - 1;
}

/**
 * As cobranças que contam, em ordem: só depois da atribuição, e cortando no
 * cancelamento (mês sem cobrança no mensal, ou `paradaEm`) e no reembolso.
 */
export function cobrancasQueContam(f: FamiliaComissao): Cobranca[] {
  const desde = new Date(f.atribuidaEm).getTime();
  const parada = f.paradaEm ? new Date(f.paradaEm).getTime() : null;
  const ordem = f.cobrancas
    .filter((c) => new Date(c.data).getTime() >= desde)
    .sort((a, b) => a.data.localeCompare(b.data));
  const out: Cobranca[] = [];
  for (const c of ordem) {
    if (parada !== null && new Date(c.data).getTime() >= parada) break;
    if (c.reembolsada) break;
    const ant = out[out.length - 1];
    // Mensal: pulou um mês = cancelou. O que vier depois (voltou a assinar) não conta.
    if (ant && !f.anual && indiceMes(c.competencia) - indiceMes(ant.competencia) > 1) break;
    out.push(c);
  }
  return out;
}

export interface FamiliaComissao {
  /** Chave da família (profile_id atribuído). */
  id: string;
  bebe: string;
  /** "Premium mensal", "Básico anual"… */
  plano: string;
  anual: boolean;
  consultoraId: string;
  /** Quem indicou a consultora NA HORA da atribuição (ou null). */
  indicadaPorId: string | null;
  /** consultora_indicacoes.criado_em */
  atribuidaEm: string;
  /** Cobranças de quem paga a família (a conta atribuída ou o cuidador pagante). */
  cobrancas: Cobranca[];
  /** consultora_indicacoes.metodo. Só 'link', 'codigo_cadastro' e 'manual' geram comissão. */
  metodo: string;
  /** Instante em que a família cancelou ou pediu reembolso, quando se sabe. Nada a partir daí conta. */
  paradaEm?: string | null;
}

export interface LinhaComissao {
  competencia: string;
  /** Quem recebe esta linha. */
  consultoraId: string;
  familiaId: string;
  bebe: string;
  plano: string;
  /** "2/6" ou "anual". */
  parcela: string;
  pct: number;
  base: number;
  valor: number;
  /** Na parte de quem indicou: o id da consultora da família. Senão null. */
  viaId: string | null;
}

/**
 * Todas as linhas de comissão de um conjunto de famílias. Cada cobrança
 * elegível vira 1 linha (25%) ou 2 linhas (12,5% da consultora + 12,5% de quem a
 * indicou, com `viaId`).
 */
export function calcularLinhas(familias: FamiliaComissao[]): LinhaComissao[] {
  const out: LinhaComissao[] = [];
  for (const f of familias) {
    if (!METODOS_COM_COMISSAO.has(f.metodo)) continue;
    const elegiveis = cobrancasQueContam(f).slice(0, f.anual ? 1 : PARCELAS_MENSAL);
    elegiveis.forEach((c, i) => {
      const parcela = f.anual ? 'anual' : `${i + 1}/${PARCELAS_MENSAL}`;
      const comum = { competencia: c.competencia, familiaId: f.id, bebe: f.bebe, plano: f.plano, parcela, base: c.base };
      if (f.indicadaPorId && f.indicadaPorId !== f.consultoraId) {
        const v = valorComissao(c.base, PCT_REDE);
        out.push({ ...comum, consultoraId: f.consultoraId, pct: PCT_REDE, valor: v, viaId: null });
        out.push({ ...comum, consultoraId: f.indicadaPorId, pct: PCT_REDE, valor: v, viaId: f.consultoraId });
      } else {
        out.push({ ...comum, consultoraId: f.consultoraId, pct: PCT_DIRETO, valor: valorComissao(c.base, PCT_DIRETO), viaId: null });
      }
    });
  }
  return out.sort((a, b) => b.competencia.localeCompare(a.competencia) || a.bebe.localeCompare(b.bebe));
}

/** Total por competência de uma consultora. */
export function totaisPorCompetencia(linhas: LinhaComissao[], consultoraId: string): Map<string, number> {
  const m = new Map<string, number[]>();
  for (const l of linhas) {
    if (l.consultoraId !== consultoraId) continue;
    m.set(l.competencia, [...(m.get(l.competencia) ?? []), l.valor]);
  }
  return new Map(Array.from(m, ([k, vs]) => [k, somar(vs)]));
}

// ── Código e validações ───────────────────────────────────
export const CODIGO_RE = /^[A-Z0-9]{2,20}$/;
export const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
export const INSTAGRAM_RE = /^[A-Za-z0-9._]{1,30}$/;

/** E-mail como o banco guarda (check consultoras_email_minusculo). */
export function normalizarEmail(v: string): string {
  return v.trim().toLowerCase();
}

/** Código do link a partir do nome: 1º nome, sem acento, maiúsculo. */
export function codigoDoNome(nome: string): string {
  const primeiro = nome.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().split(/\s+/)[0] ?? '';
  return primeiro.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 18);
}

export function normalizarCodigo(v: string): string {
  return v.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 20);
}

/** "@Fulana.sono " → "Fulana.sono" (ou null se vazio/inválido). */
export function normalizarInstagram(v: string): string | null {
  const s = v.trim().replace(/^@/, '').replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/\/.*$/, '');
  return s && INSTAGRAM_RE.test(s) ? s : null;
}

/** WhatsApp só com dígitos (10 a 15, com DDI) ou null. Sem DDI e com 10–11 dígitos, põe 55. */
export function normalizarWhatsapp(v: string): string | null {
  let d = v.replace(/\D/g, '');
  if (d.length === 10 || d.length === 11) d = '55' + d;
  return d.length >= 10 && d.length <= 15 ? d : null;
}

export function normalizarCpf(v: string): string | null {
  const d = v.replace(/\D/g, '');
  return d.length === 11 ? d : null;
}
