// Espelho de Ninho-expo/src/features/sleep/periodoDoSono.ts (mesma regra;
// mude os dois juntos). Sono noturno ou soneca: o que a família marcou vale;
// sem marca, regra básica (19h–6h) + horário de acordar de costume do bebê.

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
  if (acordares.length < MANHAS_MINIMAS) {
    return { acordaMin: ACORDA_PADRAO_MIN, despertarMaxMin: DESPERTAR_PADRAO_MIN, manhas: acordares.length };
  }
  const despertarMax =
    despertares.length >= MANHAS_MINIMAS ? Math.round(Math.min(60, Math.max(20, mediana(despertares) * 1.5))) : DESPERTAR_PADRAO_MIN;
  return { acordaMin: Math.round(mediana(acordares)), despertarMaxMin: despertarMax, manhas: acordares.length };
}

/** Sono noturno ou soneca de cada sono (por id). */
export function classificarSonos(
  sonos: SonoParaPeriodo[],
  perfil: PerfilDoSono,
  minDia: (ms: number) => number = minutosLocais,
): Map<string, PeriodoSono> {
  const out = new Map<string, PeriodoSono>();
  let anterior: SonoParaPeriodo | null = null;
  for (const s of ordenar(sonos)) {
    let p: PeriodoSono;
    if (s.periodo) p = s.periodo;
    else if (comecouDeNoite(s.a, minDia)) p = 'noite';
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
