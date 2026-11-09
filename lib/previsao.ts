/**
 * Ninho · Previsão de assinantes pagos (pedido do dono, 09/11/2026). Puro:
 * recebe usuários e uso já lidos e devolve a previsão — não lê o banco.
 *
 * Assinante = pagou de fato (`assinouEm`, igual a assinantesNovos em
 * lib/metrics.ts; no teste da loja, a data é o fim dos 7 dias grátis).
 *
 * A previsão soma três partes, todas com taxas MEDIDAS na hora, nunca fixas:
 *  1. Testes do app que vencem em cada dia × chance de pagar. Quem já usou o
 *     app em 3 dias ou mais paga a taxa dos "ativos"; quem não tem mais como
 *     chegar a 3 dias paga a dos "pouco ativos"; o resto, a taxa da origem.
 *  2. Testes da loja (cartão, 7 dias grátis) que vencem × taxa de quem pagou
 *     depois do teste da loja.
 *  3. Cadastros que ainda vão chegar (média dos últimos 14 dias, ou o número
 *     do cenário) × taxa por cadastro de cada origem, 7 dias depois.
 *
 * Calibração: contas cujo teste já acabou, criadas desde JANELA_INICIO (antes
 * disso a origem Apple Ads não era registrada para quase ninguém) e no máximo
 * JANELA_DIAS atrás, para as taxas acompanharem o app de hoje.
 *
 * Limite conhecido: "dias com registro" vem do uso total da conta, não só do
 * teste. Quem não paga não registra depois do teste (o grátis não registra),
 * então o efeito é pequeno.
 */
import type { AppUser } from '@/lib/app-users';
import type { UsoUsuario } from '@/lib/app-users';

const TZ = 'Asia/Dubai';
const DIA_MS = 86_400_000;
/** Antes disso quase ninguém tinha a origem Apple Ads gravada. */
const JANELA_INICIO = Date.parse('2026-10-19T00:00:00Z');
const JANELA_DIAS = 45;
const DIAS_TESTE = 7;
const DIAS_ATIVO = 3;
/** Incerteza das taxas (±30%), além da sorte de cada pessoa. */
const INCERTEZA_TAXA = 0.3;
/** z de 80% (10% de cada lado). */
const Z80 = 1.2816;

export type GrupoOrigem = 'apple_ads' | 'instagram_facebook' | 'outros';
export const GRUPO_ORIGEM_LABEL: Record<GrupoOrigem, string> = {
  apple_ads: 'Apple Ads',
  instagram_facebook: 'Instagram/Facebook (declarado)',
  outros: 'Outros e sem informação',
};
const GRUPOS: GrupoOrigem[] = ['apple_ads', 'instagram_facebook', 'outros'];

export function grupoOrigem(u: AppUser): GrupoOrigem {
  if (u.origem === 'apple_ads') return 'apple_ads';
  if (u.origem === 'instagram_facebook') return 'instagram_facebook';
  return 'outros';
}

export function diaDubai(t: number | string | Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(
    new Date(t),
  );
}
function somaDias(dia: string, n: number): string {
  return new Date(Date.parse(dia + 'T12:00:00Z') + n * DIA_MS).toISOString().slice(0, 10);
}
function fimDoMes(dia: string): string {
  const [y, m] = dia.split('-').map(Number);
  return new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);
}

export interface Taxa {
  pagaram: number;
  total: number;
  /** null = ninguém na base (não dá para dividir). */
  pct: number | null;
}
const taxa = (pagaram: number, total: number): Taxa => ({ pagaram, total, pct: total > 0 ? pagaram / total : null });

export interface Calibracao {
  desde: string;
  ativos: Taxa;
  poucoAtivos: Taxa;
  /** Parte da base que chegou a 3 dias de uso. */
  ativacao: Taxa;
  porOrigem: Record<GrupoOrigem, Taxa>;
  /** Parte de cada origem que chegou a 3 dias de uso. */
  ativacaoOrigem: Record<GrupoOrigem, Taxa>;
  geral: Taxa;
  loja: Taxa;
  /** Cadastros por dia (média dos últimos 14 dias completos), por origem. */
  cadastrosDia: Record<GrupoOrigem, number>;
}

export interface DiaPrevisao {
  dia: string;
  /** Pagaram de fato (só dias passados e hoje). */
  real: number | null;
  /** Esperado pelo modelo: no passado, o que o modelo dava para quem venceu
   *  naquele dia (para comparar); no futuro, a previsão. */
  esperado: number;
  baixo: number;
  alto: number;
  testesApp: number;
  testesLoja: number;
  cadastrosNovos: number;
  futuro: boolean;
}

export interface Mes {
  mes: string;
  jaPagaram: number;
  previsto: number;
  baixo: number;
  alto: number;
}

export interface Previsao {
  hoje: string;
  calibracao: Calibracao;
  cadastrosPorDiaCenario: number;
  cenarioManual: boolean;
  dias: DiaPrevisao[];
  mesAtual: Mes;
  proximoMes: Mes;
  proximos7: { previsto: number; baixo: number; alto: number };
  /** Testes em andamento agora (para mostrar o "funil" que vem). */
  emAndamento: { app: number; appAtivos: number; loja: number };
}

const pagou = (u: AppUser) => !!u.assinouEm && (u.estado === 'pagante' || u.estado === 'churn');

/** Dias com registro do usuário (0 se não houver uso). */
function diasUso(uso: Map<string, UsoUsuario>, id: string): number {
  return uso.get(id)?.diasRegistro ?? 0;
}

export function calibrar(users: AppUser[], uso: Map<string, UsoUsuario>, agora: number): Calibracao {
  const inicio = Math.max(JANELA_INICIO, agora - JANELA_DIAS * DIA_MS);
  let at = 0, atP = 0, po = 0, poP = 0;
  const og: Record<GrupoOrigem, [number, number]> = { apple_ads: [0, 0], instagram_facebook: [0, 0], outros: [0, 0] };
  const atOg: Record<GrupoOrigem, number> = { apple_ads: 0, instagram_facebook: 0, outros: 0 };
  let lojaP = 0, lojaT = 0;
  const cad: Record<GrupoOrigem, number> = { apple_ads: 0, instagram_facebook: 0, outros: 0 };
  const hoje = diaDubai(agora);
  const cadDe = somaDias(hoje, -14);

  for (const u of users) {
    if (u.herdadoDe) continue;
    const criado = Date.parse(u.created_at);
    const dCriado = diaDubai(criado);
    if (dCriado >= cadDe && dCriado < hoje) cad[grupoOrigem(u)]++;

    // Teste da loja já decidido: pagou ou cancelou (1 dia de folga para a renovação chegar).
    if (u.testeLojaAte && Date.parse(u.testeLojaAte) < agora - DIA_MS && criado >= inicio) {
      if (pagou(u)) { lojaP++; lojaT++; } else if (u.cancelouTesteLoja || u.estado === 'trial_expirado') lojaT++;
    }

    // Base do teste do app: teste já acabou, não está no teste da loja.
    if (criado < inicio || u.emTesteLoja || !u.trial_ends_at) continue;
    if (Date.parse(u.trial_ends_at) >= agora) continue;
    const p = pagou(u);
    const g = og[grupoOrigem(u)];
    g[1]++; if (p) g[0]++;
    if (diasUso(uso, u.id) >= DIAS_ATIVO) { at++; atOg[grupoOrigem(u)]++; if (p) atP++; } else { po++; if (p) poP++; }
  }
  const porOrigem = Object.fromEntries(GRUPOS.map((k) => [k, taxa(og[k][0], og[k][1])])) as Record<GrupoOrigem, Taxa>;
  const ativacaoOrigem = Object.fromEntries(GRUPOS.map((k) => [k, taxa(atOg[k], og[k][1])])) as Record<GrupoOrigem, Taxa>;
  return {
    desde: diaDubai(inicio),
    ativos: taxa(atP, at),
    poucoAtivos: taxa(poP, po),
    ativacao: taxa(at, at + po),
    porOrigem,
    ativacaoOrigem,
    geral: taxa(atP + poP, at + po),
    loja: taxa(lojaP, lojaT),
    cadastrosDia: Object.fromEntries(GRUPOS.map((k) => [k, cad[k] / 14])) as Record<GrupoOrigem, number>,
  };
}

interface Acumulador { m: number; v: number; app: number; loja: number; novos: number }

export function preverAssinantes(
  users: AppUser[],
  uso: Map<string, UsoUsuario>,
  opcoes: { agora?: number; cadastrosPorDia?: number | null; diasPassados?: number } = {},
): Previsao {
  const agora = opcoes.agora ?? Date.now();
  const hoje = diaDubai(agora);
  const cal = calibrar(users, uso, agora);
  const p = (t: Taxa, reserva: number) => t.pct ?? reserva;
  const pGeral = p(cal.geral, 0);
  const pAtivo = p(cal.ativos, pGeral);
  const pPouco = p(cal.poucoAtivos, pGeral);
  const pLoja = p(cal.loja, pGeral);
  const pOrigem = (g: GrupoOrigem) => p(cal.porOrigem[g], pGeral);

  const cadMedia = GRUPOS.reduce((s, g) => s + cal.cadastrosDia[g], 0);
  const cenarioManual = opcoes.cadastrosPorDia != null && opcoes.cadastrosPorDia >= 0;
  const cadDia = cenarioManual ? (opcoes.cadastrosPorDia as number) : cadMedia;
  // Taxa por cadastro novo, na mistura de origens dos últimos 14 dias.
  const convNovo =
    cadMedia > 0 ? GRUPOS.reduce((s, g) => s + (cal.cadastrosDia[g] / cadMedia) * pOrigem(g), 0) : pGeral;

  const diasPassados = opcoes.diasPassados ?? 21;
  const fimProx = fimDoMes(somaDias(fimDoMes(hoje), 1));
  const acc = new Map<string, Acumulador>();
  const add = (dia: string, prob: number, tipo: 'app' | 'loja' | 'novos', lambda = false) => {
    const a = acc.get(dia) ?? { m: 0, v: 0, app: 0, loja: 0, novos: 0 };
    a.m += prob;
    a.v += lambda ? prob : prob * (1 - prob);
    acc.set(dia, a);
    return a;
  };
  const real = new Map<string, number>();
  let appAgora = 0, appAtivosAgora = 0, lojaAgora = 0;
  const turmas = new Map<string, { dia: string; origem: GrupoOrigem; total: number; ativos: number; abertos: number }>();

  for (const u of users) {
    if (u.herdadoDe) continue;
    if (pagou(u)) {
      const d = diaDubai(u.assinouEm!);
      real.set(d, (real.get(d) ?? 0) + 1);
    }
    const dias = diasUso(uso, u.id);

    // Teste da loja: vence em testeLojaAte.
    if (u.testeLojaAte) {
      const d = diaDubai(u.testeLojaAte);
      const noFuturo = u.emTesteLoja;
      if (noFuturo || d >= somaDias(hoje, -diasPassados)) {
        if (noFuturo) lojaAgora++;
        add(d, pLoja, 'loja').loja++;
      }
      continue; // o teste do app dele acabou no sorteio: não conta de novo
    }
    if (!u.trial_ends_at) continue;
    const fim = Date.parse(u.trial_ends_at);
    const d = diaDubai(fim);
    if (d < somaDias(hoje, -diasPassados)) continue;
    let prob: number;
    if (fim < agora) {
      // Passado: o que o modelo diria olhando o uso final da pessoa.
      prob = dias >= DIAS_ATIVO ? pAtivo : pPouco;
    } else {
      appAgora++;
      const restam = Math.max(0, Math.ceil((fim - agora) / DIA_MS));
      const chave = `${d}|${grupoOrigem(u)}`;
      const t = turmas.get(chave) ?? { dia: d, origem: grupoOrigem(u), total: 0, ativos: 0, abertos: 0 };
      t.total++;
      turmas.set(chave, t);
      if (dias >= DIAS_ATIVO) { prob = pAtivo; t.ativos++; appAtivosAgora++; }
      else if (dias + restam < DIAS_ATIVO) prob = pPouco;
      else { t.abertos++; continue; } // decide depois de contar a turma inteira
    }
    add(d, prob, 'app').app++;
  }

  // Quem ainda pode chegar a 3 dias: a turma (mesmo dia de fim, mesma origem)
  // deve terminar com a ativação medida daquela origem; os que já ativaram
  // saem dessa conta, e o que falta se divide entre os que ainda podem ativar.
  // Dar a taxa da origem inteira a eles contava em dobro quem já ativou.
  for (const t of turmas.values()) {
    if (t.abertos === 0) continue;
    const a = cal.ativacaoOrigem[t.origem].pct ?? cal.ativacao.pct ?? 0;
    const faltam = Math.min(t.abertos, Math.max(0, a * t.total - t.ativos));
    const prob = pPouco + (pAtivo - pPouco) * (faltam / t.abertos);
    for (let i = 0; i < t.abertos; i++) add(t.dia, prob, 'app').app++;
  }

  // Cadastros que ainda vão chegar: quem se cadastra amanhã termina o teste em 7 dias.
  for (let dia = somaDias(hoje, DIAS_TESTE + 1); dia <= fimProx; dia = somaDias(dia, 1)) {
    const a = add(dia, cadDia * convNovo, 'novos', true);
    a.novos += cadDia;
  }

  const dias: DiaPrevisao[] = [];
  for (let dia = somaDias(hoje, -diasPassados); dia <= fimProx; dia = somaDias(dia, 1)) {
    const a = acc.get(dia) ?? { m: 0, v: 0, app: 0, loja: 0, novos: 0 };
    const futuro = dia > hoje;
    const sd = Math.sqrt(a.v + (INCERTEZA_TAXA * a.m) ** 2);
    dias.push({
      dia,
      real: futuro ? null : (real.get(dia) ?? 0),
      esperado: a.m,
      baixo: Math.max(0, a.m - Z80 * sd),
      alto: a.m + Z80 * sd,
      testesApp: a.app,
      testesLoja: a.loja,
      cadastrosNovos: a.novos,
      futuro,
    });
  }

  const somaFaixa = (lista: DiaPrevisao[]) => {
    let m = 0, v = 0;
    for (const d of lista) { const a = acc.get(d.dia); if (a) { m += a.m; v += a.v; } }
    const sd = Math.sqrt(v + (INCERTEZA_TAXA * m) ** 2);
    return { previsto: m, baixo: Math.max(0, m - Z80 * sd), alto: m + Z80 * sd };
  };
  const mesDe = (dia: string) => dia.slice(0, 7);
  const mesAtualId = mesDe(hoje);
  const proxId = mesDe(fimProx);
  let jaPagaram = 0;
  for (const [d, n] of real) if (mesDe(d) === mesAtualId && d <= hoje) jaPagaram += n;
  const restoMes = somaFaixa(dias.filter((d) => d.futuro && mesDe(d.dia) === mesAtualId));
  const prox = somaFaixa(dias.filter((d) => mesDe(d.dia) === proxId));
  const sete = somaFaixa(dias.filter((d) => d.futuro && d.dia <= somaDias(hoje, 7)));

  return {
    hoje,
    calibracao: cal,
    cadastrosPorDiaCenario: cadDia,
    cenarioManual,
    dias,
    mesAtual: {
      mes: mesAtualId,
      jaPagaram,
      previsto: jaPagaram + restoMes.previsto,
      baixo: jaPagaram + restoMes.baixo,
      alto: jaPagaram + restoMes.alto,
    },
    proximoMes: { mes: proxId, jaPagaram: 0, ...prox },
    proximos7: sete,
    emAndamento: { app: appAgora, appAtivos: appAtivosAgora, loja: lojaAgora },
  };
}
