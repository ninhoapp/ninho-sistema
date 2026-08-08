import { requireRole } from '@/lib/auth/guard';
import { fetchAppUsers, appDbConfigured } from '@/lib/app-users';
import { formatDate, buildOverview } from '@/lib/metrics';
import { PageHeader } from '@/components/admin/PageHeader';
import { StatCard } from '@/components/admin/StatCard';
import { Notice } from '@/components/admin/Notice';
import { Tabela, Td } from '@/components/admin/Tabela';
import { EstadoBadge } from '@/components/admin/EstadoBadge';

export const dynamic = 'force-dynamic';

export default async function UsuariosPage() {
  requireRole('admin');
  const users = await fetchAppUsers();
  const m = buildOverview(users);

  return (
    <>
      <PageHeader
        title="Usuários ativos"
        subtitle="Todo mundo que criou perfil no app, com o estado de assinatura atual."
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

      <Tabela
        headers={['Nome', 'E-mail', 'Telefone', 'Estado', 'Plano', 'Trial acaba', 'Cadastro']}
        vazio="Nenhum usuário cadastrado ainda."
      >
        {users.map((u) => (
          <tr key={u.id}>
            <Td className="font-medium">{u.name || '—'}</Td>
            <Td className="text-ninho-cinza">{u.email || '—'}</Td>
            <Td className="whitespace-nowrap text-ninho-cinza">{u.phone || '—'}</Td>
            <Td>
              <EstadoBadge estado={u.estado} />
            </Td>
            <Td className="text-ninho-cinza">
              {u.plan_interval ? (u.plan_interval === 'anual' ? 'Anual' : 'Mensal') : '—'}
            </Td>
            <Td className="whitespace-nowrap text-ninho-cinza">{formatDate(u.trial_ends_at)}</Td>
            <Td className="whitespace-nowrap text-ninho-cinza">{formatDate(u.created_at)}</Td>
          </tr>
        ))}
      </Tabela>
    </>
  );
}
