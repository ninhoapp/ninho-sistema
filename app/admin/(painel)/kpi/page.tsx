import { requireRole } from '@/lib/auth/guard';
import { listCosts, listPerfis, listOutcomes } from '@/lib/painel/store';
import { fetchAppUsers } from '@/lib/app-users';
import { buildOverview, buildRepasses, custosDoMes, formatBRL } from '@/lib/metrics';
import { liquido, DIAS_TRIAL } from '@/lib/precos';
import { PageHeader } from '@/components/admin/PageHeader';
import { StatCard } from '@/components/admin/StatCard';
import { Notice } from '@/components/admin/Notice';
import { BarChart } from '@/components/admin/BarChart';
import { MonthFilter } from '@/components/admin/MonthFilter';

export const dynamic = 'force-dynamic';

/** Meses médios que um assinante fica. Sem histórico real ainda, é uma premissa. */
const LIFETIME_MESES_ESTIMADO = 12;

function mesValido(v: string | undefined): string {
  return v && /^\d{4}-\d{2}$/.test(v) ? v : new Date().toISOString().slice(0, 7);
}

export default async function KpiPage({ searchParams }: { searchParams: { mes?: string } }) {
  requireRole('admin');
  const [users, custos, perfis, outcomes] = await Promise.all([
    fetchAppUsers(),
    listCosts(),
    listPerfis(),
    listOutcomes(),
  ]);

  const mes = mesValido(searchParams.mes);

  const m = buildOverview(users);
  const repasses = buildRepasses(perfis, users, outcomes);
  const receitaLiquida = liquido(m.receitaMensalEstimada);

  // CAC = tudo que se gastou em marketing dividido por quem virou pagante.
  const marketing = custos
    .filter((c) => c.category === 'marketing')
    .reduce((s, c) => s + Number(c.amount), 0);
  const cac = m.pagantes > 0 ? marketing / m.pagantes : 0;

  // ARPU sobre a receita líquida — o que de fato entra por assinante.
  const arpu = m.pagantes > 0 ? receitaLiquida / m.pagantes : 0;
  const ltv = arpu * LIFETIME_MESES_ESTIMADO;
  const razaoLtvCac = cac > 0 ? ltv / cac : 0;

  // Conversão: de quem JÁ TERMINOU o trial, quantos assinaram.
  //
  // A base são os expirados + os assinantes — não a base inteira. Incluir
  // quem ainda está em trial afundaria a taxa de propósito: essa pessoa não
  // decidiu nada ainda, não é uma não-conversão.
  //
  // Churn entra na base porque quem cancelou TAMBÉM converteu um dia: deixar
  // de fora faria a taxa subir sozinha a cada cancelamento, que é exatamente
  // o contrário do que o número deve dizer. Hoje churn é 0, então a conta dá
  // no mesmo; a diferença aparece quando o primeiro cancelamento chegar.
  const terminaramTrial = m.trialExpirado + m.pagantes + m.churn;
  const conversaoTrial = terminaramTrial > 0 ? (m.pagantes / terminaramTrial) * 100 : 0;

  const baseChurn = m.pagantes + m.churn;
  const taxaChurn = baseChurn > 0 ? (m.churn / baseChurn) * 100 : 0;

  const c = custosDoMes(custos, mes);
  const burn = c.total + repasses.reduce((s, r) => s + r.consolidado, 0);

  return (
    <>
      <PageHeader
        title="KPI"
        subtitle="Indicadores do negócio. Onde houver premissa em vez de dado real, está escrito no card."
        right={<MonthFilter value={mes} />}
      />

      {m.pagantes === 0 && (
        <Notice tone="warn">
          Sem pagantes, os indicadores de receita (ARPU, LTV, CAC) ficam zerados — não dá para
          dividir por zero assinante. Os de funil (conversão de trial, base de usuários) já são
          reais e podem ser lidos normalmente.
        </Notice>
      )}

      <h2 className="mb-3 text-base font-bold text-ninho-grafite">Funil</h2>
      <div className="mb-2 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          label="Total de usuários"
          value={m.totalUsuarios}
          hint={`${m.trialAtivo} ainda em trial`}
          compactHint
          accent
        />
        <StatCard
          label="Usuários expirados"
          value={m.trialExpirado}
          hint={`Passaram os ${DIAS_TRIAL} dias sem assinar`}
          compactHint
        />
        <StatCard
          label="Assinantes"
          value={m.pagantes}
          hint="Pagando hoje, qualquer plano"
          compactHint
        />
        <StatCard
          label="Taxa de conversão"
          value={`${conversaoTrial.toFixed(1)}%`}
          hint={`${m.pagantes} ÷ ${terminaramTrial} que terminaram`}
          compactHint
        />
        <StatCard
          label="Churn"
          value={m.churn}
          hint={m.churn > 0 ? `${taxaChurn.toFixed(1)}% de quem assinou` : 'Nenhum cancelamento'}
          compactHint
          danger={m.churn > 0}
        />
      </div>

      <p className="mb-8 text-xs text-ninho-cinza">
        A <strong>taxa de conversão</strong> olha só quem já decidiu: expirados + assinantes
        {m.churn > 0 && ' + churn'}. Quem ainda está em trial fica de fora — ainda não é uma
        não-conversão, e incluir afundaria o número sem motivo.
      </p>

      <h2 className="mb-3 text-base font-bold text-ninho-grafite">Dinheiro</h2>
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="MRR líquido" value={formatBRL(receitaLiquida)} accent />
        <StatCard label="ARPU" value={formatBRL(arpu)} hint="Receita líquida por assinante" compactHint />
        <StatCard
          label="LTV"
          value={formatBRL(ltv)}
          hint={`Premissa: ${LIFETIME_MESES_ESTIMADO} meses de permanência`}
          compactHint
        />
        <StatCard
          label="CAC"
          value={formatBRL(cac)}
          hint="Marketing acumulado ÷ pagantes"
          compactHint
        />
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="LTV / CAC"
          value={razaoLtvCac > 0 ? `${razaoLtvCac.toFixed(1)}x` : '—'}
          hint="Abaixo de 3x o crescimento não se paga"
          compactHint
          danger={razaoLtvCac > 0 && razaoLtvCac < 3}
        />
        <StatCard label="Burn do mês" value={formatBRL(burn)} hint="Despesas + repasses" compactHint />
        <StatCard
          label="Resultado do mês"
          value={formatBRL(receitaLiquida - burn)}
          danger={receitaLiquida - burn < 0}
        />
      </div>

      <h2 className="mb-3 text-base font-bold text-ninho-grafite">Distribuição da base</h2>
      <BarChart
        data={[
          { label: 'Pagantes', value: m.pagantes, color: '#59B287' },
          { label: 'Trial ativo', value: m.trialAtivo, color: '#9F86E0' },
          { label: 'Trial expirado', value: m.trialExpirado, color: '#F5C24E' },
          { label: 'Churn', value: m.churn, color: '#E85D5D' },
          { label: 'Free', value: m.free, color: '#C9BEE0' },
        ]}
      />
    </>
  );
}
