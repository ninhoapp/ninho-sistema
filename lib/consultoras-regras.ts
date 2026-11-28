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

/**
 * A comissão existe inteira no código e no banco, mas NÃO aparece para a
 * consultora enquanto isto for `false` (dono, 23/11/2026: "não quero que
 * mostre nada para a consultora disso ainda, porque eu acho que eu vou tirar
 * essa parte... mas não quero que você delete tudo").
 *
 * Desligado, somem: a parte de comissão e ganhos da página "Seja consultora",
 * a aba Ganhos e a aba Indicar do painel dela (inclusive pelo endereço
 * direto), os textos de comissão do Manual e do Perfil e a escolha de
 * "Indicada por" na criação. Nada muda para o DONO: /admin/consultor segue
 * com as contas, o histórico e o Pix, porque o que já foi prometido continua
 * valendo. Para voltar tudo, troque para `true`.
 */
export const COMISSAO_VISIVEL = false;

/**
 * Idioma do painel da consultora (pt, en, es). É o mesmo `Idioma` de
 * lib/idioma.ts, repetido aqui porque este arquivo não importa nada (o
 * script do Node lê direto). Por isso os textos de regra e o termo moram
 * aqui, ao lado da versão do aceite, e não no dicionário lib/i18n-consultora.
 */
export type IdiomaRegras = 'pt' | 'en' | 'es';

export const PCT_DIRETO = 25;
export const PCT_REDE = 12.5;
export const PARCELAS_MENSAL = 6;

/** A regra de quem gera comissão, em texto para a consultora (site, painel e termo). */
export const TEXTO_QUEM_GERA_COMISSAO =
  'Você ganha comissão pelas famílias que criam a conta no Ninho pelo seu link ou código. A comissão para quando a família cancela ou pede reembolso. Só o vínculo (a família compartilhar a rotina com você) não gera comissão, e famílias que encontraram você pela lista "Encontrar consultora" dentro do Ninho também não.';

const QUEM_GERA_COMISSAO: Record<IdiomaRegras, string> = {
  pt: TEXTO_QUEM_GERA_COMISSAO,
  en: 'You earn commission for families who create their Ninho account through your link or code. The commission stops when the family cancels or asks for a refund. Being linked alone (the family sharing the routine with you) does not earn commission, and neither do families who found you through the "Find a consultant" list inside Ninho.',
  es: 'Ganas comisión por las familias que crean su cuenta en Ninho con tu enlace o tu código. La comisión se detiene cuando la familia cancela o pide un reembolso. Solo el vínculo (que la familia comparta la rutina contigo) no genera comisión, y las familias que te encontraron en la lista "Encontrar asesora" dentro de Ninho tampoco.',
};

/** A regra de quem gera comissão no idioma do painel (pt = TEXTO_QUEM_GERA_COMISSAO). */
export function textoQuemGeraComissao(idioma: IdiomaRegras = 'pt'): string {
  return QUEM_GERA_COMISSAO[idioma] ?? TEXTO_QUEM_GERA_COMISSAO;
}

/**
 * Termo da CONSULTORA (texto do Darck). O painel precisa mostrar EXATAMENTE o
 * texto que está em aceite_textos no banco (o servidor guarda o hash dele),
 * parágrafos separados por uma linha em branco e o trecho entre ** em negrito.
 * 16/11/2026: estava parado na v2 de 07/11; com a v4 valendo no banco, aprovar
 * e convidar não gravavam mais o "aceitou" dela — e sem esse registro ela não
 * consegue enviar orientação. O mesmo termo vale para a aba Ficha.
 */
export const ACEITE_VINCULO_CONSULTORA_VERSAO = 'consultora-vinculo-2026-11-15-v4';
export const ACEITE_VINCULO_CONSULTORA_TEXTO = [
  'Atendo as famílias como profissional independente. **Toda orientação que eu der a uma família, pelo Ninho ou fora dele, é de minha total responsabilidade.** O Ninho só entrega a mensagem: não escreve, não revisa e não responde pelo que eu oriento, não presta aconselhamento de saúde e não supervisiona meu atendimento.',
  'Uso a rotina do bebê, os despertares, as marcas das sonecas e os comentários da família só para atender aquela família, sem copiar ou divulgar fora do Ninho.',
  'Nas orientações e nas anotações, não escrevo diagnóstico, nome ou dose de remédio, suplemento ou melatonina, posição ou superfície de sono, cama compartilhada nem promessa de resultado, e nunca peço para adiar consulta, exame ou vacina. Diante de sinal de alerta de saúde, oriento procurar o pediatra ou o pronto-socorro.',
  'Sei que a família vê quando eu envio e se leu, que o Ninho guarda o que eu envio e que, se a família denunciar uma mensagem, a equipe do Ninho pode lê-la e pausar minhas orientações ou minha conta.',
].join('\n\n');

/**
 * O MESMO termo (mesma versão) em en e es, copiado do app
 * (Ninho-expo/src/i18n/locales/{en,es}/consultora.ts, o termo da consultora
 * no vínculo). É o texto gravado em aceite_textos para esses idiomas (a
 * migration 00198 confere o hash). Nada disso vai para o banco daqui: o
 * painel manda só a versão (ACEITE_VINCULO_CONSULTORA_VERSAO).
 */
const ACEITE_VINCULO_CONSULTORA: Record<IdiomaRegras, string> = {
  pt: ACEITE_VINCULO_CONSULTORA_TEXTO,
  en: [
    'I serve families as an independent professional. **All guidance I give a family, in Ninho or elsewhere, is entirely my responsibility.** Ninho only delivers the message: it does not write, review, or answer for my guidance, does not provide health advice, and does not supervise my work.',
    "I use the baby's routine, night wakings, nap marks, and the family's comments only to serve that family, without copying or sharing them outside Ninho.",
    'In my guidance and notes, I do not write diagnoses, names or doses of medication, supplements or melatonin, sleep position or surface, bed-sharing, or promises of results, and I never ask a family to delay an appointment, test, or vaccine. If there is a health warning sign, I tell the family to see the pediatrician or go to the emergency room.',
    'I understand that the family sees when I send guidance and whether they read it, that Ninho stores what I send, and that if a family reports a message, the Ninho team may read it and pause my guidance or my account.',
  ].join('\n\n'),
  es: [
    'Atiendo a las familias como profesional independiente. **Toda orientación que dé a una familia, en Ninho o fuera de Ninho, es de mi total responsabilidad.** Ninho solo entrega el mensaje: no escribe, no revisa ni responde por lo que yo oriento, no da asesoramiento de salud y no supervisa mi atención.',
    'Uso la rutina del bebé, los despertares, las marcas de las siestas y los comentarios de la familia solo para atender a esa familia, sin copiarlos ni compartirlos fuera de Ninho.',
    'En las orientaciones y en las notas, no escribo diagnósticos, nombres ni dosis de medicamentos, suplementos o melatonina, posición ni superficie para dormir, colecho ni promesas de resultados, y nunca pido aplazar una consulta, un examen o una vacuna. Ante una señal de alerta de salud, indico acudir al pediatra o a urgencias.',
    'Sé que la familia ve cuándo envío algo y si lo leyó, que Ninho guarda lo que envío y que, si la familia denuncia un mensaje, el equipo de Ninho puede leerlo y pausar mis orientaciones o mi cuenta.',
  ].join('\n\n'),
};

/** Termo da consultora no idioma do painel (pt = ACEITE_VINCULO_CONSULTORA_TEXTO). Mesma versão nos três. */
export function textoAceiteVinculo(idioma: IdiomaRegras = 'pt'): string {
  return ACEITE_VINCULO_CONSULTORA[idioma] ?? ACEITE_VINCULO_CONSULTORA_TEXTO;
}

/** "Como ficou sabendo do Ninho?" no pedido para ser consultora (consultora_pedidos.como_soube). */
export const COMO_SOUBE_OPCOES = ['Instagram', 'Indicação de outra consultora', 'Google', 'Família/cliente', 'Outro'] as const;

export type ComoSoube = (typeof COMO_SOUBE_OPCOES)[number];

const COMO_SOUBE_ROTULOS: Record<IdiomaRegras, Record<ComoSoube, string>> = {
  pt: { Instagram: 'Instagram', 'Indicação de outra consultora': 'Indicação de outra consultora', Google: 'Google', 'Família/cliente': 'Família/cliente', Outro: 'Outro' },
  en: { Instagram: 'Instagram', 'Indicação de outra consultora': 'Referred by another consultant', Google: 'Google', 'Família/cliente': 'Family or client', Outro: 'Other' },
  es: { Instagram: 'Instagram', 'Indicação de outra consultora': 'Recomendación de otra asesora', Google: 'Google', 'Família/cliente': 'Familia o clienta', Outro: 'Otro' },
};

/**
 * As mesmas opções de COMO_SOUBE_OPCOES, na mesma ordem, com o rótulo no
 * idioma. `valor` é o que vai no formulário e no banco (sempre o pt de hoje);
 * `rotulo` é só o que aparece: `<option value={o.valor}>{o.rotulo}</option>`.
 */
export function comoSoubeOpcoes(idioma: IdiomaRegras = 'pt'): { valor: ComoSoube; rotulo: string }[] {
  const r = COMO_SOUBE_ROTULOS[idioma] ?? COMO_SOUBE_ROTULOS.pt;
  return COMO_SOUBE_OPCOES.map((valor) => ({ valor, rotulo: r[valor] }));
}

export function normalizarComoSoube(v: string): string | null {
  const t = v.trim();
  return (COMO_SOUBE_OPCOES as readonly string[]).includes(t) ? t : null;
}

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
export function prazoPix(competencia: string, idioma: IdiomaRegras = 'pt'): string {
  // Devolve yyyy-mm-dd (não é texto): o idioma só existe para o painel da
  // consultora chamar igual às outras; para mostrar, use dataBr(prazo, idioma).
  void idioma;
  const [y, m] = competencia.split('-').map(Number);
  const ny = m === 12 ? y + 1 : y;
  const nm = m === 12 ? 1 : m + 1;
  return diaUtil(ny, nm, 5);
}

/**
 * dd/mm/aaaa de um yyyy-mm-dd (sem fuso: é data civil). Em inglês,
 * mm/dd/yyyy (como o app em en); em espanhol, dd/mm/aaaa.
 */
export function dataBr(isoDia: string, idioma: IdiomaRegras = 'pt'): string {
  const [y, m, d] = isoDia.slice(0, 10).split('-');
  return idioma === 'en' ? `${m}/${d}/${y}` : `${d}/${m}/${y}`;
}

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const MESES_IDIOMA: Record<IdiomaRegras, string[]> = {
  pt: MESES,
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  es: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
};

/** "novembro de 2026" · "November 2026" · "noviembre de 2026". */
export function nomeCompetencia(competencia: string, idioma: IdiomaRegras = 'pt'): string {
  const [y, m] = competencia.split('-').map(Number);
  const mes = (MESES_IDIOMA[idioma] ?? MESES)[m - 1];
  return idioma === 'en' ? `${mes} ${y}` : `${mes} de ${y}`;
}

/** "novembro" · "November" · "noviembre". */
export function nomeMes(competencia: string, idioma: IdiomaRegras = 'pt'): string {
  return (MESES_IDIOMA[idioma] ?? MESES)[Number(competencia.split('-')[1]) - 1];
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
