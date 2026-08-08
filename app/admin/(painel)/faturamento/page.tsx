import { requireRole } from '@/lib/auth/guard';
import { listCosts, listPerfis, listOutcomes } from '@/lib/painel/store';
import { fetchAppUsers } from '@/lib/app-users';
import { buildOverview, buildPnL, buildRepasses, formatBRL, isPagante } from '@/lib/metrics';
import { TAXA_LOJA, liquido } from '@/lib/precos';
import { PageHeader } from '@/components/admin/PageHeader';
import { StatCard } from '@/components/admin/StatCard';
import { Notice } from '@/components/admin/Notice';
import { BarChart } from '@/components/admin/BarChart';

export const dynamic = 'force-dynamic';

export default async function FaturamentoPage() {
  requireRole('admin');
  const [users, custos, perfis, outcomes] = await Promise.all([
    fetchAppUsers(),
    listCosts(),
    listPerfis(),
    listOutcomes(),
  ]);

  const d = new Date();
  const mes = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

  const m = buildOverview(users);
  const repasses = buildRepasses(perfis, users, outcomes);
  const receitaBruta = m.receitaMensalEstimada;
  const receitaLiquida = liquido(receitaBruta);
  const pnl = buildPnL(receitaLiquida, custos, repasses, mes);

  const pagantes = users.filter(isPagante);
  const mensais = pagantes.filter((u) => u.plan_interval !== 'anual').length;
  const anuais = pagantes.filter((u) => u.plan_interval === 'anual').length;

  return (
    <>
      <PageHeader
        title="Faturamento e lucro"
        subtitle={`Mês de referência ${mes}. A receita já entra líquida — descontados os ${Math.round(
          TAXA_LOJA * 100
        )}% que Apple e Google retêm.`}
      />

      {m.pagantes === 0 && (
        <Notice tone="warn">
          Nenhum pagante ainda, então receita e lucro estão zerados. Isso é o número real, não uma
          falha: a cobrança ainda não foi implementada no app. Quando entrar, ela deve gravar em{' '}
          <code>public.subscriptions</code> e estes valores passam a existir sozinhos.
        </Notice>
      )}

      <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Receita bruta"
          value={formatBRL(receitaBruta)}
          hint="Preço cheio, anual rateado por 12"
          compactHint
        />
        <StatCard
          label="Receita líquida"
          value={formatBRL(receitaLiquida)}
          hint={`Após ${Math.round(TAXA_LOJA * 100)}% da loja`}
          accent
        />
        <StatCard label="Custo total" value={formatBRL(pnl.custoTotal)} hint="Despesas + repasses" />
        <StatCard
          label="Lucro"
          value={formatBRL(pnl.lucro)}
          hint={`Margem ${pnl.margem.toFixed(1)}%`}
          danger={pnl.lucro < 0}
        />
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Assinantes" value={m.pagantes} />
        <StatCard label="Mensais" value={mensais} />
        <StatCard label="Anuais" value={anuais} />
        <StatCard label="Repasses do mês" value={formatBRL(pnl.repasses)} />
      </div>

      <h2 className="mb-3 text-base font-bold text-ninho-grafite">Para onde vai o dinheiro</h2>
      <BarChart
        data={[
          { label: 'Receita líquida', value: receitaLiquida, color: '#59B287' },
          { label: 'Custos fixos', value: pnl.custosFixos, color: '#9F86E0' },
          { label: 'Custos variáveis', value: pnl.custosVariaveis, color: '#7DB7F0' },
          { label: 'Repasses', value: pnl.repasses, color: '#F5C24E' },
          {
            label: pnl.lucro >= 0 ? 'Lucro' : 'Prejuízo',
            value: Math.abs(pnl.lucro),
            color: pnl.lucro >= 0 ? '#4CAF74' : '#E85D5D',
          },
        ]}
        formatValue={formatBRL}
      />
    </>
  );
}
