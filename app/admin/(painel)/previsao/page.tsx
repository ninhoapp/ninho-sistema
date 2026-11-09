import { requireRole } from '@/lib/auth/guard';
import { fetchAppUsers, fetchUsoPorUsuario } from '@/lib/app-users';
import { listCosts } from '@/lib/painel/store';
import { custoAquisicao } from '@/lib/metrics';
import { preverAssinantes, GRUPO_ORIGEM_LABEL, type GrupoOrigem, type Taxa } from '@/lib/previsao';
import { PageHeader } from '@/components/admin/PageHeader';
import { StatCard } from '@/components/admin/StatCard';
import { Notice } from '@/components/admin/Notice';
import { PrevisaoChart } from '@/components/admin/PrevisaoChart';

export const dynamic = 'force-dynamic';

const n1 = (v: number) => v.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
const n0 = (v: number) => Math.round(v).toLocaleString('pt-BR');
const pctT = (t: Taxa) => (t.pct == null ? '—' : `${(t.pct * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`);
const aed = (v: number) => `${v.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} AED`;
const nomeMes = (mes: string) =>
  new Date(mes + '-15T12:00:00Z').toLocaleString('pt-BR', { month: 'long', timeZone: 'UTC' });
const dm = (dia: string) => `${dia.slice(8, 10)}/${dia.slice(5, 7)}`;

function mesAnterior(mes: string): string {
  const [y, m] = mes.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 2, 15));
  return d.toISOString().slice(0, 7);
}

export default async function PrevisaoPage({ searchParams }: { searchParams: { cad?: string } }) {
  requireRole('admin');
  const [users, uso, custos] = await Promise.all([fetchAppUsers(), fetchUsoPorUsuario(), listCosts()]);
  const cadParam = searchParams.cad != null && searchParams.cad !== '' ? Number(searchParams.cad) : null;
  const prev = preverAssinantes(users, uso, {
    cadastrosPorDia: cadParam != null && Number.isFinite(cadParam) ? cadParam : null,
  });
  const cal = prev.calibracao;
  const passado = mesAnterior(prev.mesAtual.mes);
  const cacPassado = custoAquisicao(custos, users, passado);
  const cadMedia = (Object.values(cal.cadastrosDia) as number[]).reduce((s, v) => s + v, 0);
  const proximos = prev.dias.filter((d) => d.futuro).slice(0, 14);
  const passados = prev.dias.filter((d) => !d.futuro);
  const realPassado = passados.reduce((s, d) => s + (d.real ?? 0), 0);
  const esperadoPassado = passados.reduce((s, d) => s + d.esperado, 0);

  return (
    <>
      <PageHeader
        title="Previsão de assinantes"
        subtitle="Quantos vão pagar por dia e no mês, recalculado a cada visita com as taxas medidas no banco. Assinante = pagou de fato. Dias no fuso de Dubai."
      />

      <form method="get" className="mb-6 flex flex-wrap items-end gap-3 rounded-2xl border border-ninho-borda bg-white p-4">
        <label className="flex flex-col gap-1 text-xs text-ninho-cinza" htmlFor="cad">
          Cenário: cadastros por dia daqui para a frente
          <input
            id="cad"
            name="cad"
            type="number"
            min={0}
            step={1}
            defaultValue={Math.round(prev.cadastrosPorDiaCenario)}
            className="w-32 rounded-lg border border-ninho-borda px-3 py-2 text-sm text-ninho-grafite"
          />
        </label>
        <button type="submit" className="rounded-lg bg-ninho-roxo px-4 py-2 text-sm font-semibold text-white">
          Recalcular
        </button>
        {prev.cenarioManual && (
          <a href="/admin/previsao" className="text-sm font-semibold text-ninho-roxo-escuro underline">
            Voltar à média dos últimos 14 dias ({n1(cadMedia)} por dia)
          </a>
        )}
        <p className="basis-full text-xs text-ninho-cinza">
          Média dos últimos 14 dias: <strong>{n1(cadMedia)}</strong> cadastros por dia. Use o cenário para
          ver o efeito de mudar a verba (ex.: parar a Meta tira uns 5 por dia).
        </p>
      </form>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={`${nomeMes(prev.mesAtual.mes)} · previsto`}
          value={`~${n0(prev.mesAtual.previsto)}`}
          hint={`faixa ${n0(prev.mesAtual.baixo)} a ${n0(prev.mesAtual.alto)} · já pagaram ${prev.mesAtual.jaPagaram}`}
          accent
          compactHint
        />
        <StatCard
          label="Próximos 7 dias"
          value={`~${n0(prev.proximos7.previsto)}`}
          hint={`faixa ${n0(prev.proximos7.baixo)} a ${n0(prev.proximos7.alto)}`}
          compactHint
        />
        <StatCard
          label={`${nomeMes(prev.proximoMes.mes)} · previsto`}
          value={`~${n0(prev.proximoMes.previsto)}`}
          hint={`faixa ${n0(prev.proximoMes.baixo)} a ${n0(prev.proximoMes.alto)} · com ${n1(prev.cadastrosPorDiaCenario)} cadastros por dia`}
          compactHint
        />
        <StatCard
          label={`Custo por assinante · ${nomeMes(passado)}`}
          value={cacPassado.total == null ? '—' : aed(cacPassado.total)}
          hint={`${aed(cacPassado.gasto)} de marketing ÷ ${cacPassado.assinantes} assinantes novos`}
          compactHint
        />
      </div>

      <h2 className="mb-1 text-base font-bold text-ninho-grafite">Assinantes por dia</h2>
      <p className="mb-3 text-xs text-ninho-cinza">
        Antes da linha tracejada: quem pagou e o que o modelo esperava naquele dia. Nos últimos{' '}
        {passados.length} dias pagaram <strong>{realPassado}</strong> e o modelo esperava{' '}
        <strong>{n1(esperadoPassado)}</strong>. Depois da linha: a previsão até o fim de{' '}
        {nomeMes(prev.proximoMes.mes)}. Faixa = 80% de chance.
      </p>
      <div className="mb-8">
        <PrevisaoChart dias={prev.dias} hoje={prev.hoje} />
      </div>

      <h2 className="mb-1 text-base font-bold text-ninho-grafite">As taxas que movem a previsão (alavancas)</h2>
      <p className="mb-3 text-xs text-ninho-cinza">
        Medidas nas contas cujo teste já acabou, criadas desde {dm(cal.desde)}. Para baixar o custo por
        assinante com a mesma verba, é aqui que o número tem que subir.
      </p>
      <div className="mb-8 overflow-x-auto rounded-2xl border border-ninho-borda bg-white">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-ninho-borda text-left text-xs uppercase tracking-wide text-ninho-cinza">
              <th className="px-4 py-2.5">Taxa</th>
              <th className="px-4 py-2.5">Hoje</th>
              <th className="px-4 py-2.5">Base</th>
              <th className="px-4 py-2.5">O que significa</th>
            </tr>
          </thead>
          <tbody className="text-ninho-grafite">
            <tr className="border-b border-ninho-borda bg-ninho-roxo-suave/40">
              <td className="px-4 py-2.5 font-semibold">Ativação (3+ dias com registro)</td>
              <td className="px-4 py-2.5 font-bold">{pctT(cal.ativacao)}</td>
              <td className="px-4 py-2.5 text-ninho-cinza">{cal.ativacao.pagaram} de {cal.ativacao.total}</td>
              <td className="px-4 py-2.5 text-ninho-cinza">Alavanca nº 1: cada 5 pontos a mais ≈ 1 ponto a mais de conversão.</td>
            </tr>
            <tr className="border-b border-ninho-borda">
              <td className="px-4 py-2.5">Pagam · ativos</td>
              <td className="px-4 py-2.5 font-bold">{pctT(cal.ativos)}</td>
              <td className="px-4 py-2.5 text-ninho-cinza">{cal.ativos.pagaram} de {cal.ativos.total}</td>
              <td className="px-4 py-2.5 text-ninho-cinza">Quem usou o app em 3 dias ou mais.</td>
            </tr>
            <tr className="border-b border-ninho-borda">
              <td className="px-4 py-2.5">Pagam · pouco ativos</td>
              <td className="px-4 py-2.5 font-bold">{pctT(cal.poucoAtivos)}</td>
              <td className="px-4 py-2.5 text-ninho-cinza">{cal.poucoAtivos.pagaram} de {cal.poucoAtivos.total}</td>
              <td className="px-4 py-2.5 text-ninho-cinza">Quem usou em 2 dias ou menos.</td>
            </tr>
            <tr className="border-b border-ninho-borda">
              <td className="px-4 py-2.5">Pagam depois do teste da loja</td>
              <td className="px-4 py-2.5 font-bold">{pctT(cal.loja)}</td>
              <td className="px-4 py-2.5 text-ninho-cinza">{cal.loja.pagaram} de {cal.loja.total}</td>
              <td className="px-4 py-2.5 text-ninho-cinza">Puseram o cartão (grupos B e C) e o teste da loja já acabou.</td>
            </tr>
            {(Object.keys(cal.porOrigem) as GrupoOrigem[]).map((g) => (
              <tr key={g} className="border-b border-ninho-borda last:border-b-0">
                <td className="px-4 py-2.5">Pagam por cadastro · {GRUPO_ORIGEM_LABEL[g]}</td>
                <td className="px-4 py-2.5 font-bold">{pctT(cal.porOrigem[g])}</td>
                <td className="px-4 py-2.5 text-ninho-cinza">{cal.porOrigem[g].pagaram} de {cal.porOrigem[g].total}</td>
                <td className="px-4 py-2.5 text-ninho-cinza">{n1(cal.cadastrosDia[g])} cadastros por dia nos últimos 14 dias.</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mb-1 text-base font-bold text-ninho-grafite">Próximos 14 dias</h2>
      <p className="mb-3 text-xs text-ninho-cinza">
        Agora: {prev.emAndamento.app} pessoas no teste do app ({prev.emAndamento.appAtivos} já com 3 dias de
        uso) e {prev.emAndamento.loja} no teste da loja.
      </p>
      <div className="mb-8 overflow-x-auto rounded-2xl border border-ninho-borda bg-white">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-ninho-borda text-left text-xs uppercase tracking-wide text-ninho-cinza">
              <th className="px-4 py-2.5">Dia</th>
              <th className="px-4 py-2.5">Testes do app vencendo</th>
              <th className="px-4 py-2.5">Testes da loja vencendo</th>
              <th className="px-4 py-2.5">Cadastros novos (cenário)</th>
              <th className="px-4 py-2.5">Previsto</th>
              <th className="px-4 py-2.5">Faixa de 80%</th>
            </tr>
          </thead>
          <tbody className="text-ninho-grafite">
            {proximos.map((d) => (
              <tr key={d.dia} className="border-b border-ninho-borda last:border-b-0">
                <td className="px-4 py-2">{dm(d.dia)}</td>
                <td className="px-4 py-2">{d.testesApp || '—'}</td>
                <td className="px-4 py-2">{d.testesLoja || '—'}</td>
                <td className="px-4 py-2">{d.cadastrosNovos ? n1(d.cadastrosNovos) : '—'}</td>
                <td className="px-4 py-2 font-bold">{n1(d.esperado)}</td>
                <td className="px-4 py-2 text-ninho-cinza">
                  {n1(d.baixo)} a {n1(d.alto)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Notice tone="info">
        <strong>Como a conta é feita.</strong> Cada teste do app que vence entra com a chance de pagar de quem
        é parecido: já usou 3 dias ou mais (taxa dos ativos), não tem mais como chegar a 3 dias (taxa dos
        pouco ativos) ou ainda está no começo (taxa da origem dele). Cada teste da loja que vence entra com a
        taxa de quem pagou depois do teste da loja. Quem se cadastrar a partir de amanhã termina o teste 7 dias
        depois e entra com a taxa por cadastro, na mistura de origens dos últimos 14 dias. As taxas são
        refeitas a cada visita; a faixa soma a sorte de cada pessoa e ±30% de incerteza nas taxas. O custo por
        assinante usa a mesma conta da tela de KPI (Despesas em AED).
      </Notice>
    </>
  );
}
