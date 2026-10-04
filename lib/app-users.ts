/**
 * Ninho · Leitura dos usuários do app para o painel. Server-only.
 *
 * O estado de assinatura NÃO é recalculado aqui — vem pronto da view
 * `public.assinatura_estado` (migration 00022), que é a fonte única. Se a
 * regra de quem é pagante mudar, muda no SQL e o painel acompanha sozinho.
 */
import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { appDb } from '@/lib/supabase/server';

/** Tag do cache de usuários do app — quem altera usuário chama revalidateTag. */
export const APP_USERS_TAG = 'app-users';

export type Estado = 'trial_ativo' | 'trial_expirado' | 'pagante' | 'churn' | 'free';

export interface AppUser {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
  /** Fuso declarado no cadastro — é o que dá o país aproximado no painel. */
  timezone: string | null;
  /** O que ESTA CONTA contratou — nunca resolve herança. É o que conta pra
   *  faturamento/MRR (ver lib/metrics.ts isPagante): quem herda não paga
   *  nada, então não pode contar como assinante aqui. */
  estado: Estado;
  plan: 'free' | 'basico' | 'premium' | null;
  plan_interval: 'mensal' | 'anual' | null;
  trial_ends_at: string | null;
  current_period_end: string | null;
  /** O que a conta PODE USAR agora, já resolvendo o plano compartilhado
   *  (dono/cuidador do mesmo bebê que paga cobre os demais — ver
   *  supabase/migrations/00068 no app). Igual a `estado`/`plan`/... quando
   *  o acesso é próprio; muda só quando `herdadoDe` não é null. Pra exibir
   *  status/dias na tela de usuários — NUNCA pra faturamento. */
  estadoEfetivo: Estado;
  planoEfetivo: 'free' | 'basico' | 'premium';
  planIntervalEfetivo: 'mensal' | 'anual' | null;
  trialEndsAtEfetivo: string | null;
  currentPeriodEndEfetivo: string | null;
  /** Nome de quem paga, quando o acesso desta conta é herdado de outra que
   *  cuida do mesmo bebê. Null = acesso próprio (mesmo que seja free/trial). */
  herdadoDe: string | null;
  /** Nascimento (yyyy-mm-dd) do primeiro bebê que esta conta cadastrou.
   *  Null = ainda não cadastrou nenhum. Futuro = ainda não nasceu. */
  birthDate: string | null;
  /** Quando a conta assinou de fato — primeira compra verificada. Null = nunca
   *  pagou (ou pagou antes de `purchase_verifications` existir). NÃO confundir
   *  com `created_at`, que é a data do cadastro. */
  assinouEm: string | null;
}

import { appDbConfigured, type StatusConta } from '@/lib/status-conta';
export {
  appDbConfigured,
  STATUS_ASSINANTE,
  STATUS_TRIAL_EDITAVEL,
  type StatusConta,
} from '@/lib/status-conta';

interface ProfileRow {
  id: string;
  full_name: string | null;
  phone: string | null;
  created_at: string;
  timezone: string | null;
}

interface EstadoRow {
  profile_id: string;
  plan: 'free' | 'basico' | 'premium' | null;
  plan_interval: 'mensal' | 'anual' | null;
  trial_ends_at: string | null;
  current_period_end: string | null;
  estado: Estado;
}

/**
 * E-mail mora em `auth.users`, não em `public.profiles` — o conversor precisa
 * dele pra contatar. Só o service_role lê essa tabela.
 */
async function fetchEmails(): Promise<Map<string, string>> {
  const sb = appDb();
  const out = new Map<string, string>();
  const perPage = 1000;
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await sb.auth.admin.listUsers({ page, perPage });
    if (error || !data?.users?.length) break;
    for (const u of data.users) {
      if (u.email) out.set(u.id, u.email);
    }
    if (data.users.length < perPage) break;
  }
  return out;
}

interface EfetivoRow {
  id: string;
  email: string | null;
  estado_efetivo: Estado;
  plano_efetivo: 'free' | 'basico' | 'premium';
  plan_interval_efetivo: 'mensal' | 'anual' | null;
  trial_ends_at_efetivo: string | null;
  current_period_end_efetivo: string | null;
  coberto_por: string | null;
}

/**
 * Plano EFETIVO de cada conta — já resolvendo o plano compartilhado entre
 * quem cuida do mesmo bebê (dono e cuidadores; quem paga cobre os demais,
 * em qualquer direção — ver supabase/migrations/00068 no app).
 *
 * Vem pronto de `public.usuarios_admin` (view de operador, só service_role
 * lê) — a MESMA fonte que resolve isso no app (`assinatura_efetiva_de`).
 * Não recalcular aqui: se a regra de herança mudar, muda no SQL e o painel
 * acompanha sozinho, igual já vale pra `estado`/`plan` (ver topo do arquivo).
 */
async function fetchPlanoEfetivo(): Promise<Map<string, EfetivoRow> | null> {
  const sb = appDb();
  const out = new Map<string, EfetivoRow>();
  const { data, error } = await sb
    .from('usuarios_admin')
    .select(
      'id,email,estado_efetivo,plano_efetivo,plan_interval_efetivo,trial_ends_at_efetivo,current_period_end_efetivo,coberto_por',
    );
  if (error) {
    // Falhar calado faria toda conta herdada mostrar "Free trial" de novo —
    // exatamente o bug que isto corrige. Melhor logar e cair no próprio
    // estado (fallback abaixo em fetchAppUsersRaw) do que silenciar o erro.
    console.error('[painel] usuarios_admin (plano efetivo) falhou:', error.message);
    return null;
  }
  for (const r of (data as EfetivoRow[] | null) ?? []) out.set(r.id, r);
  return out;
}

interface BabyRow {
  created_by: string;
  birth_date: string;
}

/**
 * Nascimento do PRIMEIRO bebê que cada conta cadastrou (`created_by` em
 * `babies` — quem registrou, não quem cuida). Uma conta com gêmeos ou dois
 * filhos cadastrados em épocas diferentes mostra só o mais antigo, pelo
 * mesmo motivo do `primeiro_bebe_em` do RPC de uso: é o relógio da conta,
 * não um resumo de todos os bebês dela.
 */
async function fetchPrimeiroNascimento(): Promise<Map<string, string>> {
  const sb = appDb();
  const out = new Map<string, string>();
  const { data } = await sb
    .from('babies')
    .select('created_by,birth_date')
    .is('deleted_at', null)
    .order('created_at', { ascending: true });
  for (const b of (data as BabyRow[] | null) ?? []) {
    if (!out.has(b.created_by)) out.set(b.created_by, b.birth_date);
  }
  return out;
}

interface CompraRow {
  profile_id: string;
  created_at: string;
}

/**
 * Quando cada conta assinou de fato — a PRIMEIRA verificação de compra
 * aceita (`purchase_verifications.status = 'verificado'`).
 *
 * Não dá pra usar `subscriptions.created_at`: essa linha nasce no CADASTRO,
 * junto com o trial, então marcaria a data errada pra todo mundo (a Mariah,
 * por exemplo, cadastrou em 28/09 e só assinou em 04/10). Também não serve
 * `current_period_end` menos um ciclo — isso dá o início do período ATUAL,
 * que numa renovação já não é mais a data em que a pessoa virou cliente.
 */
async function fetchAssinouEm(): Promise<Map<string, string>> {
  const sb = appDb();
  const out = new Map<string, string>();
  const { data, error } = await sb
    .from('purchase_verifications')
    .select('profile_id,created_at')
    .eq('status', 'verificado')
    .order('created_at', { ascending: true });
  if (error) {
    console.error('[painel] purchase_verifications falhou:', error.message);
    return out;
  }
  // Ordenado crescente: o primeiro que cair no mapa é o mais antigo.
  for (const c of (data as CompraRow[] | null) ?? []) {
    if (!out.has(c.profile_id)) out.set(c.profile_id, c.created_at);
  }
  return out;
}

async function fetchAppUsersRaw(): Promise<AppUser[]> {
  if (!appDbConfigured()) return [];
  const sb = appDb();

  // profiles e a view não têm FK declarada entre si, então PostgREST não faz o
  // embed — busca separado e junta aqui.
  const [profilesRes, estadosRes, efetivosRes, nascimentos, assinouEm] = await Promise.all([
    sb
      .from('profiles')
      .select('id,full_name,phone,created_at,timezone')
      .is('deleted_at', null)
      .order('created_at', { ascending: false }),
    sb
      .from('assinatura_estado')
      .select('profile_id,plan,plan_interval,trial_ends_at,current_period_end,estado'),
    fetchPlanoEfetivo(),
    fetchPrimeiroNascimento(),
    fetchAssinouEm(),
  ]);

  // O e-mail vem de `usuarios_admin` (que lê auth.users). A API admin de auth
  // pagina e é a chamada mais lenta do painel — só cai nela se a view falhou.
  const efetivos = efetivosRes ?? new Map<string, EfetivoRow>();
  const emails = efetivosRes
    ? new Map(Array.from(efetivosRes.values(), (r) => [r.id, r.email ?? ''] as const))
    : await fetchEmails();

  const profiles = (profilesRes.data as ProfileRow[] | null) ?? [];
  const estados = (estadosRes.data as EstadoRow[] | null) ?? [];
  const estadoByProfile = new Map(estados.map((e) => [e.profile_id, e]));

  return profiles.map((p) => {
    const e = estadoByProfile.get(p.id);
    const ef = efetivos.get(p.id);
    const estadoProprio = corrigirChurnPorData(e);
    return {
      id: p.id,
      name: p.full_name,
      email: emails.get(p.id) || null,
      phone: p.phone,
      created_at: p.created_at,
      timezone: p.timezone,
      // Sem linha de assinatura o usuário é 'free'. Depois da 00022 isso não
      // deve acontecer (trigger + backfill), mas não vale inventar estado.
      estado: estadoProprio,
      plan: e?.plan ?? null,
      plan_interval: e?.plan_interval ?? null,
      trial_ends_at: e?.trial_ends_at ?? null,
      current_period_end: e?.current_period_end ?? null,
      // Sem linha em usuarios_admin (falha de rede/permissão — ver
      // fetchPlanoEfetivo) cai pro próprio estado: nunca esconde uma conta
      // que paga só porque a query de herança falhou.
      estadoEfetivo: ef?.estado_efetivo ?? estadoProprio,
      planoEfetivo: ef?.plano_efetivo ?? (e?.plan === 'basico' ? 'basico' : e?.plan === 'premium' ? 'premium' : 'free'),
      planIntervalEfetivo: ef?.plan_interval_efetivo ?? e?.plan_interval ?? null,
      trialEndsAtEfetivo: ef?.trial_ends_at_efetivo ?? e?.trial_ends_at ?? null,
      currentPeriodEndEfetivo: ef?.current_period_end_efetivo ?? e?.current_period_end ?? null,
      herdadoDe: ef?.coberto_por ?? null,
      birthDate: nascimentos.get(p.id) ?? null,
      assinouEm: assinouEm.get(p.id) ?? null,
    };
  });
}

/**
 * Usuários do app, com cache curto.
 *
 * Quase toda tela do painel chama isto, e são 4 consultas + junção em memória.
 * Sem cache, cada clique no menu refazia tudo do zero. Duas camadas:
 *  - `unstable_cache` (60s, entre requisições): navegar entre telas fica
 *    rápido. Ações que mudam usuário chamam revalidateTag(APP_USERS_TAG), então
 *    o que o próprio admin faz aparece na hora; cadastro novo no app aparece
 *    em até 1 minuto.
 *  - `cache` do React: dentro de uma mesma requisição não vai ao banco 2x.
 */
export const fetchAppUsers = cache(
  unstable_cache(fetchAppUsersRaw, ['app-users-v1'], { revalidate: 60, tags: [APP_USERS_TAG] })
);

/**
 * Corrige `pagante` quando o período pago já venceu.
 *
 * Hoje a view `assinatura_estado` (migration 00066 do app) já faz essa
 * mesma checagem no SQL — esta função ficou redundante, mas inofensiva, e
 * continua aqui como segunda trava: se algum dia a view voltar a confiar só
 * em `status` (webhook atrasado/nunca chegou), o painel não volta a contar
 * quem já parou de pagar como "Assinante"/inflar MRR sozinho.
 */
function corrigirChurnPorData(e: EstadoRow | undefined): Estado {
  const estado = e?.estado ?? 'free';
  if (estado === 'pagante' && e?.current_period_end) {
    if (new Date(e.current_period_end).getTime() < Date.now()) return 'churn';
  }
  return estado;
}

// ─── Status da conta (rótulo legível) — tipo e listas em lib/status-conta ──
/**
 * Lê os campos EFETIVOS (`estadoEfetivo`/`planoEfetivo`/...), não os
 * próprios — uma conta herdando Premium de quem cuida do mesmo bebê tem que
 * aparecer como "Premium", não como "Free trial" só porque o trial DELA
 * venceu. Quem quiser saber quem paga de verdade (faturamento/MRR) usa
 * `u.estado`/`u.plan` direto, nunca esta função — ver `isPagante` em
 * lib/metrics.ts.
 */
export function accountStatus(u: AppUser): StatusConta {
  if (u.estadoEfetivo === 'pagante') {
    const anual = u.planIntervalEfetivo === 'anual';
    if (u.planoEfetivo === 'basico') return anual ? 'Básico anual' : 'Básico mensal';
    return anual ? 'Premium anual' : 'Premium mensal';
  }
  if (u.estadoEfetivo === 'trial_ativo') return 'Free trial ativo';
  if (u.estadoEfetivo === 'trial_expirado') return 'Free trial expirado';
  if (u.estadoEfetivo === 'churn') return 'Churn';
  return 'Cadastrado';
}

/**
 * Move o fim do trial de UMA conta.
 *
 * `data` é yyyy-mm-dd e vira 23:59:59 em São Paulo (-03:00, fixo desde o fim
 * do horário de verão). O usuário é brasileiro, então "vale até o dia X"
 * precisa acabar no fim do dia DELE — gravar 23:59:59 UTC tiraria o acesso
 * às 20:59 no relógio dele, três horas antes do combinado.
 *
 * Escreve direto em `public.subscriptions`, não na view: a view é projeção,
 * e aqui só uma coluna muda. O trigger `subscriptions_bloquear_trial_cliente`
 * não atrapalha — ele só barra `authenticated`/`anon`, e o painel entra como
 * `service_role`.
 *
 * NÃO mexe em `status` de propósito. Quem estava `trialing` e venceu volta a
 * valer sozinho pela data nova (a view recalcula `estado`); reabrir trial de
 * quem já é pagante seria outra operação, com outro risco.
 */
export async function atualizarFimTrial(
  profileId: string,
  data: string
): Promise<{ ok: boolean; error?: string }> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return { ok: false, error: 'Data inválida.' };

  const sb = appDb();
  const { error, count } = await sb
    .from('subscriptions')
    .update({ trial_ends_at: `${data}T23:59:59-03:00` }, { count: 'exact' })
    .eq('profile_id', profileId)
    .is('deleted_at', null);

  if (error) return { ok: false, error: error.message };
  if (!count) return { ok: false, error: 'Nenhuma assinatura encontrada para esse usuário.' };
  return { ok: true };
}

// ─── Uso por usuário ───────────────────────────────────────────────────
/**
 * Métricas de uso — base do funil "baixou → cadastrou → usou de fato →
 * assina".
 *
 * Vem pronta do banco (RPC `get_uso_por_usuario`, migrations 00063 e 00065
 * do app) porque o PostgREST corta em 1.000 linhas e `activities` cresce
 * rápido: agregar no Postgres é a única forma de não perder linha em
 * silêncio. A regra de "registro real" (atividades) sai inteira da view
 * `registros_reais`, que é a fonte única — nada de recopiar filtro aqui.
 * Momentos têm contagem própria (00065), separada de propósito: são uma
 * ação de produto diferente de rotina, e misturadas numa coluna só não
 * dava pra saber qual das duas explicava um pico de "lançamentos".
 *
 * NOTA sobre `diasAbertura`: só há histórico a partir de 19/08/2026, quando
 * `analytics_events` começou a gravar `app_aberto`. O número começa do zero
 * pra todo mundo e vai enchendo; enquanto não amadurece, quem consome cai
 * em `diasRegistro`.
 */
export interface UsoUsuario {
  registros: number;
  diasRegistro: number;
  ultimoRegistroAt: string | null;
  /** Momentos (fotos/álbum) criados pela conta — contagem própria, não
   *  passa por `registros_reais` (essa é só de rotina/atividades). */
  momentos: number;
  ultimoMomentoAt: string | null;
  diasAbertura: number;
  ultimoAppAbertoAt: string | null;
  /** Bebês vinculados hoje. Zero = onboarding não concluído. */
  bebes: number;
  /** Primeiro vínculo com um bebê — o relógio das métricas de uso. */
  primeiroBebeEm: string | null;
  sistema: 'ios' | 'android' | 'web' | null;
  appVersion: string | null;
}

interface UsoRow {
  profile_id: string;
  registros: number;
  dias_registro: number;
  ultimo_registro_at: string | null;
  momentos: number;
  ultimo_momento_at: string | null;
  dias_abertura: number;
  ultimo_app_aberto_at: string | null;
  bebes: number;
  primeiro_bebe_em: string | null;
  sistema: 'ios' | 'android' | 'web' | null;
  app_version: string | null;
}

export async function fetchUsoPorUsuario(): Promise<Map<string, UsoUsuario>> {
  const map = new Map<string, UsoUsuario>();
  if (!appDbConfigured()) return map;

  const { data, error } = await appDb().rpc('get_uso_por_usuario');
  if (error) {
    // Falhar calado aqui viraria uma tabela inteira de zeros passando por
    // "ninguém usa o app" — o tipo de número que muda decisão de produto.
    console.error('[painel] get_uso_por_usuario falhou:', error.message);
    return map;
  }

  for (const r of (data as UsoRow[] | null) ?? []) {
    map.set(r.profile_id, {
      registros: Number(r.registros) || 0,
      diasRegistro: Number(r.dias_registro) || 0,
      ultimoRegistroAt: r.ultimo_registro_at,
      momentos: Number(r.momentos) || 0,
      ultimoMomentoAt: r.ultimo_momento_at,
      diasAbertura: Number(r.dias_abertura) || 0,
      ultimoAppAbertoAt: r.ultimo_app_aberto_at,
      bebes: Number(r.bebes) || 0,
      primeiroBebeEm: r.primeiro_bebe_em,
      sistema: r.sistema,
      appVersion: r.app_version,
    });
  }
  return map;
}
