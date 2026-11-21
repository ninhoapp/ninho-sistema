/**
 * Lembretes do dono (painel.lembretes, migration 00195 do Ninho-expo).
 * Server-only. Uma faixa vermelha no topo do painel a partir de
 * `mostrar_a_partir` (dia de Dubai) até o dono tocar em "Já fiz a verificação".
 */
import { painelDb } from '@/lib/supabase/server';

export interface Lembrete {
  id: string;
  titulo: string;
  detalhe: string | null;
  sessao: string | null;
  mostrar_a_partir: string;
}

/** Hoje no calendário de Dubai (UTC+4), no formato AAAA-MM-DD. */
function hojeEmDubai(): string {
  return new Date(Date.now() + 4 * 3_600_000).toISOString().slice(0, 10);
}

/** Lembretes que já chegaram na data e ainda não foram feitos. */
export async function lembretesVencidos(): Promise<Lembrete[]> {
  const { data, error } = await painelDb()
    .from('lembretes')
    .select('id,titulo,detalhe,sessao,mostrar_a_partir')
    .is('feito_em', null)
    .lte('mostrar_a_partir', hojeEmDubai())
    .order('mostrar_a_partir');
  if (error) throw error;
  return (data as Lembrete[] | null) ?? [];
}

/** O dono tocou em "Já fiz a verificação": a faixa some. */
export async function marcarLembreteFeito(id: string, quem: string | null): Promise<boolean> {
  const { error } = await painelDb()
    .from('lembretes')
    .update({ feito_em: new Date().toISOString(), feito_por: quem })
    .eq('id', id)
    .is('feito_em', null);
  return !error;
}
