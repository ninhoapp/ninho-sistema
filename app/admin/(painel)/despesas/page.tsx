import { requireRole } from '@/lib/auth/guard';
import { listCosts } from '@/lib/painel/store';
import { custosDoMes, formatBRL } from '@/lib/metrics';
import { PageHeader } from '@/components/admin/PageHeader';
import { StatCard } from '@/components/admin/StatCard';
import { CostsManager } from '@/components/admin/CostsManager';

export const dynamic = 'force-dynamic';

export default async function DespesasPage() {
  requireRole('admin');
  const custos = await listCosts();

  const d = new Date();
  const mes = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  const doMes = custosDoMes(custos, mes);
  const tudo = custosDoMes(custos);
  const marketing = custos
    .filter((c) => c.category === 'marketing' && c.ref_month.slice(0, 7) === mes)
    .reduce((s, c) => s + Number(c.amount), 0);

  return (
    <>
      <PageHeader
        title="Despesas"
        subtitle="Custos de operar o Ninho. Marketing fica separado de App porque é ele que vira CAC."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total do mês" value={formatBRL(doMes.total)} hint={mes} accent />
        <StatCard label="Fixos do mês" value={formatBRL(doMes.fixos)} />
        <StatCard label="Variáveis do mês" value={formatBRL(doMes.variaveis)} />
        <StatCard label="Marketing do mês" value={formatBRL(marketing)} hint="Base do CAC" />
      </div>

      <p className="mb-6 text-sm text-ninho-cinza">
        Acumulado de todos os meses lançados: <strong>{formatBRL(tudo.total)}</strong>
      </p>

      <CostsManager custos={custos} />
    </>
  );
}
