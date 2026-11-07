/**
 * Ninho · Acesso às tabelas do painel (schema `painel`, service_role).
 * Server-only.
 *
 * Dois tipos de quem recebe comissão:
 *  - conversor: sobre os leads que ele marca como convertido em `lead_outcomes`;
 *  - influencer (parceiro, desde 05/11/2026, igual ao SOMI): sobre as contas
 *    atribuídas ao `promo_code` dele em `public.indicacao_parceiro`. Os cliques
 *    do link /r/<código> ficam em `link_clicks` e as instalações em
 *    `install_events` (migration 00096 do app).
 */
import { randomUUID } from 'crypto';
import { painelDb, appDb } from '@/lib/supabase/server';
import { lerTudo } from '@/lib/supabase/paginar';
import { hashPassword } from '@/lib/auth/password';
import type { Role } from '@/lib/auth/session';

export interface Perfil {
  id: string;
  username: string;
  email: string | null;
  password_hash: string;
  role: Role;
  display_name: string;
  active: boolean;
  commission_amount: number; // R$ por assinante (quando type='valor')
  commission_type: 'valor' | 'percentual';
  commission_percent: number; // % da assinatura (quando type='percentual')
  commission_duration_months: number | null; // null = vitalícia
  pix_key: string | null;
  /** Código do parceiro (só papel influencer). Link: /r/<código>. */
  promo_code: string | null;
  created_at: string;
  updated_at: string;
}

/** Perfil sem o hash da senha — é o que pode ir para um Client Component. */
export type PerfilView = Omit<Perfil, 'password_hash'>;

export function semSenha(p: Perfil): PerfilView {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password_hash, ...resto } = p;
  return resto;
}

export interface Cost {
  id: string;
  label: string;
  kind: 'fixo' | 'variavel';
  /** 'app' = funcionamento (servidor, IA, lojas...); 'marketing' = CTA/anúncios — separa o que vira CAC/CPI. */
  category: 'app' | 'marketing';
  amount: number;
  ref_month: string;
  series_id: string | null;
  created_at: string;
}

export interface LeadOutcome {
  id: string;
  profile_id: string; // referencia public.profiles(id) — FK de verdade, mesmo banco
  perfil_id: string | null; // quem contatou (conversor)
  channel: string;
  outcome: 'convertido' | 'sem_resposta' | 'nao_quer' | 'caro' | 'sem_interesse' | 'outro';
  reason: string | null;
  comment: string | null;
  contacted_at: string;
}

// ── Perfis de acesso ──────────────────────────────────────
/**
 * Lança em erro de banco em vez de devolver null.
 *
 * Engolir o erro aqui faz o login responder "usuário ou senha incorretos"
 * quando o problema real é permissão, schema não exposto ou env faltando —
 * e aí se perde muito tempo procurando no lugar errado.
 */
export async function findPerfilByLogin(login: string): Promise<Perfil | null> {
  const value = login.trim().toLowerCase();
  // Login legítimo é usuário ou e-mail. Nada além disso precisa passar — e
  // NÃO se interpola o texto num `.or()`: ele recebe filtro cru do PostgREST,
  // e um login como `x,role.eq.admin` injetaria um filtro (falha que o SOMI
  // já corrigiu). Duas consultas com `.eq()`, que é parametrizado.
  if (!value || value.length > 254 || !/^[a-z0-9._@+-]+$/.test(value)) return null;

  const sb = painelDb();
  for (const coluna of ['username', 'email'] as const) {
    const { data, error } = await sb
      .from('perfis')
      .select('*')
      .eq(coluna, value)
      .eq('active', true)
      .limit(1)
      .maybeSingle();
    if (error) {
      throw new Error(`painel.perfis: ${error.message}${error.hint ? ` (${error.hint})` : ''}`);
    }
    if (data) return data as Perfil;
  }
  return null;
}

export async function getPerfil(id: string): Promise<Perfil | null> {
  const sb = painelDb();
  const { data } = await sb.from('perfis').select('*').eq('id', id).maybeSingle();
  return (data as Perfil) ?? null;
}

export async function listPerfis(): Promise<Perfil[]> {
  const sb = painelDb();
  const { data } = await sb.from('perfis').select('*').order('role').order('display_name');
  return (data as Perfil[]) ?? [];
}

export async function createPerfil(input: {
  username: string;
  email?: string | null;
  password: string;
  role: Role;
  display_name: string;
  commission_type?: 'valor' | 'percentual';
  commission_amount?: number;
  commission_percent?: number;
  commission_duration_months?: number | null;
  promo_code?: string | null;
}): Promise<{ ok: boolean; error?: string }> {
  const sb = painelDb();
  const { error } = await sb.from('perfis').insert({
    promo_code: normalizarCodigo(input.promo_code),
    username: input.username.trim().toLowerCase(),
    email: input.email?.trim().toLowerCase() || null,
    password_hash: hashPassword(input.password),
    role: input.role,
    display_name: input.display_name.trim(),
    commission_type: input.commission_type ?? 'percentual',
    commission_amount: input.commission_amount ?? 0,
    commission_percent: input.commission_percent ?? 0,
    commission_duration_months: input.commission_duration_months ?? null,
  });
  if (error) {
    if (error.code === '23505') return { ok: false, error: 'Esse usuário, e-mail ou código já está em uso.' };
    if (error.code === '23514') return { ok: false, error: 'Código inválido: use de 2 a 40 letras, números, ponto, hífen ou _.' };
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export async function updatePerfil(
  id: string,
  patch: Partial<
    Pick<
      Perfil,
      | 'username'
      | 'display_name'
      | 'email'
      | 'commission_type'
      | 'commission_amount'
      | 'commission_percent'
      | 'commission_duration_months'
      | 'active'
      | 'pix_key'
      | 'promo_code'
    >
  >
): Promise<{ ok: boolean; error?: string }> {
  const sb = painelDb();
  const { error } = await sb
    .from('perfis')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) {
    if (error.code === '23505') return { ok: false, error: 'Esse usuário, e-mail ou código já está em uso.' };
    if (error.code === '23514') return { ok: false, error: 'Código inválido: use de 2 a 40 letras, números, ponto, hífen ou _.' };
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export async function deletePerfil(id: string): Promise<{ ok: boolean; error?: string }> {
  const sb = painelDb();
  const { error } = await sb.from('perfis').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function setPassword(
  id: string,
  newPassword: string
): Promise<{ ok: boolean; error?: string }> {
  const sb = painelDb();
  const { error } = await sb
    .from('perfis')
    .update({ password_hash: hashPassword(newPassword), updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// ── Custos ────────────────────────────────────────────────
export async function listCosts(): Promise<Cost[]> {
  const sb = painelDb();
  const { data } = await sb.from('custos').select('*').order('ref_month', { ascending: false });
  return (data as Cost[]) ?? [];
}

export async function addCost(input: {
  label: string;
  kind: 'fixo' | 'variavel';
  category: 'app' | 'marketing';
  amount: number;
  ref_month: string;
}) {
  const sb = painelDb();
  const { error } = await sb.from('custos').insert(input);
  return error ? { ok: false, error: error.message } : { ok: true };
}

/** Lança um custo fixo repetido em vários meses (de fromMonth até toMonth, inclusive). */
export async function addCostSeries(input: {
  label: string;
  category: 'app' | 'marketing';
  amount: number;
  fromMonth: string; // yyyy-mm
  toMonth: string; // yyyy-mm
}) {
  const sb = painelDb();
  const series_id = randomUUID();
  const rows: {
    label: string;
    kind: 'fixo';
    category: 'app' | 'marketing';
    amount: number;
    ref_month: string;
    series_id: string;
  }[] = [];
  const [fy, fm] = input.fromMonth.split('-').map(Number);
  const [ty, tm] = input.toMonth.split('-').map(Number);
  let y = fy,
    m = fm;
  let guard = 0;
  while ((y < ty || (y === ty && m <= tm)) && guard < 120) {
    rows.push({
      label: input.label,
      kind: 'fixo',
      category: input.category,
      amount: input.amount,
      ref_month: `${y}-${String(m).padStart(2, '0')}-01`,
      series_id,
    });
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
    guard++;
  }
  if (rows.length === 0) return { ok: false, error: 'Intervalo de meses inválido.' };
  const { error } = await sb.from('custos').insert(rows);
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function updateCost(
  id: string,
  patch: {
    label: string;
    kind: 'fixo' | 'variavel';
    category: 'app' | 'marketing';
    amount: number;
    ref_month: string;
  }
) {
  const sb = painelDb();
  const ref = patch.ref_month.length === 7 ? `${patch.ref_month}-01` : patch.ref_month;
  const { error } = await sb.from('custos').update({ ...patch, ref_month: ref }).eq('id', id);
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function deleteCost(id: string) {
  const sb = painelDb();
  const { error } = await sb.from('custos').delete().eq('id', id);
  return error ? { ok: false, error: error.message } : { ok: true };
}

/** Remove toda a série de um custo fixo recorrente. */
export async function deleteCostSeries(seriesId: string) {
  const sb = painelDb();
  const { error } = await sb.from('custos').delete().eq('series_id', seriesId);
  return error ? { ok: false, error: error.message } : { ok: true };
}

// ── Desfechos (conversor) ─────────────────────────────────
export async function listOutcomes(perfilId?: string): Promise<LeadOutcome[]> {
  const sb = painelDb();
  let q = sb.from('lead_outcomes').select('*').order('contacted_at', { ascending: false });
  if (perfilId) q = q.eq('perfil_id', perfilId);
  const { data } = await q;
  return (data as LeadOutcome[]) ?? [];
}

export async function addOutcome(input: {
  profile_id: string;
  perfil_id: string | null;
  outcome: LeadOutcome['outcome'];
  reason?: string | null;
  comment?: string | null;
  channel?: string;
}) {
  const sb = painelDb();
  const { error } = await sb.from('lead_outcomes').insert({
    profile_id: input.profile_id,
    perfil_id: input.perfil_id,
    outcome: input.outcome,
    reason: input.reason || null,
    comment: input.comment || null,
    channel: input.channel || 'whatsapp',
  });
  return error ? { ok: false, error: error.message } : { ok: true };
}

// ── Exclusão de usuário do app ────────────────────────────
export interface PreviaExclusao {
  bebes_exclusivos: number; // serão apagados — não sobrou outro cuidador
  bebes_transferidos: number; // passam para outro cuidador
  registros: number;
  fotos: number;
}

/** O que exatamente será apagado. Usado para mostrar antes de confirmar. */
export async function previaExclusao(profileId: string): Promise<PreviaExclusao> {
  const sb = painelDb();
  const { data, error } = await sb.rpc('previa_exclusao', { p_profile_id: profileId });
  if (error) throw new Error(`previa_exclusao: ${error.message}`);
  return (data as PreviaExclusao) ?? {
    bebes_exclusivos: 0,
    bebes_transferidos: 0,
    registros: 0,
    fotos: 0,
  };
}

/**
 * Apaga o usuário de verdade (auth.users → cascata). Bebês com outro cuidador
 * são transferidos em vez de apagados — ver painel.excluir_usuario no SQL.
 */
export async function excluirUsuarioApp(
  profileId: string
): Promise<{ ok: boolean; error?: string; bebes_apagados?: number; bebes_transferidos?: number }> {
  const sb = painelDb();
  const { data, error } = await sb.rpc('excluir_usuario', { p_profile_id: profileId });
  if (error) return { ok: false, error: error.message };
  const r = data as { bebes_apagados: number; bebes_transferidos: number };
  return { ok: true, ...r };
}

// ── Leads ocultados (removidos da fila do conversor) ──────
export async function listHiddenLeadIds(): Promise<Set<string>> {
  const sb = painelDb();
  const { data } = await sb.from('lead_hidden').select('profile_id');
  return new Set(((data as { profile_id: string }[]) ?? []).map((r) => r.profile_id));
}

export async function hideLead(profileId: string, perfilId: string | null, reason?: string | null) {
  const sb = painelDb();
  const { error } = await sb
    .from('lead_hidden')
    .upsert(
      { profile_id: profileId, hidden_by: perfilId, reason: reason || null },
      { onConflict: 'profile_id' }
    );
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function unhideLead(profileId: string) {
  const sb = painelDb();
  const { error } = await sb.from('lead_hidden').delete().eq('profile_id', profileId);
  return error ? { ok: false, error: error.message } : { ok: true };
}

// ── Parceiros: código, cliques e instalações ──────────────
/** Formato aceito de código de parceiro (igual à constraint do banco). */
export const PROMO_CODE_RE = /^[A-Z0-9._-]{2,40}$/;

/** Maiúsculas, sem espaço; vazio vira null. */
export function normalizarCodigo(v: string | null | undefined): string | null {
  const c = (v ?? '').trim().toUpperCase();
  return c ? c : null;
}

/**
 * Parceiro ativo pelo código da URL (/r/<codigo>). Valida o formato antes:
 * sem isso, `%` ou `_` num `.ilike()` casariam qualquer parceiro (falha que
 * o SOMI teve). O código é gravado sempre em maiúsculas, então `.eq()` basta.
 */
export async function findParceiroPorCodigo(code: string): Promise<Perfil | null> {
  const value = code.trim().toUpperCase();
  if (!PROMO_CODE_RE.test(value)) return null;
  const { data } = await painelDb()
    .from('perfis')
    .select('*')
    .eq('promo_code', value)
    .eq('role', 'influencer')
    .eq('active', true)
    .limit(1)
    .maybeSingle();
  return (data as Perfil) ?? null;
}

export interface ClickInput {
  perfil_id: string;
  promo_code: string;
  device: string;
  landed: string;
  visitor_hash: string | null;
  ip_hash: string | null;
  /** Só o domínio de onde veio (ex.: l.instagram.com), nunca a URL inteira. */
  referrer: string | null;
  user_agent: string | null;
}

/**
 * Grava o clique e devolve o id (= click_id que o app manda de volta).
 *
 * Marca se é o 1º clique desse visitante para esse parceiro: o visitor_hash é
 * apagado com 30 dias (painel.limpar_cliques_parceiros, migration 00098) e é
 * essa marca que mantém a contagem de cliques únicos depois disso.
 */
export async function logClick(input: ClickInput): Promise<string | null> {
  const sb = painelDb();
  let primeiro = true;
  if (input.visitor_hash) {
    // Busca normal de 1 linha: o `count` com `head: true` voltava vazio no
    // schema painel e marcava todo clique como único (visto em 05/11/2026).
    const { data: anterior, error: erroBusca } = await sb
      .from('link_clicks')
      .select('id')
      .eq('promo_code', input.promo_code)
      .eq('visitor_hash', input.visitor_hash)
      .limit(1);
    if (erroBusca) console.error('[painel] link_clicks (visitante) falhou:', erroBusca.message);
    primeiro = !anterior || anterior.length === 0;
  }
  const { data, error } = await sb
    .from('link_clicks')
    .insert({ ...input, primeiro_do_visitante: primeiro })
    .select('id')
    .single();
  if (error) console.error('[painel] link_clicks falhou:', error.message);
  return (data as { id: string } | null)?.id ?? null;
}

/**
 * Clique no link /c/<código> de uma consultora (perfil_id nulo, consultora_id
 * preenchido; migration 00112). Sem a 00112 a coluna não existe: não grava e
 * devolve null (o link continua levando à loja).
 */
export async function logClickConsultora(input: Omit<ClickInput, 'perfil_id'> & { consultora_id: string }): Promise<string | null> {
  const sb = painelDb();
  let primeiro = true;
  if (input.visitor_hash) {
    const { data: anterior } = await sb
      .from('link_clicks')
      .select('id')
      .eq('consultora_id', input.consultora_id)
      .eq('visitor_hash', input.visitor_hash)
      .limit(1);
    primeiro = !anterior || anterior.length === 0;
  }
  const { data, error } = await sb
    .from('link_clicks')
    .insert({ ...input, perfil_id: null, primeiro_do_visitante: primeiro })
    .select('id')
    .single();
  if (error) console.error('[painel] link_clicks (consultora) falhou:', error.message);
  return (data as { id: string } | null)?.id ?? null;
}

export interface ClickStats {
  total: number;
  unique: number;
  ios: number;
  android: number;
  desktop: number;
}

function statsVazio(): ClickStats {
  return { total: 0, unique: 0, ios: 0, android: 0, desktop: 0 };
}

/**
 * Cliques, cliques únicos e por aparelho, de TODOS os parceiros numa leitura
 * só (paginada: passa de 1.000 linhas rápido). Único = `primeiro_do_visitante`,
 * marcado na hora do clique, porque o visitor_hash some com 30 dias.
 */
export async function clickStatsPorCodigo(): Promise<Map<string, ClickStats>> {
  const { data } = await lerTudo<{ promo_code: string; primeiro_do_visitante: boolean; device: string | null }>(
    'link_clicks',
    (de, ate) =>
      // Só cliques de parceiro: os do link /c/ da consultora têm perfil_id nulo.
      painelDb().from('link_clicks').select('promo_code,primeiro_do_visitante,device').not('perfil_id', 'is', null).order('id').range(de, ate),
  );
  const out = new Map<string, ClickStats>();
  for (const r of data) {
    const c = r.promo_code.toUpperCase();
    const st = out.get(c) ?? statsVazio();
    st.total++;
    if (r.primeiro_do_visitante) st.unique++;
    if (r.device === 'ios') st.ios++;
    else if (r.device === 'android') st.android++;
    else if (r.device === 'desktop') st.desktop++;
    out.set(c, st);
  }
  return out;
}

export function statsDe(mapa: Map<string, ClickStats>, code: string | null): ClickStats {
  return (code && mapa.get(code.toUpperCase())) || statsVazio();
}

/** Instalações atribuídas (métrica "Downloads") por código. */
export async function installsPorCodigo(): Promise<Map<string, number>> {
  const { data } = await lerTudo<{ promo_code: string }>('install_events', (de, ate) =>
    painelDb().from('install_events').select('promo_code').order('id').range(de, ate),
  );
  const out = new Map<string, number>();
  for (const r of data) {
    const c = r.promo_code.toUpperCase();
    out.set(c, (out.get(c) ?? 0) + 1);
  }
  return out;
}

/**
 * Atribuição manual pelo painel (service_role): grava, troca ou remove o
 * parceiro de uma conta. É o único caminho que pode sobrescrever.
 */
export async function atribuirParceiro(
  profileId: string,
  promoCode: string | null,
): Promise<{ ok: boolean; error?: string }> {
  const sb = appDb();
  const code = normalizarCodigo(promoCode);
  if (!code) {
    const { error } = await sb.from('indicacao_parceiro').delete().eq('profile_id', profileId);
    return error ? { ok: false, error: error.message } : { ok: true };
  }
  if (!PROMO_CODE_RE.test(code)) return { ok: false, error: 'Código inválido.' };
  const { error } = await sb
    .from('indicacao_parceiro')
    .upsert({ profile_id: profileId, promo_code: code, click_id: null, metodo: 'manual' }, { onConflict: 'profile_id' });
  if (error) return { ok: false, error: error.message };
  // Veio de parceiro = Grupo A (migration 00098): quem estava no B sem cartão
  // ganha os 7 dias grátis. Falhar aqui não desfaz a atribuição.
  const grupo = await sb.rpc('parceiro_ir_para_grupo_a', { p_profile: profileId });
  if (grupo.error) console.error('[painel] parceiro_ir_para_grupo_a falhou:', grupo.error.message);
  return { ok: true };
}
