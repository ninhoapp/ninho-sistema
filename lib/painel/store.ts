/**
 * Ninho · Acesso às tabelas do painel (schema `painel`, service_role).
 * Server-only.
 *
 * Diferenças em relação ao SOMI, por o Ninho não ter influencer:
 *  - sem `promo_code`, `play_url`, `apple_url` (código de divulgação);
 *  - sem `link_clicks` / `install_events` (atribuição de instalação).
 * A comissão do conversor sai dos leads que ele marca como convertido em
 * `lead_outcomes` — o mesmo caminho que o SOMI já usa pro papel conversor.
 */
import { randomUUID } from 'crypto';
import { painelDb } from '@/lib/supabase/server';
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
  created_at: string;
  updated_at: string;
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
export async function findPerfilByLogin(login: string): Promise<Perfil | null> {
  const sb = painelDb();
  const value = login.trim().toLowerCase();
  const { data } = await sb
    .from('perfis')
    .select('*')
    .or(`username.eq.${value},email.eq.${value}`)
    .eq('active', true)
    .limit(1)
    .maybeSingle();
  return (data as Perfil) ?? null;
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
}): Promise<{ ok: boolean; error?: string }> {
  const sb = painelDb();
  const { error } = await sb.from('perfis').insert({
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
    if (error.code === '23505') return { ok: false, error: 'Esse usuário já está em uso.' };
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
    >
  >
): Promise<{ ok: boolean; error?: string }> {
  const sb = painelDb();
  const { error } = await sb
    .from('perfis')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) {
    if (error.code === '23505') return { ok: false, error: 'Esse usuário já está em uso.' };
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
