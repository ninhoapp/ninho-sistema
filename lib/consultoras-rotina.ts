/**
 * Ninho · Contas da rotina do bebê para a área da consultora (puro, sem I/O).
 *
 * Recebe os registros de `_consultora_rotina` e devolve o resumo do dia e da
 * semana. Horário de Brasília fixo (UTC−3: o Brasil não tem horário de verão
 * desde 2019), porque as famílias do programa estão no Brasil.
 *
 * Regras (sem registro, sem número: nada é estimado):
 *  - Noite do dia D = sonos que COMEÇAM entre 18:00 de D e 06:00 de D+1.
 *  - "Dormiu à noite" = início do 1º sono dessa janela com 90 min ou mais
 *    (soneca curta no fim da tarde não conta como hora de dormir).
 *  - Despertares = intervalos entre os sonos da noite, a partir da hora de dormir.
 *  - Horas até o 1º despertar = duração do 1º sono da noite.
 *  - "Acordou de manhã" no dia D = fim do último sono da noite anterior
 *    (D−1), se terminou antes das 11:00 de D.
 *  - Sonecas do dia D = sonos que começam entre a hora que acordou (ou 06:00)
 *    e a hora de dormir (ou 18:00). Janelas = acordado entre eles.
 */
import type { RegistroRotina } from '@/lib/consultoras';

export const FUSO_MS = -3 * 3600 * 1000;
const H = 3600 * 1000;
const DIA = 24 * H;

/** Meia-noite (instante UTC) do dia local yyyy-mm-dd. */
export function inicioDoDia(diaLocal: string): number {
  const [y, m, d] = diaLocal.split('-').map(Number);
  return Date.UTC(y, m - 1, d) - FUSO_MS;
}

/** yyyy-mm-dd local de um instante. */
export function diaLocalDe(ms: number): string {
  return new Date(ms + FUSO_MS).toISOString().slice(0, 10);
}

export function somarDias(diaLocal: string, n: number): string {
  return diaLocalDe(inicioDoDia(diaLocal) + n * DIA + 12 * H);
}

/** "14:05" local. */
export function hora(ms: number): string {
  return new Date(ms + FUSO_MS).toISOString().slice(11, 16);
}

/** Minutos → "1h05" ou "40 min". */
export function dur(min: number): string {
  const m = Math.max(0, Math.round(min));
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)}h${String(m % 60).padStart(2, '0')}`;
}

export interface Sono {
  a: number;
  b: number;
  emAndamento: boolean;
}

function sonos(regs: RegistroRotina[], agora: number): Sono[] {
  return regs
    .filter((r) => r.tipo === 'sleep')
    .map((r) => {
      const a = new Date(r.inicio).getTime();
      // Sono sem fim: só vale como "em andamento" se começou nas últimas 24 h.
      const aberto = !r.fim;
      const b = r.fim ? new Date(r.fim).getTime() : agora - a < DIA ? agora : NaN;
      return { a, b, emAndamento: aberto && !Number.isNaN(b) };
    })
    .filter((s) => !Number.isNaN(s.b) && s.b > s.a)
    .sort((x, y) => x.a - y.a);
}

export interface Noite {
  /** Dia D da noite (que começa na noite de D). */
  dia: string;
  dormiu: number | null;
  /** Fim do último sono da noite, se antes das 11:00 de D+1. */
  acordou: number | null;
  primeiroTrechoMin: number | null;
  despertares: number | null;
  totalMin: number | null;
  segmentos: Sono[];
}

export function noiteDe(regs: RegistroRotina[], dia: string, agora: number): Noite {
  const ini = inicioDoDia(dia);
  const janelaA = ini + 18 * H;
  const janelaB = ini + 30 * H; // 06:00 de D+1
  const todos = sonos(regs, agora).filter((s) => s.a >= janelaA && s.a < janelaB);
  const iDormiu = todos.findIndex((s) => s.b - s.a >= 90 * 60 * 1000 || s.emAndamento);
  if (iDormiu < 0) {
    return { dia, dormiu: null, acordou: null, primeiroTrechoMin: null, despertares: null, totalMin: null, segmentos: [] };
  }
  const seg = todos.slice(iDormiu);
  const ultimo = seg[seg.length - 1];
  const acordou = !ultimo.emAndamento && ultimo.b < ini + 35 * H ? ultimo.b : null;
  return {
    dia,
    dormiu: seg[0].a,
    acordou,
    primeiroTrechoMin: seg[0].emAndamento ? null : (seg[0].b - seg[0].a) / 60000,
    despertares: seg.length - 1,
    totalMin: seg.reduce((s, x) => s + (x.b - x.a), 0) / 60000,
    segmentos: seg,
  };
}

export interface ResumoDia {
  dia: string;
  temRegistro: boolean;
  acordou: number | null;
  /** Noite que começa neste dia. */
  noite: Noite;
  /** Noite anterior (a que termina na manhã deste dia). */
  noiteAnterior: Noite;
  sonecas: { a: number; b: number; min: number; emAndamento: boolean }[];
  /** Acordado entre: acordou→1ª soneca, entre sonecas, última→dormir. */
  janelas: { de: number; ate: number; min: number; rotulo: string }[];
  sonecasMin: number;
  mamadas: number;
  ml: number;
  fraldas: number;
  comidas: number;
  /** Para a linha de 24 h. */
  blocos: { tipo: 'noite' | 'soneca' | 'andamento'; a: number; b: number }[];
  marcas: { tipo: 'mamada' | 'fralda' | 'comida'; t: number }[];
  registros: RegistroRotina[];
}

export function resumoDoDia(regs: RegistroRotina[], dia: string, agora: number): ResumoDia {
  const ini = inicioDoDia(dia);
  const fimDia = ini + DIA;
  const noiteAnterior = noiteDe(regs, somarDias(dia, -1), agora);
  const noite = noiteDe(regs, dia, agora);
  const acordou = noiteAnterior.acordou;

  const desde = acordou ?? ini + 6 * H;
  const ate = noite.dormiu ?? ini + 18 * H;
  const noturnos = new Set([...noiteAnterior.segmentos, ...noite.segmentos].map((s) => s.a));
  const sonecas = sonos(regs, agora)
    .filter((s) => s.a >= desde && s.a < ate && !noturnos.has(s.a))
    .map((s) => ({ a: s.a, b: s.b, min: (s.b - s.a) / 60000, emAndamento: s.emAndamento }));

  const janelas: ResumoDia['janelas'] = [];
  let cursor: number | null = acordou;
  sonecas.forEach((s, i) => {
    if (cursor !== null && s.a > cursor) {
      janelas.push({ de: cursor, ate: s.a, min: (s.a - cursor) / 60000, rotulo: i === 0 ? 'Acordou → 1ª soneca' : `${i}ª → ${i + 1}ª soneca` });
    }
    cursor = s.emAndamento ? null : s.b;
  });
  if (cursor !== null && noite.dormiu !== null && noite.dormiu > cursor) {
    janelas.push({ de: cursor, ate: noite.dormiu, min: (noite.dormiu - cursor) / 60000, rotulo: sonecas.length ? 'Última soneca → noite' : 'Acordou → noite' });
  }

  const doDia = regs.filter((r) => {
    const t = new Date(r.inicio).getTime();
    return t >= ini && t < fimDia;
  });
  const mamadas = doDia.filter((r) => r.tipo === 'feeding');
  const ml = mamadas.reduce((s, r) => s + (Number((r.detalhe as { ml?: number }).ml) || 0), 0);

  const blocos: ResumoDia['blocos'] = [];
  for (const s of sonos(regs, agora)) {
    if (s.b <= ini || s.a >= fimDia) continue;
    const ehNoite = noturnos.has(s.a);
    blocos.push({ tipo: s.emAndamento ? 'andamento' : ehNoite ? 'noite' : 'soneca', a: Math.max(s.a, ini), b: Math.min(s.b, fimDia) });
  }
  const marcas: ResumoDia['marcas'] = doDia
    .filter((r) => r.tipo !== 'sleep')
    .map((r) => ({ tipo: r.tipo === 'feeding' ? 'mamada' : r.tipo === 'diaper' ? 'fralda' : 'comida', t: new Date(r.inicio).getTime() }));

  const registros = regs
    .filter((r) => {
      const a = new Date(r.inicio).getTime();
      const b = r.fim ? new Date(r.fim).getTime() : a;
      return b >= ini && a < fimDia;
    })
    .sort((x, y) => y.inicio.localeCompare(x.inicio));

  return {
    dia,
    temRegistro: registros.length > 0,
    acordou,
    noite,
    noiteAnterior,
    sonecas,
    janelas,
    sonecasMin: sonecas.reduce((s, x) => s + x.min, 0),
    mamadas: mamadas.length,
    ml,
    fraldas: doDia.filter((r) => r.tipo === 'diaper').length,
    comidas: doDia.filter((r) => r.tipo === 'food').length,
    blocos,
    marcas,
    registros,
  };
}

/** Rótulo e detalhe de um registro, em português simples. */
export function descreverRegistro(r: RegistroRotina, agora: number): { titulo: string; detalhe: string; cor: string } {
  const d = r.detalhe as Record<string, string | number | undefined>;
  const a = new Date(r.inicio).getTime();
  const b = r.fim ? new Date(r.fim).getTime() : null;
  if (r.tipo === 'sleep') {
    const min = ((b ?? agora) - a) / 60000;
    return { titulo: b ? 'Sono' : 'Dormindo', detalhe: `${hora(a)}${b ? ` – ${hora(b)}` : ' · em andamento'} · ${dur(min)}`, cor: '#9F86E0' };
  }
  if (r.tipo === 'feeding') {
    if (r.subtipo === 'bottle') {
      return { titulo: 'Mamadeira', detalhe: [d.ml ? `${d.ml} ml` : null, d.leite ? String(d.leite) : null].filter(Boolean).join(' · ') || 'sem quantidade', cor: '#F38BA0' };
    }
    const lado = d.lado === 'left' ? 'esquerdo' : d.lado === 'right' ? 'direito' : d.lado === 'both' ? 'os dois' : d.lado ? String(d.lado) : null;
    return { titulo: 'Peito', detalhe: [lado ? `lado ${lado}` : null, d.minutos ? `${d.minutos} min` : null].filter(Boolean).join(' · ') || '—', cor: '#E85D6A' };
  }
  if (r.tipo === 'diaper') {
    const f = d.fralda === 'wet' ? 'xixi' : d.fralda === 'dirty' ? 'cocô' : d.fralda === 'mixed' ? 'xixi e cocô' : d.fralda === 'dry' ? 'seca' : '—';
    return { titulo: 'Fralda', detalhe: f, cor: '#8CC63F' };
  }
  const refeicao = d.refeicao === 'lanche' ? 'lanche' : d.refeicao === 'refeicao' ? 'refeição' : null;
  return { titulo: 'Comida', detalhe: [refeicao, d.comida, d.quantidade].filter(Boolean).join(' · ') || '—', cor: '#F5A33B' };
}

/** Idade em meses (calendário), a partir de yyyy-mm-dd. */
export function idadeMeses(nascimento: string | null, hojeDia: string): number | null {
  if (!nascimento) return null;
  const [y1, m1, d1] = nascimento.slice(0, 10).split('-').map(Number);
  const [y2, m2, d2] = hojeDia.split('-').map(Number);
  let m = (y2 - y1) * 12 + (m2 - m1);
  if (d2 < d1) m--;
  return m;
}

// ═══ v3 (desenho aprovado em 08/11/2026: docs/design/consultora/v3.html) ═══
// O dia vai "do acordar ao acordar": acordou em D → sonecas e janelas → dormiu
// em D → noite → acordou em D+1. Sem registro, sem número.

export interface DiaV3 {
  dia: string;
  temRegistro: boolean;
  /** Acordou na manhã de D (fim da noite anterior). */
  acordou: number | null;
  /** Dormiu na noite de D. */
  dormiu: number | null;
  /** Acordou na manhã de D+1 (fim da noite de D). */
  acordouSeguinte: number | null;
  sonecas: ResumoDia['sonecas'];
  sonecasMin: number;
  janelas: ResumoDia['janelas'];
  /** Da última soneca (ou do acordar) até dormir, em minutos. */
  janelaAntesDeDormir: number | null;
  fimUltimaSoneca: number | null;
  noite: Noite;
  /** A noite só conta nas médias se tem dormir e acordar. */
  noiteCompleta: boolean;
  /** Intervalos acordado dentro da noite. */
  despertaresLista: { a: number; b: number; min: number }[];
  /** Mamadas entre dormir e acordar. */
  mamadasMadrugada: number[];
  /** Mamadas do dia (do acordar ao dormir). */
  mamadasDia: number[];
  /** Sonecas do dia + a noite seguinte. */
  sono24: number | null;
  resumo: ResumoDia;
}

export function diaV3(regs: RegistroRotina[], dia: string, agora: number): DiaV3 {
  const r = resumoDoDia(regs, dia, agora);
  const n = r.noite;
  const fimUltimaSoneca = r.sonecas.length ? r.sonecas[r.sonecas.length - 1].b : null;
  const inicioJanela = fimUltimaSoneca ?? r.acordou;
  const janelaAntesDeDormir = n.dormiu !== null && inicioJanela !== null && n.dormiu > inicioJanela ? (n.dormiu - inicioJanela) / 60000 : null;
  const despertaresLista = n.segmentos.slice(1).map((s, i) => ({ a: n.segmentos[i].b, b: s.a, min: (s.a - n.segmentos[i].b) / 60000 }));
  const mamadas = regs.filter((x) => x.tipo === 'feeding').map((x) => new Date(x.inicio).getTime());
  const fimNoite = n.acordou ?? (n.dormiu !== null ? Math.min(agora, inicioDoDia(dia) + 35 * H) : null);
  const mamadasMadrugada = n.dormiu !== null && fimNoite !== null ? mamadas.filter((t) => t >= n.dormiu! && t <= fimNoite) : [];
  const ini = r.acordou ?? inicioDoDia(dia) + 6 * H;
  const fimDia = n.dormiu ?? inicioDoDia(dia) + 20 * H;
  const mamadasDia = mamadas.filter((t) => t >= ini && t < fimDia);
  const noiteCompleta = n.dormiu !== null && n.acordou !== null;
  return {
    dia,
    temRegistro: r.temRegistro,
    acordou: r.acordou,
    dormiu: n.dormiu,
    acordouSeguinte: n.acordou,
    sonecas: r.sonecas,
    sonecasMin: r.sonecasMin,
    janelas: r.janelas,
    janelaAntesDeDormir,
    fimUltimaSoneca,
    noite: n,
    noiteCompleta,
    despertaresLista,
    mamadasMadrugada,
    mamadasDia,
    sono24: noiteCompleta ? r.sonecasMin + (n.totalMin ?? 0) : null,
    resumo: r,
  };
}

/** Minutos desde a meia-noite local (para comparar horários de dias diferentes). */
export function minutoDoDia(t: number): number {
  const d = new Date(t + FUSO_MS);
  return d.getUTCHours() * 60 + d.getUTCMinutes();
}

/** Hora de dormir em minutos, com o que passa da meia-noite somado a 24h (00:30 → 24:30). */
export function minutoDaNoite(t: number): number {
  const m = minutoDoDia(t);
  return m < 12 * 60 ? m + 1440 : m;
}

/** "06:15" de minutos (aceita > 1440). */
export function hhmm(min: number): string {
  const m = ((Math.round(min) % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

function media(xs: number[]): number | null {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;
}

export interface FaixaHorario {
  rotulo: string;
  /** Um valor por dia (minutos, ver minutoDoDia/minutoDaNoite) ou null. */
  valores: (number | null)[];
  min: number | null;
  max: number | null;
  /** Variação max − min, em minutos. */
  variacao: number | null;
  /** Variou 1h ou mais: o desenho marca em laranja. */
  irregular: boolean;
  /** Em quantos dias apareceu (ex.: a 3ª soneca). */
  dias: number;
}

export interface SemanaV3 {
  dias: DiaV3[];
  /** Médias só com noites completas / dias com registro. */
  noiteMed: number | null;
  despertaresMed: number | null;
  blocoMed: number | null;
  sonecasPorDia: number | null;
  sonecasMinMed: number | null;
  sono24Med: number | null;
  noitesCompletas: number;
  /** Os 2 dias com as melhores noites (mais sono, depois maior 1º bloco). */
  melhores: string[];
  /** Maior janela acordado da semana (minutos). */
  maiorJanela: number | null;
  horarios: FaixaHorario[];
}

function faixa(rotulo: string, valores: (number | null)[]): FaixaHorario {
  const v = valores.filter((x): x is number => x !== null);
  const min = v.length ? Math.min(...v) : null;
  const max = v.length ? Math.max(...v) : null;
  const variacao = min !== null && max !== null ? max - min : null;
  return { rotulo, valores, min, max, variacao, irregular: (variacao ?? 0) >= 60, dias: v.length };
}

/** `n` dias terminando em `ultimoDia` (inclusive). */
export function semanaV3(regs: RegistroRotina[], ultimoDia: string, agora: number, n = 7): SemanaV3 {
  const dias = Array.from({ length: n }, (_, i) => diaV3(regs, somarDias(ultimoDia, i - (n - 1)), agora));
  const completas = dias.filter((d) => d.noiteCompleta);
  const comDia = dias.filter((d) => d.temRegistro && d.acordou !== null && d.dormiu !== null);
  const melhores = [...completas]
    .sort((a, b) => (b.noite.totalMin ?? 0) - (a.noite.totalMin ?? 0) || (b.noite.primeiroTrechoMin ?? 0) - (a.noite.primeiroTrechoMin ?? 0))
    .slice(0, 2)
    .map((d) => d.dia);
  const todasJanelas = dias.flatMap((d) => d.janelas.map((j) => j.min));
  const sonecaN = (k: number) => dias.map((d) => (d.sonecas[k] ? minutoDoDia(d.sonecas[k].a) : null));
  return {
    dias,
    noiteMed: media(completas.map((d) => d.noite.totalMin ?? 0)),
    despertaresMed: media(completas.map((d) => d.noite.despertares ?? 0)),
    blocoMed: media(completas.map((d) => d.noite.primeiroTrechoMin).filter((x): x is number => x !== null)),
    sonecasPorDia: media(comDia.map((d) => d.sonecas.length)),
    sonecasMinMed: media(comDia.map((d) => d.sonecasMin)),
    sono24Med: media(dias.map((d) => d.sono24).filter((x): x is number => x !== null)),
    noitesCompletas: completas.length,
    melhores,
    maiorJanela: todasJanelas.length ? Math.max(...todasJanelas) : null,
    horarios: [
      faixa('Acordou', dias.map((d) => (d.acordou !== null ? minutoDoDia(d.acordou) : null))),
      faixa('1ª soneca', sonecaN(0)),
      faixa('2ª soneca', sonecaN(1)),
      faixa('3ª soneca', sonecaN(2)),
      faixa('Dormiu', dias.map((d) => (d.dormiu !== null ? minutoDaNoite(d.dormiu) : null))),
    ].filter((f) => f.dias > 0),
  };
}

/** "De costume" do próprio bebê: a semana antes do dia, para comparar o dia. */
export function costumeAntes(regs: RegistroRotina[], dia: string, agora: number): SemanaV3 {
  return semanaV3(regs, somarDias(dia, -1), agora, 7);
}

/** Texto curto de uma faixa: "06:15–06:50" (ou um horário só). */
export function faixaTxt(f: FaixaHorario | undefined): string | null {
  if (!f || f.min === null || f.max === null) return null;
  return f.min === f.max ? hhmm(f.min) : `${hhmm(f.min)}–${hhmm(f.max)}`;
}
