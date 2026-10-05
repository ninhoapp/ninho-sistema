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
  receitaBrutaDoMes,
  receitaBrutaTotal,
  primeiroMesComReceita,
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
import { ORIGENS, ORIGEM_COR, ORIGEM_LABEL } from '@/lib/origem';
import type { AppUser } from '@/lib/app-users';

export const dynamic = 'force-dynamic';

/** Contagem por origem, na ordem de ORIGENS. Origem sem ninguém some do
 *  gráfico — exceto quando TODO mundo é zero, aí o BarChart mostra o vazio. */
function porOrigem(lista: AppUser[]) {
  return ORIGENS.map((o) => ({
    label: ORIGEM_LABEL[o],
    value: lista.filter((u) => u.origem === o).length,
    color: ORIGEM_COR[o],
  })).filter((d, _i, todos) => d.value > 0 || todos.every((t) => t.value === 0));
}

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

  // REGIME DE CAIXA: o que a loja cobrou NESTE mês. O anual entra inteiro no
  // mês da compra e some nos onze seguintes — é assim que o dinheiro chega.
  // Note que isto roda sobre `users`, não só sobre os pagantes de hoje: quem
  // cancelou depois de pagar ainda pôs dinheiro no caixa naquele mês.
  const receitaBruta = receitaBrutaDoMes(users, mes);
  const receitaLiquida = liquido(receitaBruta);
  const pnl = buildPnL(receitaLiquida, custos, repasses, mes);

  // Acumulado desde a primeira cobrança. `buildPnL` e `custosDoMes` sem mês
  // somam tudo — é a mesma conta do bloco mensal, só sem o recorte.
  const receitaBrutaAcum = receitaBrutaTotal(users);
  const receitaLiquidaAcum = liquido(receitaBrutaAcum);
  const pnlAcum = buildPnL(receitaLiquidaAcum, custos, repasses);
  const desdeMes = primeiroMesComReceita(users);

  // MRR continua existindo ao lado, como leitura de recorrência: é o que se
  // esperaria receber num mês típico, com o anual diluído.
  const mrrLiquido = liquido(m.receitaMensalEstimada);

  const pagantes = users.filter(isPagante);
  const mensais = pagantes.filter((u) => u.plan_interval !== 'anual').length;
  const anuais = pagantes.filter((u) => u.plan_interval === 'anual').length;

  // Quem virou assinante NO MÊS selecionado (primeira compra verificada) —
  // é o recorte que responde "qual anúncio está trazendo assinante agora".
  const assinaramNoMes = pagantes.filter((u) => u.assinouEm?.slice(0, 7) === mes);
  const semOrigem = pagantes.filter((u) => u.origem === 'sem_informacao').length;

  // Resultado dos últimos 6 meses — agora com receita REAL por mês, porque
  // cada cobrança tem data. Antes isto repetia a receita de hoje em todos os
  // meses, e só os custos variavam.
  const [anoRef, mesRef] = mes.split('-').map(Number);
  const seisMeses: DBar[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(anoRef, mesRef - 1 - i, 1);
    const chave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const c = custosDoMes(custos, chave);
    const resultado = liquido(receitaBrutaDoMes(users, chave)) - c.total;
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
        subtitle={`Receita por caixa: conta o que a loja cobrou no mês. O anual entra inteiro no mês da compra e zera nos onze seguintes. Já descontados os ${Math.round(
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

      <h2 className="mb-3 text-base font-bold text-ninho-grafite">
        Todo o período{' '}
        {desdeMes && (
          <span className="font-normal text-ninho-cinza">· desde {desdeMes}</span>
        )}
      </h2>
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Receita bruta"
          value={formatBRL(receitaBrutaAcum)}
          hint="Tudo que a loja já cobrou"
          compactHint
          icon={<IconCash />}
        />
        <StatCard
          label="Receita líquida"
          value={formatBRL(receitaLiquidaAcum)}
          hint={`Após ${Math.round(TAXA_LOJA * 100)}% da loja`}
          accent
          icon={<IconCard />}
        />
        <StatCard
          label="Custo total"
          value={formatBRL(pnlAcum.custoTotal)}
          hint="Todas as despesas + repasses"
          compactHint
          icon={<IconServer />}
        />
        <StatCard
          label="Lucro"
          value={formatBRL(pnlAcum.lucro)}
          hint={`Margem ${pnlAcum.margem.toFixed(1)}%`}
          danger={pnlAcum.lucro < 0}
          icon={<IconScale />}
        />
      </div>

      <h2 className="mb-3 text-base font-bold text-ninho-grafite">Este mês · {mes}</h2>
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Receita bruta"
          value={formatBRL(receitaBruta)}
          hint={`Cobranças de ${mes}`}
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

      <h2 className="mb-3 text-base font-bold text-ninho-grafite">Assinantes</h2>
      <div className="mb-2 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Assinantes" value={m.pagantes} />
        <StatCard label="Mensais" value={mensais} />
        <StatCard label="Anuais" value={anuais} />
        <StatCard
          label="MRR líquido"
          value={formatBRL(mrrLiquido)}
          hint="Recorrência, anual diluído por 12"
          compactHint
        />
        <StatCard label="Repasses do mês" value={formatBRL(pnl.repasses)} />
      </div>

      <p className="mb-8 text-xs text-ninho-cinza">
        <strong>Receita bruta</strong> é caixa: só entra no mês em que a loja cobrou.{' '}
        <strong>MRR</strong> é recorrência: dilui o anual por 12 para mostrar o que se espera num mês
        típico. Os dois são certos e respondem perguntas diferentes — por isso ficam lado a lado.
      </p>

      <h2 className="mb-3 text-base font-bold text-ninho-grafite">De onde vêm os assinantes</h2>
      <div className="mb-2 grid gap-4 lg:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-semibold text-ninho-cinza">
            Assinaram em {mes} · {assinaramNoMes.length}
          </p>
          <BarChart data={porOrigem(assinaramNoMes)} />
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold text-ninho-cinza">
            Todos os assinantes ativos · {pagantes.length}
          </p>
          <BarChart data={porOrigem(pagantes)} />
        </div>
      </div>
      <p className="mb-8 text-xs text-ninho-cinza">
        <strong>Apple Ads</strong> é confirmado pela própria Apple, assinante por assinante.{' '}
        <strong>Instagram/Facebook</strong> e as demais são o que a pessoa respondeu no cadastro —
        inclui anúncio e post orgânico. O resultado por campanha da Meta fica no Gerenciador de
        Anúncios (coluna Assinaturas).
        {semOrigem > 0 && (
          <>
            {' '}
            <strong>Sem informação</strong> ({semOrigem}): quem assinou antes da medição existir ou
            ainda não abriu a versão nova do app.
          </>
        )}
      </p>

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

      <AssinantesTable rows={pagantes} mes={mes} />
    </>
  );
}
