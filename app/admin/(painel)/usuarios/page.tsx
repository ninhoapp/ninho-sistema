import { requireRole } from '@/lib/auth/guard';
import {
  fetchAppUsers,
  fetchUsoPorUsuario,
  appDbConfigured,
  accountStatus,
} from '@/lib/app-users';
import { previaExclusao, type PreviaExclusao } from '@/lib/painel/store';
import { PageHeader } from '@/components/admin/PageHeader';
import { Notice } from '@/components/admin/Notice';
import { UsuariosTable, type UsuarioRow } from '@/components/admin/UsuariosTable';

export const dynamic = 'force-dynamic';

export default async function UsuariosPage() {
  requireRole('admin');

  const [users, uso] = await Promise.all([fetchAppUsers(), fetchUsoPorUsuario()]);

  // Prévia de impacto calculada no servidor, para a confirmação de exclusão
  // mostrar número real em vez de aviso genérico.
  const previas: Record<string, PreviaExclusao> = {};
  const resultados = await Promise.all(
    users.map(async (u) => [u.id, await previaExclusao(u.id)] as const)
  );
  for (const [id, p] of resultados) previas[id] = p;

  const rows: UsuarioRow[] = users.map((u) => {
    const m = uso.get(u.id);
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      created_at: u.created_at,
      status: accountStatus(u),
      // Duas colunas no banco, uma pergunta só na tela: quem paga (ou
      // cancelou no meio do ciclo) conta pelo fim do período pago; o resto
      // conta pelo fim do trial.
      expiraEm:
        u.estado === 'pagante' || u.estado === 'churn'
          ? u.current_period_end ?? u.trial_ends_at
          : u.trial_ends_at,
      registros: m?.registros ?? 0,
      diasRegistro: m?.diasRegistro ?? 0,
      diasAbertura: m?.diasAbertura ?? 0,
      sistema: m?.sistema ?? null,
      appVersion: m?.appVersion ?? null,
    };
  });

  return (
    <div>
      <PageHeader
        title="Usuários ativos"
        subtitle="Todos os usuários do app, status da conta e atividade. Selecione para excluir — a exclusão pede sua senha e é definitiva."
      />

      {!appDbConfigured() && (
        <Notice tone="warn">
          Banco não configurado — defina <code>SUPABASE_URL</code> e{' '}
          <code>SUPABASE_SERVICE_ROLE_KEY</code>.
        </Notice>
      )}

      <UsuariosTable rows={rows} previas={previas} />
    </div>
  );
}
