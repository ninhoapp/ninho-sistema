// Espelho de Ninho-expo/src/features/sleep/periodoDoSono.ts (mesma regra;
// mude os dois juntos). Sono noturno ou soneca: o que a família marcou vale;
// sem marca, regra básica (19h–6h) + horário de acordar de costume do bebê
// + soneca do fim do dia (dono, 13/11/2026: o 1º sono da noite que começou
// 19h–22h, durou até 3 h e foi seguido de mais tempo acordado que um
// despertar do bebê, até 5 h, antes do próximo sono é soneca; sem o próximo
// sono ainda, vale o hábito do bebê: 3+ dessas sonecas em 7 dias, ±1 h).

export type PeriodoSono = 'noite' | 'soneca';

export interface SonoParaPeriodo {
  id: string;
  /** Início (ms). */
  a: number;
  /** Fim (ms); null = em andamento. */
  b: number | null;
  /** O que a família marcou; null/undefined = calcular. */
  periodo?: PeriodoSono | null;
}

export interface PerfilDoSono {
  /** Horário de acordar de costume, em minutos do dia (ex.: 450 = 7h30). */
  acordaMin: number;
  /** Até quanto tempo acordado (min) ainda é despertar da noite. */
  despertarMaxMin: number;
  /** Quantas manhãs entraram no cálculo (0 = regra básica). */
  manhas: number;
  /** Hábito: horário de costume (minutos do dia) da soneca do fim do dia,
   *  quando ela aconteceu 3+ vezes nos últimos 7 dias. Ausente = sem hábito. */
  sonecaFimDoDiaMin?: number;
}

const MIN = 60_000;
const DIA = 24 * 60 * MIN;
export const ACORDA_PADRAO_MIN = 6 * 60 + 30;
export const DESPERTAR_PADRAO_MIN = 60;
const MANHAS_MINIMAS = 4;
const ACORDADO_DE_MANHA_MIN = 90;

/** Minutos do dia no relógio do celular. */
export const minutosLocais = (ms: number): number => {
  const d = new Date(ms);
  return d.getHours() * 60 + d.getMinutes();
};

/** Regra básica: começou entre 19h e 6h. */
export function comecouDeNoite(a: number, minDia: (ms: number) => number = minutosLocais): boolean {
  const m = minDia(a);
  return m >= 19 * 60 || m < 6 * 60;
}

function mediana(xs: number[]): number {
  const s = [...xs].sort((x, y) => x - y);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

const ordenar = (sonos: SonoParaPeriodo[]) => [...sonos].filter((s) => Number.isFinite(s.a)).sort((x, y) => x.a - y.a);

/** Aprende o horário de acordar e os despertares do bebê nas últimas 2 semanas. */
export function perfilDoSono(sonos: SonoParaPeriodo[], agora: number, minDia: (ms: number) => number = minutosLocais): PerfilDoSono {
  const lista = ordenar(sonos).filter((s) => s.a >= agora - 14 * DIA);
  // Classificação só pela regra básica + o que a família marcou, para não
  // depender do próprio perfil.
  const noite = (s: SonoParaPeriodo) => (s.periodo ? s.periodo === 'noite' : comecouDeNoite(s.a, minDia));
  const acordares: number[] = [];
  const despertares: number[] = [];
  for (let i = 0; i < lista.length; i++) {
    const s = lista[i];
    if (s.b === null || !noite(s)) continue;
    const prox = lista[i + 1];
    const acordado = prox ? (prox.a - s.b) / MIN : (agora - s.b) / MIN;
    const m = minDia(s.b);
    if (m >= 4 * 60 && m < 12 * 60 && acordado >= ACORDADO_DE_MANHA_MIN) acordares.push(m);
    else if (prox && noite(prox) && acordado >= 0 && acordado < 3 * 60) despertares.push(acordado);
  }
  const base: PerfilDoSono =
    acordares.length < MANHAS_MINIMAS
      ? { acordaMin: ACORDA_PADRAO_MIN, despertarMaxMin: DESPERTAR_PADRAO_MIN, manhas: acordares.length }
      : {
          acordaMin: Math.round(mediana(acordares)),
          despertarMaxMin:
            despertares.length >= MANHAS_MINIMAS
              ? Math.round(Math.min(60, Math.max(20, mediana(despertares) * 1.5)))
              : DESPERTAR_PADRAO_MIN,
          manhas: acordares.length,
        };
  const habito = habitoSonecaFimDoDia(lista, agora, base.despertarMaxMin, minDia);
  return habito === null ? base : { ...base, sonecaFimDoDiaMin: habito };
}

const SONECAS_FIM_DO_DIA_MINIMAS = 3;
const HABITO_JANELA_MIN = 60;

/** O 1º sono da noite que começou 19h–22h, durou até 3 h e teve depois mais
 *  que um despertar acordado (até 5 h) antes do próximo sono. */
function ehSonecaFimDoDiaPelosFatos(
  s: SonoParaPeriodo,
  anteriorNoturno: boolean,
  anterior: SonoParaPeriodo | null,
  prox: SonoParaPeriodo | undefined,
  despertarMaxMin: number,
  minDia: (ms: number) => number,
): boolean {
  const m = minDia(s.a);
  if (m < 19 * 60 || m >= 22 * 60) return false;
  if (s.b === null || s.b - s.a > 3 * 60 * MIN) return false;
  if (anterior && anteriorNoturno && anterior.b !== null && s.a - anterior.b < 3 * 60 * MIN) return false;
  if (!prox || prox.periodo === 'soneca') return false;
  const acordado = (prox.a - s.b) / MIN;
  // Até 5 h acordado: mais que isso é registro faltando, não soneca.
  return acordado > despertarMaxMin && acordado <= 5 * 60;
}

/** Horário de costume da soneca do fim do dia, se ela é hábito (3+ nos últimos 7 dias). */
function habitoSonecaFimDoDia(
  lista: SonoParaPeriodo[],
  agora: number,
  despertarMaxMin: number,
  minDia: (ms: number) => number,
): number | null {
  const inicios: number[] = [];
  for (let i = 0; i < lista.length; i++) {
    const s = lista[i];
    if (s.a < agora - 7 * DIA || s.a > agora) continue;
    const m = minDia(s.a);
    if (m < 19 * 60 || m >= 22 * 60) continue;
    if (s.periodo === 'soneca') inicios.push(m);
    else if (s.periodo === 'noite') continue;
    else {
      const ant = i > 0 ? lista[i - 1] : null;
      const antNoturno = ant ? (ant.periodo ? ant.periodo === 'noite' : comecouDeNoite(ant.a, minDia)) : false;
      if (ehSonecaFimDoDiaPelosFatos(s, antNoturno, ant, lista[i + 1], despertarMaxMin, minDia)) inicios.push(m);
    }
  }
  return inicios.length >= SONECAS_FIM_DO_DIA_MINIMAS ? Math.round(mediana(inicios)) : null;
}

/** Sono noturno ou soneca de cada sono (por id). */
export function classificarSonos(
  sonos: SonoParaPeriodo[],
  perfil: PerfilDoSono,
  minDia: (ms: number) => number = minutosLocais,
): Map<string, PeriodoSono> {
  const out = new Map<string, PeriodoSono>();
  const lista = ordenar(sonos);
  let anterior: SonoParaPeriodo | null = null;
  for (let i = 0; i < lista.length; i++) {
    const s = lista[i];
    let p: PeriodoSono;
    if (s.periodo) p = s.periodo;
    else if (comecouDeNoite(s.a, minDia)) p = sonecaDoFimDoDia(s, anterior, lista[i + 1], out, perfil, minDia) ? 'soneca' : 'noite';
    else if (anterior && out.get(anterior.id) === 'noite' && anterior.b !== null) {
      const acordou = minDia(anterior.b);
      const acordado = (s.a - anterior.b) / MIN;
      const antesDoCostume = acordou < perfil.acordaMin && acordou < 12 * 60;
      p = antesDoCostume && acordado >= 0 && acordado <= perfil.despertarMaxMin ? 'noite' : 'soneca';
    } else p = 'soneca';
    out.set(s.id, p);
    anterior = s;
  }
  return out;
}

/**
 * Regra 4: o 1º sono da noite (começou 19h–22h, até 3 h, o sono anterior não
 * é noturno) seguido de mais tempo acordado que um despertar do bebê antes do
 * próximo sono é soneca do fim do dia. Sem próximo sono ainda: vale o hábito
 * do bebê (perfil.sonecaFimDoDiaMin, ±1 h); sem hábito, noite.
 */
function sonecaDoFimDoDia(
  s: SonoParaPeriodo,
  anterior: SonoParaPeriodo | null,
  prox: SonoParaPeriodo | undefined,
  out: Map<string, PeriodoSono>,
  perfil: PerfilDoSono,
  minDia: (ms: number) => number,
): boolean {
  const anteriorNoturno = anterior ? out.get(anterior.id) === 'noite' : false;
  if (prox) return ehSonecaFimDoDiaPelosFatos(s, anteriorNoturno, anterior, prox, perfil.despertarMaxMin, minDia);
  const habito = perfil.sonecaFimDoDiaMin;
  if (habito === undefined) return false;
  const m = minDia(s.a);
  if (m < 19 * 60 || m >= 22 * 60 || Math.abs(m - habito) > HABITO_JANELA_MIN) return false;
  if (s.b !== null && s.b - s.a > 3 * 60 * MIN) return false;
  if (anterior && anteriorNoturno && anterior.b !== null && s.a - anterior.b < 3 * 60 * MIN) return false;
  return true;
}

/** Tudo de uma vez: aprende o perfil e classifica. */
export function periodosDosSonos(
  sonos: SonoParaPeriodo[],
  agora: number,
  minDia: (ms: number) => number = minutosLocais,
): { periodos: Map<string, PeriodoSono>; perfil: PerfilDoSono } {
  const perfil = perfilDoSono(sonos, agora, minDia);
  return { periodos: classificarSonos(sonos, perfil, minDia), perfil };
}

/** Sugestão para um sono que está sendo lançado (ainda sem id no banco). */
export function sugerirPeriodo(
  existentes: SonoParaPeriodo[],
  novo: { id?: string; a: number; b: number | null },
  agora: number,
  minDia: (ms: number) => number = minutosLocais,
): PeriodoSono {
  const id = novo.id ?? '__novo__';
  const outros = existentes.filter((s) => s.id !== id);
  const perfil = perfilDoSono(outros, agora, minDia);
  const todos = [...outros, { id, a: novo.a, b: novo.b, periodo: null }];
  return classificarSonos(todos, perfil, minDia).get(id) ?? 'soneca';
}

/** '7h30' a partir de minutos do dia. */
export function horaDeMinutos(m: number): string {
  const h = Math.floor(m / 60);
  const mm = Math.round(m % 60);
  return mm ? `${h}h${String(mm).padStart(2, '0')}` : `${h}h`;
}
