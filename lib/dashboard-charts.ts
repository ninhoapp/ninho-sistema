/**
 * Ninho · Séries temporais para os gráficos de barra do painel. Server-only,
 * sem I/O — recebe os usuários já buscados e só agrega.
 */

const MES_ABREV = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

// Mesmo fuso da tabela de usuários ativos (ver TZ em
// components/admin/UsuariosTable.tsx): quem opera o painel está em Dubai, e
// é essa virada de dia/mês que precisa bater com o card "Novos usuários
// hoje" daquela tela — não o fuso dos usuários (Brasil) nem o do servidor.
const TZ = 'Asia/Dubai';

/** Data (yyyy-mm-dd) de um instante, no fuso do painel. */
function tzDateString(d: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

export interface SeriesPoint {
  label: string;
  value: number;
  /** Bucket ainda em andamento (hoje, mês atual) — a UI marca visualmente
   *  pra não ler um número baixo ali como queda. */
  highlight?: boolean;
}

/** Conta quantas datas (ISO) caem em cada um dos últimos N dias (hoje incluso), no fuso do painel. */
export function bucketByDay(dates: string[], days: number): SeriesPoint[] {
  const now = new Date();
  const hojeStr = tzDateString(now);
  const counts = new Map<string, number>();
  for (const iso of dates) {
    const key = tzDateString(new Date(iso));
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const pontos: SeriesPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    // Subtrai em cima do instante absoluto (não de componentes locais) —
    // Dubai não tem horário de verão, então 24h = 1 dia sempre bate certo.
    const d = new Date(now.getTime() - i * 86400000);
    const key = tzDateString(d);
    const [, mm, dd] = key.split('-');
    pontos.push({ label: `${dd}/${mm}`, value: counts.get(key) ?? 0, highlight: key === hojeStr });
  }
  return pontos;
}

/** Conta quantas datas (ISO) caem em cada um dos últimos N meses (mês atual incluso), no fuso do painel. */
export function bucketByMonth(dates: string[], months: number): SeriesPoint[] {
  const now = new Date();
  const counts = new Map<string, number>();
  for (const iso of dates) {
    const key = tzDateString(new Date(iso)).slice(0, 7);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const [anoAtual, mesAtual] = tzDateString(now).split('-').map(Number); // mesAtual é 1-based
  const pontos: SeriesPoint[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const total = anoAtual * 12 + (mesAtual - 1) - i;
    const y = Math.floor(total / 12);
    const m0 = ((total % 12) + 12) % 12;
    const key = `${y}-${String(m0 + 1).padStart(2, '0')}`;
    pontos.push({ label: `${MES_ABREV[m0]}/${String(y).slice(2)}`, value: counts.get(key) ?? 0, highlight: i === 0 });
  }
  return pontos;
}

export interface UsuariosCharts {
  usuariosPorDia: SeriesPoint[];
  usuariosPorMes: SeriesPoint[];
}

/** Usuários = data de cadastro (created_at). */
export function buildUsuariosCharts(users: { created_at: string }[]): UsuariosCharts {
  const userDates = users.map((u) => u.created_at);
  return {
    usuariosPorDia: bucketByDay(userDates, 7),
    usuariosPorMes: bucketByMonth(userDates, 7),
  };
}
