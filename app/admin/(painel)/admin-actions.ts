'use server';

import { revalidatePath } from 'next/cache';
import { requireRole, requireSession } from '@/lib/auth/guard';
import { verifyPassword } from '@/lib/auth/password';
import {
  createPerfil,
  updatePerfil,
  deletePerfil,
  setPassword,
  getPerfil,
  excluirUsuarioApp,
  addCost,
  addCostSeries,
  updateCost,
  deleteCost,
  deleteCostSeries,
  addOutcome,
  hideLead,
  unhideLead,
  type LeadOutcome,
} from '@/lib/painel/store';
import { resetCostsMonth, resetConversorStats, resetLeadsOcultos } from '@/lib/reset';
import type { Role } from '@/lib/auth/session';

export interface ActionState {
  error?: string;
  ok?: boolean;
}

function num(v: FormDataEntryValue | null): number {
  const n = Number(String(v ?? '').replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

// ── Perfis ────────────────────────────────────────────────
export async function criarPerfil(_prev: ActionState, fd: FormData): Promise<ActionState> {
  requireRole('admin');

  const username = String(fd.get('username') || '').trim();
  const display_name = String(fd.get('display_name') || '').trim();
  const password = String(fd.get('password') || '');
  const role = String(fd.get('role') || 'conversor') as Role;

  if (!username || !display_name) return { error: 'Usuário e nome são obrigatórios.' };
  if (password.length < 8) return { error: 'A senha precisa ter ao menos 8 caracteres.' };
  if (role !== 'admin' && role !== 'conversor') return { error: 'Papel inválido.' };

  const res = await createPerfil({
    username,
    display_name,
    password,
    role,
    email: String(fd.get('email') || '').trim() || null,
    commission_type: (String(fd.get('commission_type') || 'percentual') as 'valor' | 'percentual'),
    commission_amount: num(fd.get('commission_amount')),
    commission_percent: num(fd.get('commission_percent')),
    commission_duration_months: fd.get('commission_duration_months')
      ? num(fd.get('commission_duration_months'))
      : null,
  });
  if (!res.ok) return { error: res.error || 'Falha ao criar.' };

  revalidatePath('/admin/perfis');
  revalidatePath('/admin/conversores');
  return { ok: true };
}

export async function salvarPerfil(_prev: ActionState, fd: FormData): Promise<ActionState> {
  requireRole('admin');
  const id = String(fd.get('id') || '');
  if (!id) return { error: 'Perfil não informado.' };

  const res = await updatePerfil(id, {
    display_name: String(fd.get('display_name') || '').trim(),
    email: String(fd.get('email') || '').trim() || null,
    commission_type: String(fd.get('commission_type') || 'percentual') as 'valor' | 'percentual',
    commission_amount: num(fd.get('commission_amount')),
    commission_percent: num(fd.get('commission_percent')),
    commission_duration_months: fd.get('commission_duration_months')
      ? num(fd.get('commission_duration_months'))
      : null,
    active: fd.get('active') === 'on',
  });
  if (!res.ok) return { error: res.error || 'Falha ao salvar.' };

  revalidatePath('/admin/perfis');
  revalidatePath('/admin/conversores');
  return { ok: true };
}

export async function resetarSenha(_prev: ActionState, fd: FormData): Promise<ActionState> {
  requireRole('admin');
  const id = String(fd.get('id') || '');
  const nova = String(fd.get('nova') || '');
  if (nova.length < 8) return { error: 'A senha precisa ter ao menos 8 caracteres.' };
  const res = await setPassword(id, nova);
  if (!res.ok) return { error: res.error || 'Falha ao redefinir.' };
  return { ok: true };
}

export async function removerPerfil(fd: FormData) {
  const session = requireRole('admin');
  const id = String(fd.get('id') || '');
  // Guarda contra o admin se auto-excluir e ninguém mais conseguir entrar.
  if (id === session.sub) return;
  await deletePerfil(id);
  revalidatePath('/admin/perfis');
}

// ── Custos ────────────────────────────────────────────────
export async function criarCusto(_prev: ActionState, fd: FormData): Promise<ActionState> {
  requireRole('admin');

  const label = String(fd.get('label') || '').trim();
  const amount = num(fd.get('amount'));
  const kind = String(fd.get('kind') || 'fixo') as 'fixo' | 'variavel';
  const category = String(fd.get('category') || 'app') as 'app' | 'marketing';
  const ref = String(fd.get('ref_month') || '');
  const ate = String(fd.get('ate_month') || '');

  if (!label) return { error: 'Descrição é obrigatória.' };
  if (amount <= 0) return { error: 'Valor precisa ser maior que zero.' };
  if (!ref) return { error: 'Mês de referência é obrigatório.' };

  // Custo fixo com "até" vira uma parcela por mês do intervalo.
  const res =
    kind === 'fixo' && ate && ate !== ref
      ? await addCostSeries({ label, category, amount, fromMonth: ref, toMonth: ate })
      : await addCost({ label, kind, category, amount, ref_month: `${ref}-01` });

  if (!res.ok) return { error: res.error || 'Falha ao lançar.' };
  revalidatePath('/admin/despesas');
  revalidatePath('/admin/faturamento');
  return { ok: true };
}

export async function salvarCusto(_prev: ActionState, fd: FormData): Promise<ActionState> {
  requireRole('admin');
  const id = String(fd.get('id') || '');
  const res = await updateCost(id, {
    label: String(fd.get('label') || '').trim(),
    kind: String(fd.get('kind') || 'fixo') as 'fixo' | 'variavel',
    category: String(fd.get('category') || 'app') as 'app' | 'marketing',
    amount: num(fd.get('amount')),
    ref_month: String(fd.get('ref_month') || ''),
  });
  if (!res.ok) return { error: res.error || 'Falha ao salvar.' };
  revalidatePath('/admin/despesas');
  return { ok: true };
}

export async function removerCusto(fd: FormData) {
  requireRole('admin');
  const id = String(fd.get('id') || '');
  const serie = String(fd.get('series_id') || '');
  // "Remover série" apaga todas as parcelas do custo fixo de uma vez.
  if (fd.get('todaSerie') === '1' && serie) await deleteCostSeries(serie);
  else await deleteCost(id);
  revalidatePath('/admin/despesas');
}

// ── Exclusão de usuários do app ───────────────────────────
export interface ExclusaoState extends ActionState {
  /** Resumo do que aconteceu, para a tela confirmar o efeito real. */
  resumo?: { usuarios: number; bebesApagados: number; bebesTransferidos: number };
}

/**
 * Apaga usuários do app em definitivo. Exige a senha do admin logado.
 *
 * A senha não é teatro: essa ação é irreversível e cascateia para bebês,
 * rotina, vacinas, crescimento e fotos. Sem uma segunda credencial, um painel
 * esquecido aberto vira perda de dado de saúde de criança.
 */
export async function excluirUsuarios(
  _prev: ExclusaoState,
  fd: FormData
): Promise<ExclusaoState> {
  const session = requireRole('admin');

  const ids = String(fd.get('ids') || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const senha = String(fd.get('senha') || '');

  if (ids.length === 0) return { error: 'Nenhum usuário selecionado.' };
  if (!senha) return { error: 'Informe sua senha para confirmar.' };

  const perfil = await getPerfil(session.sub);
  if (!perfil) return { error: 'Sessão inválida. Entre novamente.' };
  if (!verifyPassword(senha, perfil.password_hash)) {
    return { error: 'Senha incorreta. Nada foi excluído.' };
  }

  let bebesApagados = 0;
  let bebesTransferidos = 0;
  const falhas: string[] = [];

  for (const id of ids) {
    const r = await excluirUsuarioApp(id);
    if (!r.ok) {
      falhas.push(r.error || id);
      continue;
    }
    bebesApagados += r.bebes_apagados ?? 0;
    bebesTransferidos += r.bebes_transferidos ?? 0;
  }

  revalidatePath('/admin/usuarios');
  revalidatePath('/admin/visao-geral');
  revalidatePath('/admin/leads');

  if (falhas.length > 0) {
    return {
      error: `${ids.length - falhas.length} de ${ids.length} excluídos. Falhou: ${falhas.join('; ')}`,
    };
  }

  return {
    ok: true,
    resumo: { usuarios: ids.length, bebesApagados, bebesTransferidos },
  };
}

// ── Resets por escopo (testes) ────────────────────────────
export async function zerarCustosDoMes(fd: FormData) {
  requireRole('admin');
  await resetCostsMonth(String(fd.get('mes') || ''));
  revalidatePath('/admin/despesas');
  revalidatePath('/admin/faturamento');
}

export async function zerarConversor(fd: FormData) {
  requireRole('admin');
  await resetConversorStats(String(fd.get('perfil_id') || ''));
  revalidatePath('/admin/conversores');
  revalidatePath('/admin/conversoes');
  revalidatePath('/admin/repasses');
}

// Recebe FormData (ignorado) para casar com a assinatura do ConfirmButton.
export async function zerarLeadsOcultos(_fd: FormData) {
  requireRole('admin');
  await resetLeadsOcultos();
  revalidatePath('/admin/leads');
  revalidatePath('/admin/conversor');
}

// ── Fila do conversor ─────────────────────────────────────
export async function registrarDesfecho(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const session = requireSession();
  const profile_id = String(fd.get('profile_id') || '');
  const outcome = String(fd.get('outcome') || '') as LeadOutcome['outcome'];
  if (!profile_id || !outcome) return { error: 'Dados incompletos.' };

  const res = await addOutcome({
    profile_id,
    perfil_id: session.sub,
    outcome,
    reason: String(fd.get('reason') || '') || null,
    comment: String(fd.get('comment') || '') || null,
  });
  if (!res.ok) return { error: res.error || 'Falha ao registrar.' };

  revalidatePath('/admin/conversor');
  revalidatePath('/admin/conversoes');
  revalidatePath('/admin/repasses');
  return { ok: true };
}

export async function ocultarLead(fd: FormData) {
  const session = requireSession();
  await hideLead(String(fd.get('profile_id') || ''), session.sub, String(fd.get('reason') || '') || null);
  revalidatePath('/admin/conversor');
  revalidatePath('/admin/leads');
}

export async function reexibirLead(fd: FormData) {
  requireSession();
  await unhideLead(String(fd.get('profile_id') || ''));
  revalidatePath('/admin/conversor');
  revalidatePath('/admin/leads');
}
