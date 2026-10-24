/**
 * Tela "KPI de crescimento" (plano × realizado). Recebe os dados prontos; a
 * página em app/admin/(painel)/crescimento busca e passa.
 */
import Link from 'next/link';
import type { Cost } from '@/lib/painel/store';
import type { AppUser } from '@/lib/app-users';
import { custoAquisicao, realizadoDoMes, type MesRealizado } from '@/lib/metrics';
import {
  PLANO, PREMISSAS, CENARIO_LABEL, CENARIO_COR, SE_PAGA, CAMBIO, BRL_POR_AED, BOLSO_AED, FIM_DO_BOLSO,
  type Cenario, type MesPlano,
} from '@/lib/projecao';
import { mesNoPainel, mesesEntre, rotuloMes } from '@/lib/dashboard-charts';
import { PageHeader } from '@/components/admin/PageHeader';
import { MonthFilter } from '@/components/admin/MonthFilter';
import { PlanoRealChart } from '@/components/admin/PlanoRealChart';
import { GroupedBarChart } from '@/components/admin/GroupedBarChart';

const CENARIOS: Cenario[] = ['pessimista', 'base', 'otimista'];
/** Set e out/2026 entram como ponto de partida real; o plano começa em nov. */
const INICIO = '2026-09';
const PRIMEIRO_PLANO = '2026-11';
const ULTIMO_PLANO = '2027-12';

const num = (v: number) => Math.round(v).toLocaleString('pt-BR');
const aed = (v: number) => `${num(v)} AED`;
const brl0 = (v: number) => `R$ ${num(v)}`;

export function cenarioValido(v: string | undefined): Cenario {
  return v === 'pessimista' || v === 'otimista' ? v : 'base';
}

export function mesValido(v: string | undefined): string {
  return v && /^\d{4}-\d{2}$/.test(v) ? v : mesNoPainel(new Date());
}

/** Verde = no plano ou acima; amarelo = 80–99%; vermelho = abaixo de 80%. Para custo, ao contrário. */
function situacao(real: number, plano: number, menorEhMelhor = false) {
  if (plano <= 0) return { pct: null as number | null, cor: '#8A8299', texto: '' };
  const pct = (real / plano) * 100;
  const bom = menorEhMelhor ? pct <= 100 : pct >= 100;
  const quase = menorEhMelhor ? pct <= 120 : pct >= 80;
  return {
    pct,
    cor: bom ? '#4CAF74' : quase ? '#E0A100' : '#E85D5D',
    texto: bom ? 'no plano' : quase ? 'perto do plano' : menorEhMelhor ? 'acima do plano' : 'abaixo do plano',
  };
}

function MetaCard({
  label, unidade, real, plano, formatar, menorEhMelhor = false, nota,
}: {
  label: string;
  unidade: string;
  real: number | null;
  plano: number | null;
  formatar: (v: number) => string;
  menorEhMelhor?: boolean;
  nota?: string;
}) {
  const s = real != null && plano != null ? situacao(real, plano, menorEhMelhor) : null;
  return (
    <div className="flex min-w-0 flex-col gap-1 rounded-2xl border border-ninho-borda bg-white p-5">
      <p className="text-xs uppercase tracking-wide text-ninho-cinza">
        {label} <span className="normal-case tracking-normal">· {unidade}</span>
      </p>
      <p className="text-3xl font-bold text-ninho-roxo-escuro">{real != null ? formatar(real) : '—'}</p>
      <p className="text-xs text-ninho-cinza">
        Plano: <strong className="text-ninho-grafite">{plano != null ? formatar(plano) : '—'}</strong>
        {s?.pct != null && (
          <span className="ml-1 font-semibold" style={{ color: s.cor }}>
            · {Math.round(s.pct)}% ({s.texto})
          </span>
        )}
      </p>
      {s?.pct != null && (
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-ninho-roxo-suave">
          <div className="h-full rounded-full" style={{ width: `${Math.min(100, s.pct)}%`, background: s.cor }} />
        </div>
      )}
      {nota && <p className="mt-1 text-[11px] text-ninho-cinza">{nota}</p>}
    </div>
  );
}

/** Custo por assinante do plano, em AED: tudo que foi gasto ÷ novos do mês. */
function cacPlano(p: MesPlano): number {
  return p.novos > 0 ? p.verbaAed / p.novos : 0;
}

export function CrescimentoKpi({
  users,
  custos,
  mes,
  cen,
  mesNaUrl,
}: {
  users: AppUser[];
  custos: Cost[];
  mes: string;
  cen: Cenario;
  /** O mês veio escolhido na URL (para manter ao trocar de cenário). */
  mesNaUrl: boolean;
}) {
  const hoje = mesNoPainel(new Date());
  const meses = mesesEntre(INICIO, ULTIMO_PLANO);
  const rotulos = meses.map(rotuloMes);
  const real = new Map<string, MesRealizado>();
  for (const m of meses) {
    const r = realizadoDoMes(users, custos, m);
    if (r) real.set(m, r);
  }
  const planoDe = (c: Cenario, m: string) => PLANO[c].find((p) => p.mes === m) ?? null;

  const p = planoDe(cen, mes);
  const r = realizadoDoMes(users, custos, mes);
  const ca = custoAquisicao(custos, users, mes);
  const partida = real.get('2026-10')?.ativos ?? null;

  // Gráfico de assinantes acumulados: o plano sai do ponto real de out/26.
  const seriesAtivos = CENARIOS.map((c) => ({
    key: c,
    label: CENARIO_LABEL[c],
    color: CENARIO_COR[c],
    destaque: c === cen,
    valores: meses.map((m) => (m === '2026-10' ? partida : planoDe(c, m)?.ativos ?? null)),
  }));
  const realAtivos = meses.map((m) => real.get(m)?.ativos ?? null);

  // Escala do gráfico: o cenário escolhido e o realizado cabem inteiros; os
  // outros cenários podem passar do topo (aparecem cortados, com o valor final).
  const escalaMax = Math.max(
    ...PLANO[cen].map((x) => x.ativos),
    ...realAtivos.filter((v): v is number => v != null),
  ) * 1.08;

  const novosPorMes = mesesEntre(INICIO, ULTIMO_PLANO).map((m) => ({
    label: rotuloMes(m),
    highlight: m === hoje,
    values: { plano: planoDe(cen, m)?.novos ?? 0, real: real.get(m)?.novos ?? 0 },
  }));

  const linkCen = (c: Cenario) => `/admin/crescimento?cen=${c}${mesNaUrl ? `&mes=${mes}` : ''}`;
  const ultimo = PLANO[cen][PLANO[cen].length - 1];

  return (
    <>
      <PageHeader
        title="KPI de crescimento"
        subtitle="Plano × realizado, mês a mês. O plano é a projeção de 24/10/2026 (versão 2); o realizado vem do banco e de Despesas. Verba em AED, receita em R$."
        right={<MonthFilter value={mes} />}
      />

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-ninho-cinza">Cenário do plano</span>
        {CENARIOS.map((c) => (
          <Link
            key={c}
            href={linkCen(c)}
            className={`rounded-pill border px-4 py-1.5 text-sm font-medium transition ${
              c === cen ? 'border-transparent text-white' : 'border-ninho-borda bg-white text-ninho-grafite hover:bg-ninho-roxo-suave'
            }`}
            style={c === cen ? { background: CENARIO_COR[c] } : undefined}
          >
            {CENARIO_LABEL[c]}
          </Link>
        ))}
        <span className="text-xs text-ninho-cinza">
          · se paga sozinha em <strong className="text-ninho-grafite">{SE_PAGA[cen] ? rotuloMes(SE_PAGA[cen] as string) : 'não até dez/27'}</strong>
          {' '}· {num(ultimo.ativos)} assinantes em dez/27 · bolso total {aed(ultimo.bolsoAcumAed)}
        </span>
      </div>

      <h2 className="mb-1 text-base font-bold text-ninho-grafite">{rotuloMes(mes)}: realizado × plano {CENARIO_LABEL[cen].toLowerCase()}</h2>
      <p className="mb-3 text-xs text-ninho-cinza">
        {!p
          ? mes < PRIMEIRO_PLANO
            ? 'O plano começa em nov/26; este mês mostra só o realizado.'
            : 'Mês fora do plano (nov/26 a dez/27).'
          : !r
          ? 'Mês ainda não começou: só o plano.'
          : mes === hoje
          ? 'Mês em andamento: o realizado ainda vai subir.'
          : 'Mês fechado.'}
      </p>
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <MetaCard label="Assinantes novos" unidade="pessoas" real={r?.novos ?? null} plano={p?.novos ?? null} formatar={num} />
        <MetaCard
          label="Assinantes acumulados"
          unidade="pessoas, já com churn"
          real={r?.ativos ?? null}
          plano={p?.ativos ?? null}
          formatar={num}
        />
        <MetaCard
          label="Faturamento líquido"
          unidade="R$"
          real={r?.faturamentoLiq ?? null}
          plano={p?.faturamentoLiq ?? null}
          formatar={brl0}
          nota="Caixa do mês, depois dos 15% da loja. A Apple paga no dia 1 do mês seguinte."
        />
        <MetaCard
          label="Verba investida"
          unidade="AED"
          real={r ? r.gastoMarketing : null}
          plano={p?.verbaAed ?? null}
          formatar={aed}
          nota={r ? `Marketing lançado em Despesas (≈ R$ ${num(r.gastoMarketing * BRL_POR_AED)})` : undefined}
        />
        <MetaCard
          label="Custo por assinante"
          unidade="AED"
          real={ca.total}
          plano={p ? cacPlano(p) : null}
          formatar={aed}
          menorEhMelhor
          nota={`Apple ${ca.apple != null ? aed(ca.apple) : '—'} · Meta ${ca.meta != null ? aed(ca.meta) : '—'} (melhor caso)`}
        />
      </div>

      <h2 className="mb-3 text-base font-bold text-ninho-grafite">Assinantes acumulados (já com churn)</h2>
      <div className="mb-2">
        <PlanoRealChart
          meses={meses}
          rotulos={rotulos}
          plano={seriesAtivos}
          realizado={realAtivos}
          unidade="assinantes"
          escalaMax={escalaMax}
          marcas={[
            { mes: hoje, label: 'Hoje' },
            { mes: FIM_DO_BOLSO, label: 'Fim do bolso', tracejada: true },
          ]}
        />
      </div>
      <p className="mb-8 text-xs text-ninho-cinza">
        Set e out/2026 são reais (ponto de partida). As linhas coloridas são o plano (a mais forte é o cenário escolhido); a linha escura é o
        realizado. Linha com ↑ no canto passou do topo do gráfico. Passe o mouse num ponto para ver o valor.
      </p>

      <h2 className="mb-3 text-base font-bold text-ninho-grafite">Assinantes novos por mês</h2>
      <div className="mb-8">
        <GroupedBarChart
          data={novosPorMes}
          series={[
            { key: 'plano', label: `Plano ${CENARIO_LABEL[cen].toLowerCase()}`, color: CENARIO_COR[cen] },
            { key: 'real', label: 'Realizado', color: '#2E2A3A' },
          ]}
          height={180}
        />
      </div>

      <h2 className="mb-1 text-base font-bold text-ninho-grafite">Mês a mês · plano {CENARIO_LABEL[cen].toLowerCase()}</h2>
      <p className="mb-3 text-xs text-ninho-cinza">
        Cada número tem a moeda no título da coluna. <strong>P</strong> = plano, <strong>R</strong> = realizado. A linha do fim do bolso
        (jul/27) aparece com borda.
      </p>
      <div className="mb-3 overflow-x-auto rounded-2xl border border-ninho-borda bg-white">
        <table className="w-full whitespace-nowrap text-right text-xs tabular-nums">
          <thead className="text-ninho-cinza">
            <tr className="border-b border-ninho-borda">
              <th rowSpan={2} className="px-3 py-2 text-left font-semibold">Mês</th>
              <th colSpan={2} className="px-3 py-2 text-center font-semibold">Verba (AED)</th>
              <th colSpan={3} className="px-3 py-2 text-center font-semibold">Divisão do plano (AED)</th>
              <th rowSpan={2} className="px-3 py-2 font-semibold">Instalações P</th>
              <th colSpan={2} className="px-3 py-2 text-center font-semibold">Assinantes novos</th>
              <th rowSpan={2} className="px-3 py-2 font-semibold">Novos acum. P</th>
              <th colSpan={2} className="px-3 py-2 text-center font-semibold">Acumulados c/ churn</th>
              <th colSpan={2} className="px-3 py-2 text-center font-semibold">MRR bruto (R$)</th>
              <th colSpan={2} className="px-3 py-2 text-center font-semibold">Faturamento líquido (R$)</th>
              <th rowSpan={2} className="px-3 py-2 font-semibold">Bolso acum. (AED)</th>
            </tr>
            <tr className="border-b border-ninho-borda">
              {['P', 'R', 'Apple', 'Meta', 'Criativo', 'P', 'R', 'P', 'R', 'P', 'R', 'P', 'R'].map((h, i) => (
                <th key={i} className="px-3 pb-2 font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {meses.map((m) => {
              const pl = planoDe(cen, m);
              const re = real.get(m);
              const d = (v: number | undefined, f: (n: number) => string = num) => (v == null ? '—' : f(v));
              return (
                <tr
                  key={m}
                  className={`border-b border-ninho-borda last:border-0 ${m === mes ? 'bg-ninho-roxo-suave' : ''} ${
                    m === FIM_DO_BOLSO ? 'border-t-2 border-t-ninho-roxo' : ''
                  }`}
                >
                  <td className="px-3 py-2 text-left font-semibold text-ninho-grafite">
                    {rotuloMes(m)}
                    {m === hoje && <span className="ml-1 text-[10px] font-normal text-ninho-cinza">(em andamento)</span>}
                  </td>
                  <td className="px-3 py-2">{d(pl?.verbaAed)}</td>
                  <td className="px-3 py-2 font-semibold">{d(re?.gastoMarketing)}</td>
                  <td className="px-3 py-2 text-ninho-cinza">{d(pl?.appleAed)}</td>
                  <td className="px-3 py-2 text-ninho-cinza">{d(pl?.metaAed)}</td>
                  <td className="px-3 py-2 text-ninho-cinza">{pl ? (pl.criativoAed ? num(pl.criativoAed) : '0') : '—'}</td>
                  <td className="px-3 py-2">{d(pl?.instalacoes)}</td>
                  <td className="px-3 py-2">{d(pl?.novos)}</td>
                  <td className="px-3 py-2 font-semibold">{d(re?.novos)}</td>
                  <td className="px-3 py-2">{d(pl?.novosAcum)}</td>
                  <td className="px-3 py-2">{d(pl?.ativos)}</td>
                  <td className="px-3 py-2 font-semibold">{d(re?.ativos)}</td>
                  <td className="px-3 py-2">{d(pl?.mrr)}</td>
                  <td className="px-3 py-2 font-semibold">{d(re?.mrr)}</td>
                  <td className={`px-3 py-2 ${SE_PAGA[cen] === m ? 'font-bold text-state-success' : ''}`}>{d(pl?.faturamentoLiq)}</td>
                  <td className="px-3 py-2 font-semibold">{d(re?.faturamentoLiq)}</td>
                  <td className="px-3 py-2">{d(pl?.bolsoAcumAed)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <section className="mb-8 grid gap-4 rounded-2xl border border-ninho-borda bg-white p-5 text-xs text-ninho-cinza lg:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <p className="text-sm font-bold text-ninho-grafite">Legenda</p>
          <p><strong>Verba</strong>: {aed(BOLSO_AED)} do bolso por mês até jun/27 + 100% do faturamento líquido do mês anterior. De jul/27 em diante, só o faturamento.</p>
          <p><strong>Verba realizada</strong>: marketing lançado em Despesas (Despesas é tudo em AED).</p>
          <p><strong>Criativo</strong>: 100 AED a cada 2 meses. O resto vai 63% para a Apple e 37% para a Meta.</p>
          <p><strong>Assinantes novos</strong>: primeira compra verificada no mês (fuso de Dubai). <strong>Acumulados</strong>: quem paga no fim do mês (já tira quem cancelou).</p>
          <p><strong>MRR</strong>: mensais + anuais ÷ 12, antes da loja. <strong>Faturamento líquido</strong>: o que a loja cobrou no mês (o anual entra inteiro), menos 15%.</p>
          <p><strong>Custo por assinante</strong> (AED): marketing do mês ÷ assinantes novos. Apple = confirmados pela Apple; Meta = melhor caso (divide por todos que não vieram da Apple; o real é maior).</p>
          <p>Câmbio: 1 US$ = {CAMBIO.aedPorUsd.toLocaleString('pt-BR', { maximumFractionDigits: 4 })} AED = R$ {CAMBIO.brlPorUsd.toLocaleString('pt-BR')} ({CAMBIO.data}); 1 AED = R$ {BRL_POR_AED.toFixed(2).replace('.', ',')}.</p>
        </div>
        <div className="min-w-0">
          <p className="mb-2 text-sm font-bold text-ninho-grafite">Premissas do plano</p>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-ninho-borda">
                  <th className="py-1 pr-2 font-semibold">Premissa</th>
                  {CENARIOS.map((c) => (
                    <th key={c} className="py-1 pr-2 font-semibold" style={{ color: CENARIO_COR[c] }}>{CENARIO_LABEL[c]}</th>
                  ))}
                  <th className="py-1 font-semibold">Origem</th>
                </tr>
              </thead>
              <tbody>
                {PREMISSAS.map((x) => (
                  <tr key={x.nome} className="border-b border-ninho-borda last:border-0">
                    <td className="py-1 pr-2 text-ninho-grafite">{x.nome}</td>
                    <td className="py-1 pr-2">{x.pessimista}</td>
                    <td className="py-1 pr-2">{x.base}</td>
                    <td className="py-1 pr-2">{x.otimista}</td>
                    <td className="py-1">{x.origem}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </>
  );
}
