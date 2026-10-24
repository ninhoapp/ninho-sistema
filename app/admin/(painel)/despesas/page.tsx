import { requireRole } from '@/lib/auth/guard';
import { listCosts } from '@/lib/painel/store';
import { custosDoMes } from '@/lib/metrics';
import { formatAED } from '@/lib/cambio';
import { PageHeader } from '@/components/admin/PageHeader';
import { StatCard } from '@/components/admin/StatCard';
import { CostsManager } from '@/components/admin/CostsManager';
import { MonthFilter } from '@/components/admin/MonthFilter';
import { ConfirmButton } from '@/components/admin/ConfirmButton';
import { zerarCustosDoMes } from '@/app/admin/(painel)/admin-actions';
import { IconCash, IconServer, IconMegaphone, IconExchange } from '@/components/admin/icons';

export const dynamic = 'force-dynamic';

function mesValido(v: string | undefined): string {
  return v && /^\d{4}-\d{2}$/.test(v) ? v : new Date().toISOString().slice(0, 7);
}

export default async function DespesasPage({
  searchParams,
}: {
  searchParams: { mes?: string };
}) {
  requireRole('admin');
  const mes = mesValido(searchParams.mes);
  const custos = await listCosts();

  const doMes = custosDoMes(custos, mes);
  const tudo = custosDoMes(custos);
  const marketing = custos
    .filter((c) => c.category === 'marketing' && c.ref_month.slice(0, 7) === mes)
    .reduce((s, c) => s + Number(c.amount), 0);

  const doMesLista = custos.filter((c) => c.ref_month.slice(0, 7) === mes);

  return (
    <>
      <PageHeader
        title="Despesas"
        subtitle="Custos de operar o Ninho, todos em AED (custo em US$ ou R$ entra convertido para AED). Marketing fica separado de App porque é ele que vira CAC."
        right={<MonthFilter value={mes} />}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total do mês" value={formatAED(doMes.total)} hint={mes} accent icon={<IconCash />} />
        <StatCard label="Fixos" value={formatAED(doMes.fixos)} icon={<IconServer />} />
        <StatCard label="Variáveis" value={formatAED(doMes.variaveis)} icon={<IconExchange />} />
        <StatCard label="Marketing" value={formatAED(marketing)} hint="Base do CAC" icon={<IconMegaphone />} />
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ninho-cinza">
          Acumulado de todos os meses lançados: <strong>{formatAED(tudo.total)}</strong>
        </p>
        {doMesLista.length > 0 && (
          <ConfirmButton
            action={zerarCustosDoMes}
            hidden={{ mes }}
            label={`Zerar despesas de ${mes}`}
            message={`Apagar as ${doMesLista.length} despesas de ${mes}? Não tem desfazer.`}
          />
        )}
      </div>

      <CostsManager custos={custos} mesFiltro={mes} />
    </>
  );
}
