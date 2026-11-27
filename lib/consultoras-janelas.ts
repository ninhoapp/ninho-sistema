/**
 * Janela antes de cada soneca (pedido de consultora pelo dono, 26/11/2026;
 * Ninho-expo docs/design/consultora/janelas-das-sonecas.html). Igual ao app
 * (Ninho-expo src/features/consultora/janelas.ts): para cada posição do dia
 * (1ª, 2ª… soneca e a noite), quanto tempo o bebê ficou acordado antes das
 * sonecas boas e das curtas, nos N dias até o dia aberto.
 *
 * Só descreve o que foi registrado; nunca "janela ideal" (a orientação é da
 * consultora).
 */
import type { RegistroRotina } from '@/lib/consultoras';
import { diaV3, somarDias } from '@/lib/consultoras-rotina';

export const EMENDA_MIN = 15;
export const JANELA_MAX_MIN = 360;
export const MINIMO_BOAS = 3;
export const TOLERANCIA_MIN = 10;
export const CORTES = [30, 40, 45, 60] as const;
export const CORTE_PADRAO = 40;

export function lerCorte(v: string | undefined): number {
  const n = Number(v);
  return (CORTES as readonly number[]).includes(n) ? n : CORTE_PADRAO;
}
export function lerPeriodo(v: string | undefined): 7 | 14 {
  return v === '14' ? 14 : 7;
}

export interface PontoJanela {
  dia: string;
  janelaMin: number;
  duracaoMin: number | null;
  boa: boolean;
}
export interface PosicaoJanelas {
  /** 1, 2, 3… para sonecas; 0 = noite. */
  posicao: number;
  pontos: PontoJanela[];
  boas: number;
  meioMin: number | null;
  deMin: number | null;
  ateMin: number | null;
  meioCurtasMin: number | null;
}
export interface JanelasDoPeriodo {
  sonecas: PosicaoJanelas[];
  noite: PosicaoJanelas;
}

type SonecaV3 = { a: number; b: number; min: number; emAndamento: boolean };
export type SonecaEmendada = { a: number; b: number; min: number; emAndamento: boolean; primeira: number };

const arred5 = (m: number) => Math.round(m / 5) * 5;
function quantil(v: number[], p: number): number {
  const s = [...v].sort((x, y) => x - y);
  const i = (s.length - 1) * p;
  const lo = Math.floor(i);
  const hi = Math.ceil(i);
  return s[lo] + (s[hi] - s[lo]) * (i - lo);
}

/** Junta sonecas separadas por menos de 15 min (soma o sono, não o intervalo). */
export function emendar(sonecas: SonecaV3[]): SonecaEmendada[] {
  const out: SonecaEmendada[] = [];
  sonecas.forEach((s, i) => {
    const u = out[out.length - 1];
    if (u && !u.emAndamento && (s.a - u.b) / 60000 < EMENDA_MIN) {
      u.b = s.b;
      u.min += s.min;
      u.emAndamento = s.emAndamento;
    } else out.push({ ...s, primeira: i });
  });
  return out;
}

/** Posição (depois das emendas) de cada soneca do dia, pelo início; continuação fica de fora. */
export function posicaoPorInicio(sonecas: SonecaV3[]): Map<number, number> {
  const m = new Map<number, number>();
  emendar(sonecas).forEach((g, k) => m.set(sonecas[g.primeira].a, k + 1));
  return m;
}

function resumir(posicao: number, pontos: PontoJanela[]): PosicaoJanelas {
  const boas = pontos.filter((p) => p.boa).map((p) => p.janelaMin);
  const curtas = pontos.filter((p) => !p.boa).map((p) => p.janelaMin);
  const ok = boas.length >= MINIMO_BOAS;
  return {
    posicao,
    pontos,
    boas: boas.length,
    meioMin: ok ? arred5(quantil(boas, 0.5)) : null,
    deMin: ok ? arred5(quantil(boas, 0.25)) : null,
    ateMin: ok ? arred5(quantil(boas, 0.75)) : null,
    meioCurtasMin: curtas.length ? arred5(quantil(curtas, 0.5)) : null,
  };
}

export function janelasDoPeriodo(regs: RegistroRotina[], ultimoDia: string, dias: number, corte: number, agora: number): JanelasDoPeriodo {
  const porPos = new Map<number, PontoJanela[]>();
  const noites: { dia: string; janelaMin: number; bloco: number | null }[] = [];
  for (let i = dias - 1; i >= 0; i--) {
    const dia = somarDias(ultimoDia, -i);
    const d = diaV3(regs, dia, agora);
    let cursor = d.acordou;
    let fechado = true;
    emendar(d.sonecas).forEach((g, k) => {
      if (cursor !== null && fechado && g.a > cursor && !g.emAndamento) {
        const j = Math.round((g.a - cursor) / 60000);
        if (j <= JANELA_MAX_MIN) {
          const l = porPos.get(k + 1) ?? [];
          l.push({ dia, janelaMin: j, duracaoMin: Math.round(g.min), boa: g.min >= corte });
          porPos.set(k + 1, l);
        }
      }
      cursor = g.b;
      fechado = !g.emAndamento;
    });
    if (d.dormiu !== null && cursor !== null && fechado && d.dormiu > cursor) {
      const j = Math.round((d.dormiu - cursor) / 60000);
      if (j <= JANELA_MAX_MIN) noites.push({ dia, janelaMin: j, bloco: d.noite.primeiroTrechoMin });
    }
  }
  const sonecas = [...porPos.keys()].sort((a, b) => a - b).map((p) => resumir(p, porPos.get(p)!));
  const blocos = noites.map((n) => n.bloco).filter((m): m is number => m !== null);
  const corteNoite = blocos.length >= 2 ? quantil(blocos, 0.5) : null;
  const noite = resumir(
    0,
    noites.map((n) => ({ dia: n.dia, janelaMin: n.janelaMin, duracaoMin: n.bloco, boa: corteNoite !== null && n.bloco !== null && n.bloco >= corteNoite })),
  );
  return { sonecas, noite };
}

export type ComparacaoJanela =
  | { tipo: 'no_base' }
  | { tipo: 'within'; deMin: number; ateMin: number }
  | { tipo: 'above' | 'below'; diferencaMin: number; deMin: number; ateMin: number };

export function compararJanela(janelaMin: number, pos: PosicaoJanelas | undefined): ComparacaoJanela {
  if (!pos || pos.deMin === null || pos.ateMin === null) return { tipo: 'no_base' };
  const { deMin, ateMin } = pos;
  if (janelaMin > ateMin + TOLERANCIA_MIN) return { tipo: 'above', diferencaMin: Math.round(janelaMin - ateMin), deMin, ateMin };
  if (janelaMin < deMin - TOLERANCIA_MIN) return { tipo: 'below', diferencaMin: Math.round(deMin - janelaMin), deMin, ateMin };
  return { tipo: 'within', deMin, ateMin };
}
