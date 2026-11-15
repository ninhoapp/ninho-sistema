/**
 * Ninho · A consultora vê a hora da FAMÍLIA, não a de Brasília (dono, 14 e
 * 15/11/2026: "é para aparecer o horário do bebê, da família do bebê").
 *
 * Toda a área da consultora (lib/consultoras-rotina.ts) lê os instantes com
 * um fuso fixo de Brasília (FUSO_MS, UTC−3). Em vez de reescrever cada conta,
 * o deslocamento entra UMA vez, na porta dos dados (rotinaDe): cada instante
 * anda `delta` para que a leitura em UTC−3 caia na hora da casa da família.
 *
 *   queremos: leitura(x) = x + FUSO_MS = t + desl(família)
 *   logo:     x = t + (desl(família) − FUSO_MS)  → `delta`
 *
 * O "agora" da família anda o mesmo `delta` (relogioDaFamilia), e a janela
 * pedida ao banco anda ao contrário. Os instantes deslocados servem só para
 * mostrar e contar nesta área: nunca para gravar nem mandar ao banco.
 *
 * Mesma técnica do app (Ninho-expo/src/features/consultora/fuso.ts) e do
 * Relatório IA (supabase/functions/_shared/sonoConsultora.ts).
 */
import { FUSO_MS } from '@/lib/consultoras-rotina';

const formatadores = new Map<string, Intl.DateTimeFormat>();

export function fusoValido(fuso: unknown): fuso is string {
  if (typeof fuso !== 'string' || !fuso.trim()) return false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: fuso });
    return true;
  } catch {
    return false;
  }
}

/** Deslocamento do fuso (ms) no instante `ms`: local = utc + deslocamento. */
export function deslocamentoMs(fuso: string, ms: number): number {
  let f = formatadores.get(fuso);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone: fuso,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    formatadores.set(fuso, f);
  }
  const p: Record<string, string> = {};
  for (const parte of f.formatToParts(new Date(ms))) {
    if (parte.type !== 'literal') p[parte.type] = parte.value;
  }
  const comoUtc = Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day), Number(p.hour), Number(p.minute), Number(p.second));
  return comoUtc - Math.floor(ms / 1000) * 1000;
}

/** Quanto somar a um instante para a leitura em UTC−3 cair na hora da família. 0 sem fuso válido. */
export function deltaDoFuso(fuso: string | null | undefined, ms: number): number {
  if (!fusoValido(fuso)) return 0;
  return deslocamentoMs(fuso, ms) - FUSO_MS;
}

export function moverIso(iso: string | null, delta: number): string | null {
  if (!iso || delta === 0) return iso;
  const ms = new Date(iso).getTime();
  return Number.isNaN(ms) ? iso : new Date(ms + delta).toISOString();
}

/** O relógio da família: fuso, "agora" deslocado e o delta. */
export interface RelogioFamilia {
  fuso: string | null;
  delta: number;
  /** "Agora" já deslocado: use no lugar de Date.now() nas contas desta família. */
  agora: number;
}

export function relogio(fuso: string | null, agoraReal: number = Date.now()): RelogioFamilia {
  const delta = deltaDoFuso(fuso, agoraReal);
  return { fuso: fusoValido(fuso) ? fuso : null, delta, agora: agoraReal + delta };
}
