/**
 * Ninho · Análise das ações de marketing/retenção. Server-only.
 *
 * Responde "a ação que eu fiz trouxe assinante? as pessoas viram?" lendo
 * direto o que o app e as edge functions já gravam:
 *
 *   push_log            → push de campanha enviada; `opened_at` é escrito
 *                         pelo app quando a pessoa toca (desde a 1.0.3)
 *   email_log           → e-mail de campanha; abertura/clique só chegam se
 *                         o webhook do Resend estiver ligado
 *   notifications       → sininho; `data.campanha` marca a campanha e
 *                         `read_at` diz se a pessoa abriu
 *   trial_nudges_log    → régua automática de trial acabando (d3/d2/d1/d0)
 *   purchase_verifications (status verificado) → quando a pessoa assinou
 *   analytics_events    → app_aberto / atividade_registrada (voltou a usar)
 *                         e os eventos do banner de cuidador
 *   caregiver_invites   → convites de cuidador enviados/aceitos
 *
 * Campanha nova que sair do `enviar-comunicado` aparece aqui sozinha: a
 * tabela de campanhas é montada a partir do que existe nos logs, não de
 * uma lista fixa. Só o rótulo bonito (CAMPANHA_LABEL) é manual.
 *
 * Sem RPC de propósito: as migrations só entram colando no SQL Editor, e
 * esta tela precisava funcionar já. Toda leitura pagina (PostgREST corta em
 * 1.000 linhas) — ver `todas()`.
 */
import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { appDb } from '@/lib/supabase/server';
import { appDbConfigured } from '@/lib/status-conta';

const DIA = 86_400_000;

/** Nome legível das campanhas conhecidas. Campanha nova sem entrada aqui
 *  aparece com o id cru — funciona igual, só fica menos bonita. */
export const CAMPANHA_LABEL: Record<string, string> = {
  presente_7_dias: 'Presente +7 dias (quem mais usou)',
  presente_fim_d2: 'Presente termina em 2 dias',
  presente_fim_d1: 'Presente termina amanhã',
  promo_anual: 'Promo anual (BASICO69 / PREMIUM99)',
  pos_trial: 'Pós-trial: rotina em pausa',
  atualizar_1_0_4: 'Pedido de atualização 1.0.4',
  preco_especial: 'Preço especial do anual',
};

export const TRIAL_LABEL: Record<string, string> = {
  trial_d3: 'Faltam 3 dias',
  trial_d2: 'Faltam 2 dias',
  trial_d1: 'Termina amanhã',
  trial_d0: 'Termina hoje',
};

/** Preço de tabela em milésimos (formato do `price` da Apple). Compra abaixo
 *  disso = foi com oferta, mesmo se a Apple não mandar `offerType`. */
const PRECO_TABELA_MILI: Record<string, number> = {
  ninho_basico_mensal: 9_900,
  ninho_basico_anual: 89_900,
  ninho_bebe_premium_mensal: 14_900,
  ninho_bebe_premium_anual: 129_900,
};

// ─── Leitura paginada ────────────────────────────────────────────────────

type Pagina<T> = PromiseLike<{ data: T[] | null; error: { message: string } | null }>;

async function todas<T>(nome: string, pagina: (de: number, ate: number) => Pagina<T>): Promise<T[]> {
  const out: T[] = [];
  const tam = 1000;
  for (let de = 0; de < 200_000; de += tam) {
    const { data, error } = await pagina(de, de + tam - 1);
    if (error) {
      // Falhar calado viraria "ninguém abriu nada" — número que muda decisão.
      console.error(`[painel] análise: ${nome} falhou:`, error.message);
      break;
    }
    out.push(...(data ?? []));
    if (!data || data.length < tam) break;
  }
  return out;
}

function pedacos<T>(xs: T[], n: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < xs.length; i += n) out.push(xs.slice(i, i + n));
  return out;
}

// ─── Tipos de saída ──────────────────────────────────────────────────────

export interface Canal {
  enviados: number;
  abertos: number;
}

export interface CampanhaResumo {
  id: string;
  label: string;
  inicio: string;
  pessoas: number;
  push: Canal;
  email: Canal & { clicados: number };
  sininho: Canal;
  /** Abriram o app depois de receber. */
  voltaramAbrir: number;
  /** Registraram algo da rotina depois de receber. */
  voltaramRegistrar: number;
  /** Assinaram depois de receber (primeira compra verificada). */
  assinaram: number;
  assinantes: PessoaAssinou[];
}

export interface PessoaAssinou {
  profileId: string;
  nome: string | null;
  produto: string;
  em: string;
  /** Dias entre receber a ação e assinar. */
  diasDepois: number;
}

export interface TrialRegua {
  kind: string;
  label: string;
  pessoas: number;
  sininhoEnviados: number;
  sininhoLidos: number;
  emails: number;
  /** Assinaram em até 7 dias depois do aviso. */
  assinaram7d: number;
}

export interface FaixaExpiracao {
  label: string;
  n: number;
}

export interface CompraOferta {
  profileId: string;
  nome: string | null;
  produto: string;
  preco: number;
  precoTabela: number;
  oferta: string;
  em: string;
}

export interface Analise {
  campanhas: CampanhaResumo[];
  trial: TrialRegua[];
  /** Quando cada assinante pagou em relação ao fim do próprio teste. */
  expiracao: {
    faixas: FaixaExpiracao[];
    totalAssinantes: number;
    depoisDe3Dias: (PessoaAssinou & { recebeu: string[] })[];
    expiradosSemAssinar: number;
  };
  ofertas: {
    total: number;
    compras: CompraOferta[];
    anuais: number;
  };
  cuidador: {
    bannerVisto: number;
    bannerConvidar: number;
    bannerAgoraNao: number;
    convidaramDepoisBanner: number;
    aceitosDepoisBanner: number;
    assinaramDepoisBanner: number;
    /** Comparativo histórico (todo o período), já funciona sem o banner. */
    historico: {
      convidaram: number;
      convidaramAssinaram: number;
      convidaramAceito: number;
      naoConvidaram: number;
      naoConvidaramAssinaram: number;
    };
  };
  emailRastreado: boolean;
  geradoEm: string;
}

// ─── Linhas cruas ────────────────────────────────────────────────────────

interface LogRow {
  profile_id: string;
  campanha: string;
  sent_at: string;
  opened_at: string | null;
  clicked_at?: string | null;
  ultimo_evento?: string | null;
}
interface NotifRow {
  profile_id: string;
  data: { campanha?: string; deeplink?: string } | null;
  created_at: string;
  read_at: string | null;
}
interface TrialRow {
  profile_id: string;
  kind: string;
  created_at: string;
}
interface CompraRow {
  profile_id: string;
  product_id: string;
  created_at: string;
  detalhe: string | null;
}
interface SubRow {
  profile_id: string;
  status: string;
  trial_ends_at: string | null;
}
interface EventRow {
  profile_id: string;
  event_name: string;
  created_at: string;
}
interface InviteRow {
  invited_by: string;
  created_at: string;
  accepted_at: string | null;
  deleted_at: string | null;
}
interface ProfileRow {
  id: string;
  full_name: string | null;
}

interface Compra {
  profileId: string;
  produto: string;
  em: number;
  preco: number | null;
  oferta: string | null;
}

/**
 * Primeira compra de cada conta. Uma mesma assinatura da Apple
 * (`originalTransactionId`) restaurada em outra conta conta só pra quem
 * comprou primeiro — senão o dono testando com o próprio Apple ID em
 * contas de teste viraria "assinante novo".
 */
function primeirasCompras(rows: CompraRow[]): Map<string, Compra> {
  const out = new Map<string, Compra>();
  const transacoes = new Set<string>();
  for (const r of [...rows].sort((a, b) => a.created_at.localeCompare(b.created_at))) {
    let j: Record<string, unknown> = {};
    try {
      j = r.detalhe ? JSON.parse(r.detalhe) : {};
    } catch {
      /* detalhe antigo não-JSON: segue sem preço */
    }
    const orig = typeof j.originalTransactionId === 'string' ? j.originalTransactionId : null;
    if (orig) {
      if (transacoes.has(orig)) continue;
      transacoes.add(orig);
    }
    if (out.has(r.profile_id)) continue;
    const preco = typeof j.price === 'number' ? j.price : null;
    const tabela = PRECO_TABELA_MILI[r.product_id];
    let oferta: string | null = null;
    if (typeof j.offerIdentifier === 'string' && j.offerIdentifier) oferta = j.offerIdentifier;
    else if (j.offerType != null) oferta = `oferta tipo ${String(j.offerType)}`;
    else if (preco != null && tabela && preco < tabela) oferta = 'preço abaixo da tabela';
    out.set(r.profile_id, { profileId: r.profile_id, produto: r.product_id, em: Date.parse(r.created_at), preco, oferta });
  }
  return out;
}

const PRODUTO_LABEL: Record<string, string> = {
  ninho_basico_mensal: 'Básico mensal',
  ninho_basico_anual: 'Básico anual',
  ninho_bebe_premium_mensal: 'Premium mensal',
  ninho_bebe_premium_anual: 'Premium anual',
};
export const produtoLabel = (p: string) => PRODUTO_LABEL[p] ?? p;

// ─── Montagem ────────────────────────────────────────────────────────────

async function montarAnaliseRaw(): Promise<Analise | null> {
  if (!appDbConfigured()) return null;
  const sb = appDb();

  const [pushes, emails, notifs, trialLog, comprasRows, subs, profiles, convites, eventosCuidador] =
    await Promise.all([
      todas<LogRow>('push_log', (de, ate) =>
        sb.from('push_log').select('profile_id,campanha,sent_at,opened_at').is('erro', null).range(de, ate),
      ),
      todas<LogRow>('email_log', (de, ate) =>
        sb
          .from('email_log')
          .select('profile_id,campanha,sent_at,opened_at,clicked_at,ultimo_evento')
          .is('erro', null)
          .range(de, ate),
      ),
      // Sininho: campanhas (data.campanha) + os da régua de trial (sem
      // campanha, link pra tela de planos) — os dois tipos interessam.
      todas<NotifRow>('notifications', (de, ate) =>
        sb
          .from('notifications')
          .select('profile_id,data,created_at,read_at')
          .is('deleted_at', null)
          .or('data->>campanha.not.is.null,type.eq.conta')
          .order('created_at', { ascending: true })
          .range(de, ate),
      ),
      todas<TrialRow>('trial_nudges_log', (de, ate) =>
        sb.from('trial_nudges_log').select('profile_id,kind,created_at').eq('status', 'enviado').range(de, ate),
      ),
      todas<CompraRow>('purchase_verifications', (de, ate) =>
        sb
          .from('purchase_verifications')
          .select('profile_id,product_id,created_at,detalhe')
          .eq('status', 'verificado')
          .range(de, ate),
      ),
      todas<SubRow>('subscriptions', (de, ate) =>
        sb.from('subscriptions').select('profile_id,status,trial_ends_at').is('deleted_at', null).range(de, ate),
      ),
      todas<ProfileRow>('profiles', (de, ate) => sb.from('profiles').select('id,full_name').range(de, ate)),
      todas<InviteRow>('caregiver_invites', (de, ate) =>
        sb.from('caregiver_invites').select('invited_by,created_at,accepted_at,deleted_at').range(de, ate),
      ),
      todas<EventRow>('analytics_events (cuidador)', (de, ate) =>
        sb
          .from('analytics_events')
          .select('profile_id,event_name,created_at')
          .like('event_name', 'cuidador_%')
          .range(de, ate),
      ),
    ]);

  const nomes = new Map(profiles.map((p) => [p.id, p.full_name?.trim() || null]));
  const compras = primeirasCompras(comprasRows);
  const assinou = (id: string, depoisDe: number, ateMs = Infinity) => {
    const c = compras.get(id);
    return c && c.em >= depoisDe && c.em <= ateMs ? c : null;
  };

  // ── Campanhas ─────────────────────────────────────────────────────────
  interface Acc {
    primeiro: Map<string, number>;
    push: Canal;
    email: Canal & { clicados: number };
    sininho: Canal;
  }
  const accs = new Map<string, Acc>();
  const acc = (id: string) => {
    let a = accs.get(id);
    if (!a) {
      a = {
        primeiro: new Map(),
        push: { enviados: 0, abertos: 0 },
        email: { enviados: 0, abertos: 0, clicados: 0 },
        sininho: { enviados: 0, abertos: 0 },
      };
      accs.set(id, a);
    }
    return a;
  };
  const tocar = (a: Acc, pid: string, quando: string) => {
    const t = Date.parse(quando);
    const atual = a.primeiro.get(pid);
    if (atual === undefined || t < atual) a.primeiro.set(pid, t);
  };

  for (const p of pushes) {
    const a = acc(p.campanha);
    a.push.enviados++;
    if (p.opened_at) a.push.abertos++;
    tocar(a, p.profile_id, p.sent_at);
  }
  let emailRastreado = false;
  for (const e of emails) {
    const a = acc(e.campanha);
    a.email.enviados++;
    if (e.ultimo_evento) emailRastreado = true;
    if (e.opened_at || e.clicked_at) a.email.abertos++;
    if (e.clicked_at) a.email.clicados++;
    tocar(a, e.profile_id, e.sent_at);
  }
  const sininhoTrial: NotifRow[] = [];
  for (const n of notifs) {
    const camp = n.data?.campanha;
    if (!camp) {
      sininhoTrial.push(n);
      continue;
    }
    const a = acc(camp);
    a.sininho.enviados++;
    if (n.read_at) a.sininho.abertos++;
    tocar(a, n.profile_id, n.created_at);
  }

  // "Voltou a usar": eventos de quem recebeu alguma campanha, a partir do
  // primeiro envio. Só os ids das campanhas — nunca a tabela inteira.
  const alvos = new Set<string>();
  let desde = Infinity;
  for (const a of accs.values())
    for (const [pid, t] of a.primeiro) {
      alvos.add(pid);
      desde = Math.min(desde, t);
    }
  const uso = new Map<string, { abriu: number[]; registrou: number[] }>();
  if (alvos.size > 0) {
    const desdeIso = new Date(desde).toISOString();
    const lotes = await Promise.all(
      pedacos([...alvos], 150).map((ids) =>
        todas<EventRow>('analytics_events (uso)', (de, ate) =>
          sb
            .from('analytics_events')
            .select('profile_id,event_name,created_at')
            .in('event_name', ['app_aberto', 'atividade_registrada'])
            .in('profile_id', ids)
            .gte('created_at', desdeIso)
            .range(de, ate),
        ),
      ),
    );
    for (const ev of lotes.flat()) {
      let u = uso.get(ev.profile_id);
      if (!u) uso.set(ev.profile_id, (u = { abriu: [], registrou: [] }));
      (ev.event_name === 'app_aberto' ? u.abriu : u.registrou).push(Date.parse(ev.created_at));
    }
  }
  const usouDepois = (pid: string, t: number, tipo: 'abriu' | 'registrou') =>
    (uso.get(pid)?.[tipo] ?? []).some((x) => x > t);

  const campanhas: CampanhaResumo[] = [...accs.entries()]
    .map(([id, a]) => {
      let voltaramAbrir = 0;
      let voltaramRegistrar = 0;
      const assinantes: PessoaAssinou[] = [];
      let inicio = Infinity;
      for (const [pid, t] of a.primeiro) {
        inicio = Math.min(inicio, t);
        if (usouDepois(pid, t, 'abriu')) voltaramAbrir++;
        if (usouDepois(pid, t, 'registrou')) voltaramRegistrar++;
        const c = assinou(pid, t);
        if (c)
          assinantes.push({
            profileId: pid,
            nome: nomes.get(pid) ?? null,
            produto: c.produto,
            em: new Date(c.em).toISOString(),
            diasDepois: Math.floor((c.em - t) / DIA),
          });
      }
      return {
        id,
        label: CAMPANHA_LABEL[id] ?? id,
        inicio: new Date(inicio).toISOString(),
        pessoas: a.primeiro.size,
        push: a.push,
        email: a.email,
        sininho: a.sininho,
        voltaramAbrir,
        voltaramRegistrar,
        assinaram: assinantes.length,
        assinantes,
      };
    })
    .sort((x, y) => y.inicio.localeCompare(x.inicio));

  // ── Régua de trial (automática) ───────────────────────────────────────
  // O sininho da régua não carrega o kind: casa com a linha do log pelo
  // perfil e pelo horário (a função grava os dois no mesmo segundo).
  const sininhoPorPerfil = new Map<string, NotifRow[]>();
  for (const n of sininhoTrial) {
    if (!n.data?.deeplink?.includes('subscription-plans')) continue;
    const l = sininhoPorPerfil.get(n.profile_id) ?? [];
    l.push(n);
    sininhoPorPerfil.set(n.profile_id, l);
  }
  const trialAcc = new Map<string, { pessoas: Map<string, number>; sEnv: number; sLidos: number; emails: number }>();
  for (const r of trialLog) {
    const base = r.kind.replace(/_(sininho|email)$/, '');
    if (!TRIAL_LABEL[base]) continue;
    let t = trialAcc.get(base);
    if (!t) trialAcc.set(base, (t = { pessoas: new Map(), sEnv: 0, sLidos: 0, emails: 0 }));
    const quando = Date.parse(r.created_at);
    const prev = t.pessoas.get(r.profile_id);
    if (prev === undefined || quando < prev) t.pessoas.set(r.profile_id, quando);
    if (r.kind.endsWith('_email')) t.emails++;
    if (r.kind.endsWith('_sininho')) {
      t.sEnv++;
      const n = (sininhoPorPerfil.get(r.profile_id) ?? []).find(
        (x) => Math.abs(Date.parse(x.created_at) - quando) < 10 * 60_000,
      );
      if (n?.read_at) t.sLidos++;
    }
  }
  const trial: TrialRegua[] = Object.keys(TRIAL_LABEL)
    .filter((k) => trialAcc.has(k))
    .map((k) => {
      const t = trialAcc.get(k)!;
      let assinaram7d = 0;
      for (const [pid, q] of t.pessoas) if (assinou(pid, q, q + 7 * DIA)) assinaram7d++;
      return {
        kind: k,
        label: TRIAL_LABEL[k],
        pessoas: t.pessoas.size,
        sininhoEnviados: t.sEnv,
        sininhoLidos: t.sLidos,
        emails: t.emails,
        assinaram7d,
      };
    });

  // ── Assinou quanto tempo depois de expirar ────────────────────────────
  const subPorPerfil = new Map(subs.map((s) => [s.profile_id, s]));
  const faixasDef: { label: string; ate: number }[] = [
    { label: 'Antes de expirar', ate: 0 },
    { label: 'No dia (até 24h)', ate: 1 },
    { label: '1 a 3 dias depois', ate: 3 },
    { label: '3 a 7 dias depois', ate: 7 },
    { label: '7+ dias depois', ate: Infinity },
  ];
  const faixas = faixasDef.map((f) => ({ label: f.label, n: 0 }));
  const depoisDe3Dias: (PessoaAssinou & { recebeu: string[] })[] = [];
  let totalAssinantes = 0;
  for (const c of compras.values()) {
    const fim = subPorPerfil.get(c.profileId)?.trial_ends_at;
    if (!fim) continue;
    totalAssinantes++;
    const dias = (c.em - Date.parse(fim)) / DIA;
    faixas[faixasDef.findIndex((f) => dias < f.ate)].n++;
    if (dias >= 3) {
      // O que essa pessoa recebeu nos 7 dias antes de assinar — é a pista de
      // qual ação trouxe ela de volta.
      const recebeu: string[] = [];
      for (const camp of campanhas) {
        const t = accs.get(camp.id)!.primeiro.get(c.profileId);
        if (t !== undefined && t <= c.em && t >= c.em - 7 * DIA) recebeu.push(camp.label);
      }
      depoisDe3Dias.push({
        profileId: c.profileId,
        nome: nomes.get(c.profileId) ?? null,
        produto: c.produto,
        em: new Date(c.em).toISOString(),
        diasDepois: Math.floor(dias),
        recebeu,
      });
    }
  }
  depoisDe3Dias.sort((a, b) => b.em.localeCompare(a.em));
  const agora = Date.now();
  const expiradosSemAssinar = subs.filter(
    (s) => s.status === 'trialing' && s.trial_ends_at && Date.parse(s.trial_ends_at) < agora && !compras.has(s.profile_id),
  ).length;

  // ── Ofertas ───────────────────────────────────────────────────────────
  const comprasOferta: CompraOferta[] = [...compras.values()]
    .filter((c) => c.oferta)
    .map((c) => ({
      profileId: c.profileId,
      nome: nomes.get(c.profileId) ?? null,
      produto: c.produto,
      preco: (c.preco ?? 0) / 1000,
      precoTabela: (PRECO_TABELA_MILI[c.produto] ?? 0) / 1000,
      oferta: c.oferta!,
      em: new Date(c.em).toISOString(),
    }))
    .sort((a, b) => b.em.localeCompare(a.em));
  const anuais = [...compras.values()].filter((c) => c.produto.endsWith('_anual')).length;

  // ── Banner de cuidador ────────────────────────────────────────────────
  const primeiroEvento = (nome: string) => {
    const m = new Map<string, number>();
    for (const e of eventosCuidador) {
      if (e.event_name !== nome) continue;
      const t = Date.parse(e.created_at);
      if (!m.has(e.profile_id) || t < m.get(e.profile_id)!) m.set(e.profile_id, t);
    }
    return m;
  };
  const visto = primeiroEvento('cuidador_banner_visto');
  const convidar = primeiroEvento('cuidador_banner_convidar');
  const agoraNao = primeiroEvento('cuidador_banner_agora_nao');
  const convitesValidos = convites.filter((c) => !c.deleted_at);
  let convidaramDepoisBanner = 0;
  let aceitosDepoisBanner = 0;
  let assinaramDepoisBanner = 0;
  for (const [pid, t] of visto) {
    const meus = convitesValidos.filter((c) => c.invited_by === pid && Date.parse(c.created_at) >= t);
    if (meus.length) convidaramDepoisBanner++;
    if (meus.some((c) => c.accepted_at)) aceitosDepoisBanner++;
    if (assinou(pid, t)) assinaramDepoisBanner++;
  }

  // Histórico: entre quem já terminou o teste (ou assinou), quem convidou
  // cuidador assina mais? Base = mesma da taxa de conversão do KPI.
  const convidou = new Set(convitesValidos.map((c) => c.invited_by));
  const aceitou = new Set(convitesValidos.filter((c) => c.accepted_at).map((c) => c.invited_by));
  const decidiram = subs.filter(
    (s) => compras.has(s.profile_id) || (s.trial_ends_at && Date.parse(s.trial_ends_at) < agora),
  );
  const historico = { convidaram: 0, convidaramAssinaram: 0, convidaramAceito: 0, naoConvidaram: 0, naoConvidaramAssinaram: 0 };
  for (const s of decidiram) {
    const pagou = compras.has(s.profile_id);
    if (convidou.has(s.profile_id)) {
      historico.convidaram++;
      if (pagou) historico.convidaramAssinaram++;
      if (aceitou.has(s.profile_id)) historico.convidaramAceito++;
    } else {
      historico.naoConvidaram++;
      if (pagou) historico.naoConvidaramAssinaram++;
    }
  }

  return {
    campanhas,
    trial,
    expiracao: { faixas, totalAssinantes, depoisDe3Dias, expiradosSemAssinar },
    ofertas: { total: comprasOferta.length, compras: comprasOferta, anuais },
    cuidador: {
      bannerVisto: visto.size,
      bannerConvidar: convidar.size,
      bannerAgoraNao: agoraNao.size,
      convidaramDepoisBanner,
      aceitosDepoisBanner,
      assinaramDepoisBanner,
      historico,
    },
    emailRastreado,
    geradoEm: new Date().toISOString(),
  };
}

/** Cache curto (60s) igual ao resto do painel: navegar não refaz as ~10
 *  consultas, e um envio novo aparece em até 1 minuto. */
export const montarAnalise = cache(
  unstable_cache(montarAnaliseRaw, ['analise-acoes-v1'], { revalidate: 60 }),
);
