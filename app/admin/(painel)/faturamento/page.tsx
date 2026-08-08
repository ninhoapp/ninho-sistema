import { requireRole } from '@/lib/auth/guard';
import { listCosts, listPerfis, listOutcomes } from '@/lib/painel/store';
import { fetchAppUsers } from '@/lib/app-users';
import {
  buildOverview,
  buildPnL,
  buildRepasses,
  custosDoMes,
  formatBRL,
  isPagante,
} from '@/lib/metrics';
import { DivergingBarChart, type DBar } from '@/components/admin/DivergingBarChart';
import { AssinantesTable } from '@/components/admin/AssinantesTable';
import { TAXA_LOJA, liquido } from '@/lib/precos';
import { PageHeader } from '@/components/admin/PageHeader';
import { StatCard } from '@/components/admin/StatCard';
import { Notice } from '@/components/admin/Notice';
import { BarChart } from '@/components/admin/BarChart';
import { MonthFilter } from '@/components/admin/MonthFilter';
import { IconCash, IconCard, IconServer, IconScale } from '@/components/admin/icons';

export const dynamic = 'force-dynamic';

function mesValido(v: string | undefined): string {
  return v && /^\d{4}-\d{2}$/.test(v) ? v : new Date().toISOString().slice(0, 7);
}

export default async function FaturamentoPage({
  searchParams,
}: {
  searchParams: { mes?: string };
}) {
  requireRole('admin');
  const mes = mesValido(searchParams.mes);

  const [users, custos, perfis, outcomes] = await Promise.all([
    fetchAppUsers(),
    listCosts(),
    listPerfis(),
    listOutcomes(),
  ]);

  const m = buildOverview(users);
  const repasses = buildRepasses(perfis, users, outcomes);
  const receitaBruta = m.receitaMensalEstimada;
  const receitaLiquida = liquido(receitaBruta);
  const pnl = buildPnL(receitaLiquida, custos, repasses, mes);

  const pagantes = users.filter(isPagante);
  const mensais = pagantes.filter((u) => u.plan_interval !== 'anual').length;
  const anuais = pagantes.filter((u) => u.plan_interval === 'anual').length;

  // Resultado dos últimos 6 meses. A receita é a de hoje aplicada a todos os
  // meses — sem histórico de cobrança, não dá para reconstruir o passado. O
  // que varia de fato mês a mês são os custos, que são lançados por data.
  const [anoRef, mesRef] = mes.split('-').map(Number);
  const seisMeses: DBar[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(anoRef, mesRef - 1 - i, 1);
    const chave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const c = custosDoMes(custos, chave);
    const resultado = receitaLiquida - c.total;
    seisMeses.push({
      label: d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
      value: resultado,
      highlight: chave === mes,
    });
  }

  return (
    <>
      <PageHeader
        title="Faturamento e lucro"
        subtitle={`A receita já entra líquida — descontados os ${Math.round(
          TAXA_LOJA * 100
        )}% que Apple e Google retêm.`}
        right={<MonthFilter value={mes} />}
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
          icon={<IconCash />}
        />
        <StatCard
          label="Receita líquida"
          value={formatBRL(receitaLiquida)}
          hint={`Após ${Math.round(TAXA_LOJA * 100)}% da loja`}
          accent
          icon={<IconCard />}
        />
        <StatCard
          label="Custo total"
          value={formatBRL(pnl.custoTotal)}
          hint="Despesas + repasses"
          icon={<IconServer />}
        />
        <StatCard
          label="Lucro"
          value={formatBRL(pnl.lucro)}
          hint={`Margem ${pnl.margem.toFixed(1)}%`}
          danger={pnl.lucro < 0}
          icon={<IconScale />}
        />
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Assinantes" value={m.pagantes} />
        <StatCard label="Mensais" value={mensais} />
        <StatCard label="Anuais" value={anuais} />
        <StatCard label="Repasses do mês" value={formatBRL(pnl.repasses)} />
      </div>

      <h2 className="mb-3 text-base font-bold text-ninho-grafite">
        Para onde vai o dinheiro — {mes}
      </h2>
      <div className="mb-8">
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
      </div>

      <h2 className="mb-3 text-base font-bold text-ninho-grafite">Resultado — últimos 6 meses</h2>
      <div className="mb-8">
        <DivergingBarChart bars={seisMeses} />
      </div>

      <AssinantesTable rows={pagantes} />
    </>
  );
}
