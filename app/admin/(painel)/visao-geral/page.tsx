import { requireRole } from '@/lib/auth/guard';
import { fetchAppUsers, appDbConfigured } from '@/lib/app-users';
import { buildOverview, formatBRL } from '@/lib/metrics';
import { PageHeader } from '@/components/admin/PageHeader';
import { StatCard } from '@/components/admin/StatCard';
import { Notice } from '@/components/admin/Notice';
import { DIAS_TRIAL } from '@/lib/precos';

export const dynamic = 'force-dynamic';

export default async function VisaoGeralPage() {
  requireRole('admin');

  const configurado = appDbConfigured();
  const users = await fetchAppUsers();
  const m = buildOverview(users);

  return (
    <>
      <PageHeader
        title="Visão geral"
        subtitle="Números do app em tempo real. Tudo aqui sai da view public.assinatura_estado — nada é estimado."
      />

      {!configurado && (
        <Notice tone="warn">
          Banco não configurado. Defina <code>SUPABASE_URL</code> e{' '}
          <code>SUPABASE_SERVICE_ROLE_KEY</code> para o painel ler os dados do app. Até lá as telas
          ficam vazias — de propósito, para não mostrar número que não existe.
        </Notice>
      )}

      {configurado && m.totalUsuarios === 0 && (
        <Notice>
          Nenhum usuário cadastrado ainda. Assim que o primeiro cadastro acontecer, ele entra aqui
          já em trial de {DIAS_TRIAL} dias.
        </Notice>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Usuários"
          value={m.totalUsuarios}
          hint="Perfis ativos no app"
          accent
        />
        <StatCard
          label="Em trial"
          value={m.trialAtivo}
          hint={`Trial de ${DIAS_TRIAL} dias ainda válido`}
        />
        <StatCard
          label="Trial expirado"
          value={m.trialExpirado}
          hint="Fila de contato do conversor"
        />
        <StatCard label="Pagantes" value={m.pagantes} hint="Premium ativo" />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Churn" value={m.churn} hint="Premium cancelado ou vencido" danger />
        <StatCard label="Free" value={m.free} hint="Sem trial nem assinatura" />
        <StatCard
          label="Receita mensal"
          value={formatBRL(m.receitaMensalEstimada)}
          hint="Anual entra rateado por 12"
        />
      </div>

      {configurado && m.pagantes === 0 && m.totalUsuarios > 0 && (
        <Notice tone="warn">
          Receita zerada porque a cobrança ainda não foi implementada no app. Quando ela entrar,
          deve gravar em <code>public.subscriptions</code> (a mesma tabela do trial) — assim estes
          números passam a existir sem nenhuma mudança aqui.
        </Notice>
      )}
    </>
  );
}
