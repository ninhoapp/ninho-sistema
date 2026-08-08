import { requireRole } from '@/lib/auth/guard';
import { fetchAppUsers, appDbConfigured } from '@/lib/app-users';
import { previaExclusao, type PreviaExclusao } from '@/lib/painel/store';
import { buildOverview } from '@/lib/metrics';
import { PageHeader } from '@/components/admin/PageHeader';
import { StatCard } from '@/components/admin/StatCard';
import { Notice } from '@/components/admin/Notice';
import { UsuariosTable } from '@/components/admin/UsuariosTable';

export const dynamic = 'force-dynamic';

export default async function UsuariosPage() {
  requireRole('admin');
  const users = await fetchAppUsers();
  const m = buildOverview(users);

  // Prévia de impacto calculada no servidor, para a confirmação de exclusão
  // mostrar número real em vez de aviso genérico.
  const previas: Record<string, PreviaExclusao> = {};
  const resultados = await Promise.all(
    users.map(async (u) => [u.id, await previaExclusao(u.id)] as const)
  );
  for (const [id, p] of resultados) previas[id] = p;

  return (
    <>
      <PageHeader
        title="Usuários ativos"
        subtitle="Todo mundo que criou perfil no app. Selecione para excluir — a exclusão pede sua senha e é definitiva."
      />

      {!appDbConfigured() && (
        <Notice tone="warn">
          Banco não configurado — defina <code>SUPABASE_URL</code> e{' '}
          <code>SUPABASE_SERVICE_ROLE_KEY</code>.
        </Notice>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total" value={m.totalUsuarios} accent />
        <StatCard label="Trial ativo" value={m.trialAtivo} />
        <StatCard label="Trial expirado" value={m.trialExpirado} />
        <StatCard label="Pagantes" value={m.pagantes} />
      </div>

      <UsuariosTable users={users} previas={previas} />
    </>
  );
}
