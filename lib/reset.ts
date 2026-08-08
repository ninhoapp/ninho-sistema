/**
 * Resets por escopo (para testes). Server-only, só admin.
 * Cada função zera apenas o contexto pedido — não existe reset global.
 */
import { painelDb } from '@/lib/supabase/server';

/** Apaga todos os custos de um mês (yyyy-mm). */
export async function resetCostsMonth(mes: string): Promise<{ ok: boolean; error?: string }> {
  if (!/^\d{4}-\d{2}$/.test(mes)) return { ok: false, error: 'Mês inválido.' };
  try {
    const sb = painelDb();
    const [y, m] = mes.split('-').map(Number);
    const proximo = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, '0')}-01`;
    const { error } = await sb
      .from('custos')
      .delete()
      .gte('ref_month', `${mes}-01`)
      .lt('ref_month', proximo);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Falha ao zerar.' };
  }
}

/** Zera os contatos/desfechos registrados por UM conversor. */
export async function resetConversorStats(perfilId: string): Promise<{ ok: boolean; error?: string }> {
  if (!perfilId) return { ok: false, error: 'Conversor ausente.' };
  try {
    const sb = painelDb();
    const { error } = await sb.from('lead_outcomes').delete().eq('perfil_id', perfilId);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Falha ao zerar.' };
  }
}

/** Devolve todos os leads escondidos para a fila. */
export async function resetLeadsOcultos(): Promise<{ ok: boolean; error?: string }> {
  try {
    const sb = painelDb();
    const { error } = await sb.from('lead_hidden').delete().neq('profile_id', '00000000-0000-0000-0000-000000000000');
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Falha ao zerar.' };
  }
}
