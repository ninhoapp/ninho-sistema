import { requireRole } from '@/lib/auth/guard';
import { fetchAppUsers, appDbConfigured } from '@/lib/app-users';
import { listCosts } from '@/lib/painel/store';
import {
  buildOverview,
  buildOverviewAt,
  custosDoMes,
  formatBRL,
  pctChange,
} from '@/lib/metrics';
import { liquido, DIAS_TRIAL } from '@/lib/precos';
import { PageHeader } from '@/components/admin/PageHeader';
import { StatCard } from '@/components/admin/StatCard';
import { Mini } from '@/components/admin/Mini';
import { Notice } from '@/components/admin/Notice';
import { DonutChart } from '@/components/admin/DonutChart';
import { VerticalBarChart } from '@/components/admin/VerticalBarChart';
import {
  IconUsers,
  IconCrown,
  IconClock,
  IconHourglass,
  IconCard,
  IconMinusCircle,
} from '@/components/admin/icons';

export const dynamic = 'force-dynamic';

const PERIODO_MS = 7 * 86400000;

export default async function VisaoGeralPage() {
  requireRole('admin');

  const agora = Date.now();
  const cutoff = agora - PERIODO_MS;

  const [users, custos] = await Promise.all([fetchAppUsers(), listCosts()]);

  const m = buildOverview(users);
  const mAntes = buildOverviewAt(users, cutoff);

  const mes = new Date().toISOString().slice(0, 7);
  const c = custosDoMes(custos, mes);
  const receitaLiquida = liquido(m.receitaMensalEstimada);

  // Cadastros por dia nos últimos 7 dias — mostra ritmo de crescimento.
  const porDia: { label: string; value: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(agora - i * 86400000);
    const dia = d.toISOString().slice(0, 10);
    porDia.push({
      label: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      value: users.filter((u) => u.created_at.slice(0, 10) === dia).length,
    });
  }

  return (
    <>
      <PageHeader
        title="Visão geral"
        subtitle="Panorama de usuários e assinaturas do Ninho. Tudo sai da view public.assinatura_estado — nada é estimado."
      />

      {!appDbConfigured() && (
        <Notice tone="warn">
          Banco não configurado. Defina <code>SUPABASE_URL</code> e{' '}
          <code>SUPABASE_SERVICE_ROLE_KEY</code> na Vercel para o painel ler os dados do app.
        </Notice>
      )}

      {appDbConfigured() && m.totalUsuarios === 0 && (
        <Notice>
          Nenhum usuário cadastrado ainda. Assim que o primeiro cadastro acontecer, ele entra aqui
          já em trial de {DIAS_TRIAL} dias.
        </Notice>
      )}

      <section className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <StatCard
          label="Usuários"
          value={m.totalUsuarios}
          icon={<IconUsers />}
          trend={{ pct: pctChange(m.totalUsuarios, mAntes.totalUsuarios) }}
        />
        <StatCard
          label="Assinantes"
          value={m.pagantes}
          accent
          icon={<IconCrown />}
          trend={{ pct: pctChange(m.pagantes, mAntes.pagantes) }}
        />
        <StatCard
          label="Trial ativo"
          value={m.trialAtivo}
          icon={<IconClock />}
          trend={{ pct: pctChange(m.trialAtivo, mAntes.trialAtivo) }}
        />
        <StatCard
          label="Trial expirado"
          value={m.trialExpirado}
          icon={<IconHourglass />}
          trend={{ pct: pctChange(m.trialExpirado, mAntes.trialExpirado) }}
        />
        <StatCard label="Churn" value={m.churn} icon={<IconMinusCircle />} danger={m.churn > 0} />
        <StatCard
          label="Receita mensal"
          value={formatBRL(receitaLiquida)}
          icon={<IconCard />}
          trend={{ pct: pctChange(m.receitaMensalEstimada, mAntes.receitaMensalEstimada) }}
        />
      </section>

      <p className="mb-8 mt-2 text-xs text-ninho-cinza">
        A variação compara com 7 dias atrás. Trial ativo e expirado são exatos (as datas são fixas);
        assinantes é aproximação, porque só existe o retrato de hoje — cancelamento no meio do
        caminho não aparece.
      </p>

      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-ninho-borda bg-white p-5">
          <h2 className="mb-4 text-base font-bold text-ninho-grafite">Distribuição da base</h2>
          <DonutChart
            slices={[
              { label: 'Pagantes', value: m.pagantes, color: '#59B287' },
              { label: 'Trial ativo', value: m.trialAtivo, color: '#9F86E0' },
              { label: 'Trial expirado', value: m.trialExpirado, color: '#F5C24E' },
              { label: 'Churn', value: m.churn, color: '#E85D5D' },
              { label: 'Free', value: m.free, color: '#C9BEE0' },
            ]}
          />
        </div>

        <div className="rounded-2xl border border-ninho-borda bg-white p-5">
          <h2 className="mb-4 text-base font-bold text-ninho-grafite">Resumo do mês</h2>
          <div className="grid grid-cols-2 gap-3">
            <Mini label="Receita líquida" value={formatBRL(receitaLiquida)} hint="Após 15% da loja" />
            <Mini label="Custos" value={formatBRL(c.total)} hint={mes} />
            <Mini label="Fixos" value={formatBRL(c.fixos)} />
            <Mini label="Variáveis" value={formatBRL(c.variaveis)} />
          </div>
          <p className="mt-4 text-sm text-ninho-cinza">
            Resultado do mês:{' '}
            <strong
              className={receitaLiquida - c.total >= 0 ? 'text-state-success' : 'text-red-600'}
            >
              {formatBRL(receitaLiquida - c.total)}
            </strong>{' '}
            <span className="text-xs">(sem repasses — o número completo está em Faturamento)</span>
          </p>
        </div>
      </div>

      <h2 className="mb-3 text-base font-bold text-ninho-grafite">Cadastros nos últimos 7 dias</h2>
      <VerticalBarChart data={porDia} />
    </>
  );
}
