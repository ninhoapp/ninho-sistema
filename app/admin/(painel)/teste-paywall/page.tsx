import { requireRole } from '@/lib/auth/guard';
import {
  fetchTestePaywall,
  fetchContinuidade,
  cadastrosPorDia,
  type Continuidade,
  type FatiaContinuidade,
  hojeDubai,
  pct,
  type Grupo,
  type Liberado,
  type ResumoGrupo,
  type Taxas,
  DIA_MUDANCA,
} from '@/lib/teste-paywall';
import { PainelCartoes, TabelaLiberados, type CartaoLinha } from '@/components/admin/TabelasTestePaywall';
import { fetchUsoPorUsuario } from '@/lib/app-users';
import { PageHeader } from '@/components/admin/PageHeader';
import { StatCard } from '@/components/admin/StatCard';
import { Notice } from '@/components/admin/Notice';
import { FluxoNovoSecao, dataBR } from '@/components/admin/FluxoNovo';
import { GroupedBarChart } from '@/components/admin/GroupedBarChart';

export const dynamic = 'force-dynamic';

const DIAS_GRAFICO = 28;

const COR: Record<Grupo, string> = { A: '#9F86E0', B: '#F7A83C', C: '#4C9BE8' };
const COR_LIBERADO = '#4CAF8E';
const NOME: Record<Grupo, string> = {
  A: 'Grupo A · teste do app sem cartão',
  B: 'Grupo B · planos obrigatórios, 7 dias grátis da loja',
  C: 'Grupo C · planos com X para fechar, 7 dias grátis do app ou da loja',
};

/** fracao_b vira "3 para o A, 1 para o B" quando o rodízio é redondo
 *  (0.25, 0.5, 1); senão, a porcentagem. A ordem sai da migration 00088. */
function proporcao(fracaoB: number): string {
  if (fracaoB >= 1) return 'todas as contas novas vão para o grupo B';
  if (fracaoB <= 0) return 'todas as contas novas vão para o grupo A';
  const ciclo = 1 / fracaoB;
  if (Math.abs(ciclo - Math.round(ciclo)) < 1e-6) {
    return `${Math.round(ciclo) - 1} para o A, 1 para o B`;
  }
  return `${Math.round(fracaoB * 100)}% das contas novas vão para o grupo B`;
}

function Linha({
  label,
  valor,
  detalhe,
  destaque = false,
}: {
  label: string;
  valor: string | number;
  detalhe?: string;
  destaque?: boolean;
}) {
  return (
    <div
      className={`flex items-baseline justify-between gap-3 border-b border-ninho-borda py-2.5 last:border-b-0 ${
        destaque ? '-mx-3 rounded-xl border-b-0 bg-ninho-roxo-suave px-3' : ''
      }`}
    >
      <span className={`text-sm ${destaque ? 'font-semibold text-ninho-roxo-escuro' : 'text-ninho-grafite'}`}>
        {label}
      </span>
      <span className="text-right">
        <span className={`font-bold ${destaque ? 'text-xl text-ninho-roxo-escuro' : 'text-ninho-grafite'}`}>
          {valor}
        </span>
        {detalhe && <span className="ml-2 text-xs text-ninho-cinza">{detalhe}</span>}
      </span>
    </div>
  );
}

/** Conta oficial do teste (00090): pagaram ÷ quem já decidiu — já pagou ou
 *  o período grátis acabou. Quem ainda está nos dias grátis fica de fora
 *  (pedido do dono, 26/10/2026). Antes da 00090, cai na conta antiga. */
function conversao(r: ResumoGrupo): { valor: string; detalhe: string } {
  if (r.decididos == null) {
    return {
      valor: r.pct_pagou != null ? `${r.pct_pagou.toFixed(1)}%` : '—',
      detalhe: `${r.pagaram} de ${r.cadastros} · aplicar a migration 00090`,
    };
  }
  const aindaNoTeste = Math.max(r.cadastros - r.decididos, 0);
  return {
    valor: r.pct_pagou_decididos != null ? `${r.pct_pagou_decididos.toFixed(1)}%` : '—',
    detalhe: `${r.pagaram} de ${r.decididos} · ${aindaNoTeste} ainda no período grátis`,
  };
}

function CartaoGrupo({ r, totalSorteado }: { r: ResumoGrupo; totalSorteado: number }) {
  const c = r.cadastros;
  const cartao = r.comecaram_teste_loja;
  // Só o B passa pela tela obrigatória; no A, "sem cartão" é o fluxo normal.
  const semCartao = r.grupo !== 'A' ? Math.max(c - cartao, 0) : null;
  return (
    <div className="rounded-2xl border border-ninho-borda bg-white p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className="inline-block h-3 w-3 rounded-sm" style={{ background: COR[r.grupo] }} />
        <h3 className="text-sm font-bold text-ninho-grafite">{NOME[r.grupo]}</h3>
      </div>
      <Linha label="Cadastros" valor={c} detalhe={`${pct(c, totalSorteado)} do total sorteado`} />
      <Linha label="Viram a oferta" valor={r.viram_oferta} detalhe={pct(r.viram_oferta, c)} />
      <Linha
        label="Puseram o cartão (teste da loja)"
        valor={cartao}
        detalhe={`${pct(cartao, c)} dos cadastros`}
      />
      {semCartao != null && (
        <Linha
          label="Não puseram o cartão"
          valor={semCartao}
          detalhe={`${pct(semCartao, c)} dos cadastros`}
        />
      )}
      {r.grupo === 'B' && r.liberados > 0 && (
        <Linha
          label="Saíram sem cartão"
          valor={r.liberados}
          detalhe={`${pct(r.liberados, c)} dos cadastros · liberados pelo cron em 30 min`}
        />
      )}
      <Linha label="Em teste da loja agora" valor={r.em_teste_loja_agora} detalhe={cartao > 0 ? 'ainda nos 7 dias grátis' : undefined} />
      <Linha
        label="Cancelaram no teste"
        valor={r.cancelaram_no_teste}
        detalhe={
          cartao > 0
            ? `${pct(r.cancelaram_no_teste, cartao)} de quem pôs o cartão · ${pct(r.cancelaram_no_teste, c)} dos cadastros`
            : undefined
        }
      />
      {cartao > 0 && (
        <Linha
          label="Pagaram ÷ quem pôs o cartão"
          valor={pct(r.pagaram, cartao)}
          detalhe={`${r.pagaram} de ${cartao}${r.em_teste_loja_agora > 0 ? ` · ${r.em_teste_loja_agora} ainda nos 7 dias` : ''}`}
        />
      )}
      <Linha
        label="Pagaram ÷ período grátis encerrado"
        valor={conversao(r).valor}
        detalhe={conversao(r).detalhe}
        destaque
      />
      <Linha label="Pagantes hoje" valor={r.pagantes_hoje} detalhe="fora do teste da loja" />
      <Linha label="Convidaram cuidador" valor={r.convidaram_cuidador} detalhe={pct(r.convidaram_cuidador, c)} />
      <Linha label="Média de registros por pessoa" valor={r.media_registros != null ? r.media_registros.toFixed(1) : '—'} />
      <Linha label="Receita por cadastro aos 60 dias" valor="—" detalhe="ainda não medida" />
    </div>
  );
}

/** Terceira coluna: quem caiu no B, ficou 30 min sem cartão e foi liberado com
 *  7 dias sem cartão (migrations 00089 e 00094; antes de 02/11 eram 2h). Continua contando no B ao lado; aqui
 *  é o caminho de volta de cada um. */
function CartaoLiberados({ lista }: { lista: Liberado[] | null }) {
  if (lista == null) {
    return (
      <div className="rounded-2xl border border-dashed border-ninho-borda bg-white p-5">
        <div className="mb-3 flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-sm" style={{ background: COR_LIBERADO }} />
          <h3 className="text-sm font-bold text-ninho-grafite">B liberado · sem cartão em 30 min</h3>
        </div>
        <p className="text-sm text-ninho-cinza">
          Aparece quando a migration <strong>00089</strong> for aplicada no Supabase.
        </p>
      </div>
    );
  }
  const total = lista.length;
  const avisados = lista.filter((l) => l.avisado_em).length;
  const abriram = lista.filter((l) => l.push_aberta_em).length;
  const voltaram = lista.filter((l) => l.voltou_em).length;
  const registraram = lista.filter((l) => l.registrou_em).length;
  const assinaram = lista.filter((l) => l.assinou).length;
  return (
    <div className="rounded-2xl border border-ninho-borda bg-white p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className="inline-block h-3 w-3 rounded-sm" style={{ background: COR_LIBERADO }} />
        <h3 className="text-sm font-bold text-ninho-grafite">B liberado · sem cartão em 30 min</h3>
      </div>
      <Linha label="Liberados (7 dias sem cartão)" valor={total} detalhe="passaram para o A" />
      <Linha label="Receberam o aviso" valor={avisados} detalhe={`${pct(avisados, total)} dos liberados`} />
      <Linha label="Abriram a push" valor={abriram} detalhe={`${pct(abriram, total)} dos liberados`} />
      <Linha label="Voltaram ao app" valor={voltaram} detalhe={`${pct(voltaram, total)} dos liberados`} />
      <Linha
        label="Voltaram e fizeram 1 registro"
        valor={pct(registraram, total)}
        detalhe={`${registraram} de ${total}`}
        destaque
      />
      <Linha label="Assinaram depois" valor={assinaram} detalhe={`${pct(assinaram, total)} dos liberados`} />
    </div>
  );
}

function taxasDoResumo(r: ResumoGrupo): Taxas {
  return {
    cadastros: r.cadastros,
    decididos: r.decididos ?? r.cadastros,
    pagaram: r.pagaram,
    cartao: r.comecaram_teste_loja,
    cancelaram: r.cancelaram_no_teste,
    cartaoDecididos: 0,
    cartaoPagaram: 0,
  };
}

/** Conversão de um grupo (pagaram ÷ decididos), com o selo do momento dele. */
function CartaoConversao({
  titulo,
  selo,
  cor,
  t,
  extra,
  destaque = false,
}: {
  titulo: string;
  selo: string;
  cor: string;
  t: Taxas;
  extra: string;
  destaque?: boolean;
}) {
  const taxa = t.decididos > 0 ? (t.pagaram / t.decididos) * 100 : null;
  const ainda = Math.max(t.cadastros - t.decididos, 0);
  return (
    <div
      className={`rounded-2xl border p-4 ${
        destaque ? 'border-ninho-roxo bg-gradient-to-b from-ninho-roxo-suave to-white' : 'border-ninho-borda bg-white'
      }`}
    >
      <span
        className={`mb-2 inline-block rounded-pill px-2 py-0.5 text-[10.5px] font-bold uppercase ${
          destaque ? 'bg-ninho-roxo text-white' : 'bg-ninho-nuvem text-ninho-cinza'
        }`}
      >
        {selo}
      </span>
      <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-ninho-cinza">
        <i className="inline-block h-2 w-2 rounded-full" style={{ background: cor }} />
        {titulo}
      </div>
      <div className={`mt-1 font-extrabold tabular-nums text-ninho-roxo-escuro ${destaque ? 'text-3xl' : 'text-2xl'}`}>
        {taxa == null ? '—' : `${taxa.toFixed(1).replace('.', ',')}%`}
      </div>
      {destaque && (
        <div className="my-2 h-1.5 overflow-hidden rounded-full bg-[#EEE8FA]">
          <div className="h-full rounded-full bg-ninho-roxo" style={{ width: `${Math.min(taxa ?? 0, 100) * 10}%` }} />
        </div>
      )}
      <div className="text-xs text-ninho-cinza">
        <strong className="text-ninho-grafite">
          {t.pagaram} de {t.decididos}
        </strong>{' '}
        que já decidiram{ainda > 0 ? ` · ${ainda} ainda nos dias grátis` : ''}
      </div>
      <div className="mt-1.5 text-xs text-ninho-cinza">{extra}</div>
    </div>
  );
}

const NOME_FATIA: Record<FatiaContinuidade, string> = {
  A: 'Todos (sem tela de planos)',
  cartao: 'Puseram o cartão',
  fechou_x: 'Fecharam no X',
  sem_cartao: 'Não puseram o cartão',
  saiu_na_tela: 'Saíram na tela (sem fechar no X)',
};

/** Pergunta do dono (11/11/2026): quem cai no B ou no C e não assina sai de
 *  vez do app ou fecha a tela e continua usando? Cada grupo tem a linha do
 *  total e as fatias; o A entra como base de comparação. */
function TabelaContinuidade({ linhas }: { linhas: Continuidade[] | null }) {
  if (linhas == null) {
    return (
      <div className="rounded-2xl border border-dashed border-ninho-borda bg-white p-5 text-sm text-ninho-cinza">
        Aparece quando a migration <strong>00139</strong> (teste_paywall_continuidade) for aplicada no Supabase.
      </div>
    );
  }
  const linhasComTotal: (Continuidade & { total: boolean })[] = [];
  for (const g of ['A', 'B', 'C'] as Grupo[]) {
    const doGrupo = linhas.filter((l) => l.grupo === g);
    if (doGrupo.length === 0) continue;
    if (doGrupo.length > 1) {
      const soma = doGrupo.reduce(
        (s, l) => ({
          ...s,
          pessoas: s.pessoas + l.pessoas,
          continuaram: s.continuaram + l.continuaram,
          voltaramOutroDia: s.voltaramOutroDia + l.voltaramOutroDia,
          registrosDepois: s.registrosDepois + l.registrosDepois,
          diasDepois: s.diasDepois + l.diasDepois,
          pagaram: s.pagaram + l.pagaram,
        }),
        { grupo: g, fatia: 'A' as FatiaContinuidade, pessoas: 0, continuaram: 0, voltaramOutroDia: 0, registrosDepois: 0, diasDepois: 0, pagaram: 0 },
      );
      linhasComTotal.push({ ...soma, total: true });
    }
    for (const l of doGrupo) linhasComTotal.push({ ...l, total: doGrupo.length === 1 });
  }
  const media = (soma: number, base: number) => (base > 0 ? (soma / base).toFixed(1) : '—');
  return (
    <div className="overflow-x-auto rounded-2xl border border-ninho-borda bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-ninho-borda text-left text-xs text-ninho-cinza">
            <th className="px-4 py-3 font-semibold">Grupo</th>
            <th className="px-4 py-3 text-right font-semibold">Pessoas</th>
            <th className="px-4 py-3 text-right font-semibold">Continuaram usando</th>
            <th className="px-4 py-3 text-right font-semibold">Sumiram de vez</th>
            <th className="px-4 py-3 text-right font-semibold">Voltaram em outro dia</th>
            <th className="px-4 py-3 text-right font-semibold">Registros depois (média)</th>
            <th className="px-4 py-3 text-right font-semibold">Dias de uso depois (média)</th>
            <th className="px-4 py-3 text-right font-semibold">Pagaram</th>
          </tr>
        </thead>
        <tbody>
          {linhasComTotal.map((l) => {
            const sumiram = l.pessoas - l.continuaram;
            return (
              <tr
                key={`${l.grupo}|${l.total ? 'total' : l.fatia}`}
                className={`border-b border-ninho-borda last:border-b-0 ${l.total ? 'bg-ninho-nuvem/60 font-semibold' : ''}`}
              >
                <td className="px-4 py-2.5">
                  <span className="inline-flex items-center gap-2">
                    {l.total && <span className="inline-block h-3 w-3 rounded-sm" style={{ background: COR[l.grupo] }} />}
                    <span className={l.total ? 'text-ninho-grafite' : 'pl-5 text-ninho-grafite'}>
                      {l.total ? `Grupo ${l.grupo}${l.grupo === 'A' ? ' · sem tela de planos' : ' · total'}` : NOME_FATIA[l.fatia]}
                    </span>
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right">{l.pessoas}</td>
                <td className="px-4 py-2.5 text-right">
                  {pct(l.continuaram, l.pessoas)} <span className="text-xs text-ninho-cinza">({l.continuaram})</span>
                </td>
                <td className={`px-4 py-2.5 text-right ${l.pessoas > 0 && sumiram / l.pessoas >= 0.5 ? 'text-state-danger' : ''}`}>
                  {pct(sumiram, l.pessoas)} <span className="text-xs text-ninho-cinza">({sumiram})</span>
                </td>
                <td className="px-4 py-2.5 text-right">{pct(l.voltaramOutroDia, l.pessoas)}</td>
                <td className="px-4 py-2.5 text-right">{media(l.registrosDepois, l.pessoas)}</td>
                <td className="px-4 py-2.5 text-right">{media(l.diasDepois, l.pessoas)}</td>
                <td className="px-4 py-2.5 text-right">{l.pagaram}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default async function TestePaywallPage() {
  await requireRole('admin');
  const [t, continuidade, uso] = await Promise.all([fetchTestePaywall(), fetchContinuidade(), fetchUsoPorUsuario()]);
  const { A, B, C } = t.resumo;
  const total = A.cadastros + B.cadastros + C.cadastros;
  const hoje = hojeDubai();
  const hojeA = t.diario.find((d) => d.dia === hoje && d.grupo === 'A')?.cadastros ?? 0;
  const hojeB = t.diario.find((d) => d.dia === hoje && d.grupo === 'B')?.cadastros ?? 0;
  const hojeC = t.diario.find((d) => d.dia === hoje && d.grupo === 'C')?.cadastros ?? 0;
  const serie = cadastrosPorDia(t.diario, DIAS_GRAFICO);

  const status = !t.config
    ? 'Configuração do teste não encontrada'
    : t.config.ativo
    ? t.config.modo === 'C'
      ? `Todo iPhone novo no C desde ${dataBR(DIA_MUDANCA)} · Android no A`
      : `Rodízio ligado · ${t.config.modo === 'AC' ? '1 para o A, 1 para o C (B fora desde 12/11)' : t.config.modo === 'ABC' ? '1 para cada grupo (A, B, C)' : proporcao(t.config.fracao_b)}`
    : 'Rodízio desligado';
  // Quem entrou antes da 00088 foi pelo sorteio aleatório (1 em 3 para o B),
  // não pelo rodízio: sem este aviso, "3 para o A, 1 para o B" no selo e
  // 1 A × 3 B nos números pareciam erro.
  const antesDoRodizio = t.config ? Math.max(0, total - t.config.sorteios) : 0;

  const f = t.fluxoNovo;
  const cAtual = f.cSemSorteio;
  const aAgora = f.depois.grupos.A?.cadastros ?? 0;
  const linhasCartao: CartaoLinha[] = t.cartoes.map((c) => {
    const u = uso.get(c.profile_id);
    return { ...c, diasUso: Math.max(u?.diasAbertura ?? 0, u?.diasRegistro ?? 0) };
  });

  return (
    <>
      <PageHeader
        title="Paywall e cartões"
        subtitle="Quem pôs o cartão, quem cancelou, quando cada um vai ser cobrado e a conversão de verdade do fluxo atual."
        right={
          <span
            className={`inline-block rounded-full px-3 py-1.5 text-xs font-semibold ${
              t.config?.ativo ? 'bg-state-success/15 text-state-success' : 'bg-ninho-borda text-ninho-cinza'
            }`}
          >
            {status}
          </span>
        }
      />

      <div className="mb-8">
        <PainelCartoes lista={linhasCartao} corte={f.corte} cadastrosAtual={cAtual.cadastros} />
      </div>

      <h2 className="mb-1 text-base font-bold text-ninho-grafite">Conversão real · pagaram ÷ quem já decidiu</h2>
      <p className="mb-3 text-xs text-ninho-cinza">
        Decidiu = pagou ou o período grátis acabou. Quem ainda está nos dias grátis fica de fora, senão a taxa parece
        menor do que é.
      </p>
      <div className="mb-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <CartaoConversao
          destaque
          selo="Vale daqui para frente"
          cor={COR.C}
          titulo={`C atual · desde ${dataBR(DIA_MUDANCA)}`}
          t={cAtual}
          extra={`${cAtual.cadastros} cadastros · ${cAtual.cartao} puseram o cartão (${pct(cAtual.cartao, cAtual.cadastros)}) · ${cAtual.cancelaram} cancelaram`}
        />
        <CartaoConversao
          selo="Antes"
          cor={COR.C}
          titulo="C no sorteio"
          t={taxasDoResumo(C)}
          extra={`${C.cadastros} cadastros · ${C.comecaram_teste_loja} puseram o cartão · ${C.cancelaram_no_teste} cancelaram`}
        />
        <CartaoConversao
          selo="Encerrado"
          cor={COR.B}
          titulo="B · cartão obrigatório"
          t={taxasDoResumo(B)}
          extra={`${B.cadastros} cadastros · ${B.comecaram_teste_loja} puseram o cartão · ${B.cancelaram_no_teste} cancelaram (${pct(B.cancelaram_no_teste, B.comecaram_teste_loja)})`}
        />
        <CartaoConversao
          selo="Antes"
          cor={COR.A}
          titulo="A · sem cartão"
          t={taxasDoResumo(A)}
          extra={`${A.cadastros} cadastros · agora só Android: ${aAgora} ${aAgora === 1 ? 'cadastro' : 'cadastros'} desde ${dataBR(DIA_MUDANCA)}`}
        />
      </div>
      <Notice tone="info">
        Desde {dataBR(DIA_MUDANCA)} todo iPhone novo vai para o C, inclusive quem está grávida. O A ficou só para
        Android, porque o Google Play não tem os 7 dias grátis da loja. A conversão da Visão geral junta todo mundo desde
        o começo; a do <strong>C atual</strong> é a do fluxo que está no ar e fica mais firme conforme quem está nos dias
        grátis decidir.
      </Notice>

      <details className="mb-8 mt-8 rounded-2xl border border-dashed border-ninho-borda bg-white px-5">
        <summary className="cursor-pointer py-4 text-sm font-bold text-ninho-grafite">
          Histórico do teste A × B × C{' '}
          <span className="font-normal text-ninho-cinza">
            · guardado, clique para abrir (números por grupo, antes × depois, quem saiu do app depois da tela, liberados
            do B, cadastros por dia)
          </span>
        </summary>
        <div className="pb-6">
      <Notice tone="warn">
        <strong>Pôr o cartão não é pagar.</strong> No grupo B, quem começa os 7 dias grátis da loja
        ainda pode cancelar antes da primeira cobrança. A métrica que decide o teste é{' '}
        <strong>pagaram ÷ quem já saiu do período grátis</strong> (quem ainda está nos dias grátis não
        entra na conta; depois, a receita por cadastro aos 60 dias) — nunca &ldquo;puseram o
        cartão&rdquo;.
      </Notice>

      {total > 0 && <FluxoNovoSecao f={t.fluxoNovo} />}

      {antesDoRodizio > 0 && (
        <Notice tone="info">
          <strong>
            {antesDoRodizio === total ? 'Todas as' : 'As primeiras'} {antesDoRodizio}{' '}
            {antesDoRodizio === 1 ? 'conta entrou' : 'contas entraram'} pelo sorteio antigo
          </strong>
          , antes de o rodízio ser ligado (era aleatório, 1 chance em 3 de cair no B). Por isso a
          divisão ainda não é {t.config ? proporcao(t.config.fracao_b) : 'a do rodízio'}. Pelo rodízio:{' '}
          <strong>{t.config?.sorteios ?? 0}</strong> {t.config?.sorteios === 1 ? 'conta' : 'contas'}.
          Dias contados no fuso de Dubai.
        </Notice>
      )}

      {total === 0 ? (
        <div className="mb-8 rounded-2xl border border-ninho-borda bg-white p-10 text-center">
          <p className="text-base font-semibold text-ninho-grafite">Teste ainda não começou — nenhum participante</p>
          <p className="mt-1 text-sm text-ninho-cinza">
            {t.config?.ativo
              ? 'O rodízio está ligado; os números aparecem aqui assim que a primeira conta nova entrar no teste.'
              : 'O rodízio está desligado. Quando for ligado, cada conta nova cai no grupo A ou B e os números aparecem aqui.'}
          </p>
        </div>
      ) : (
        <>
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Cadastros hoje · A" value={hojeA} hint={`${A.cadastros} desde o início`} compactHint />
            <StatCard
              label="Cadastros hoje · B"
              value={hojeB}
              hint={`${B.cadastros} desde o início · ${pct(B.cadastros, total)} do total`}
              compactHint
            />
            <StatCard
              label="Conversão · A"
              value={conversao(A).valor}
              hint={conversao(A).detalhe}
              compactHint
              accent
            />
            <StatCard
              label="Conversão · B"
              value={conversao(B).valor}
              hint={conversao(B).detalhe}
              compactHint
              accent
            />
            <StatCard
              label="Cadastros hoje · C"
              value={hojeC}
              hint={`${C.cadastros} desde o início · ${pct(C.cadastros, total)} do total`}
              compactHint
            />
            <StatCard
              label="Conversão · C"
              value={conversao(C).valor}
              hint={conversao(C).detalhe}
              compactHint
              accent
            />
          </div>

          <h2 className="mb-3 text-base font-bold text-ninho-grafite">A × B × C × B liberado</h2>
          <div className="mb-2 grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
            <CartaoGrupo r={A} totalSorteado={total} />
            <CartaoGrupo r={B} totalSorteado={total} />
            <CartaoGrupo r={C} totalSorteado={total} />
            <CartaoLiberados lista={t.liberados} />
          </div>
          <p className="mb-8 text-xs text-ninho-cinza">
            <strong>Conversão</strong> = pagaram ÷ quem já decidiu: já pagou ou o período grátis acabou
            (no B com cartão, 1 dia depois dos 7 dias da loja, tempo de a renovação chegar; quem ainda
            está nos 30 min antes da liberação não conta). <strong>Pagou</strong> = compra verificada e cobrança real (no B, só depois que os 7 dias
            grátis da loja acabaram). <strong>Viram a oferta</strong> conta todo o grupo B, que já
            abre na tela de planos. <strong>B liberado</strong>: quem ficou 30 min no B sem pôr o cartão (2h até 02/11)
            ganha 7 dias sem cartão e passa para o fluxo do A; continua contando no B, e aqui aparece
            se voltou ao app (qualquer abertura depois da liberação) e se fez pelo menos 1 registro.
            <strong>Grupo C</strong>: vê a tela de planos no fim do onboarding (anual e mensal, 7 dias
            grátis da loja com cartão) com um X para fechar; quem fecha segue com os 7 dias do app, como o A.
            Rodízio 1 para cada desde 05/11/2026. Receita por cadastro aos 60 dias entra quando a primeira turma completar 60 dias.
          </p>

          <h2 className="mb-1 text-base font-bold text-ninho-grafite">
            Depois da tela de planos: sai do app ou continua usando?
          </h2>
          <p className="mb-3 text-xs text-ninho-cinza">
            <strong>Continuaram usando</strong> = abriram o app mais de 1h depois da tela ou registraram
            alguma coisa depois dela. <strong>Sumiram de vez</strong> = nem uma coisa nem outra.{' '}
            <strong>Voltaram em outro dia</strong> = abriram ou registraram 24h ou mais depois. Só entra
            quem passou pela tela há mais de 24h (quem chegou hoje ainda não teve tempo de voltar). No A
            não há tela: conta a partir do fim do onboarding, para comparar.
          </p>
          <div className="mb-8">
            <TabelaContinuidade linhas={continuidade} />
          </div>

          {t.liberados != null && (
            <>
              <h2 className="mb-1 text-base font-bold text-ninho-grafite">Quem foi liberado</h2>
              <p className="mb-3 text-xs text-ninho-cinza">
                Horários no fuso de Dubai. O aviso (push, sininho e e-mail) só sai das 5h à meia-noite no
                horário da pessoa.
              </p>
              <div className="mb-8">
                <TabelaLiberados lista={t.liberados} />
              </div>
            </>
          )}

          <h2 className="mb-1 text-base font-bold text-ninho-grafite">Novos usuários por dia, por grupo</h2>
          <p className="mb-3 text-xs text-ninho-cinza">
            Últimos {DIAS_GRAFICO} dias. O dia segue o fuso de São Paulo (como a view do banco); hoje
            fica tracejado porque ainda está em andamento.
          </p>
          <div className="mb-8">
            <GroupedBarChart
              data={serie.map((p) => ({ label: p.label, values: { A: p.A, B: p.B, C: p.C }, highlight: p.hoje }))}
              series={[
                { key: 'A', label: 'Grupo A', color: COR.A },
                { key: 'B', label: 'Grupo B', color: COR.B },
                { key: 'C', label: 'Grupo C', color: COR.C },
              ]}
            />
          </div>
        </>
      )}

      <p className="text-xs text-ninho-cinza">
        Fora do rodízio (bebê ainda não nasceu): <strong>{t.foraDoSorteio}</strong>{' '}
        {t.foraDoSorteio === 1 ? 'conta' : 'contas'}. Essas pessoas vão direto para o grupo A e
        ficam fora da comparação.
      </p>
        </div>
      </details>
    </>
  );
}
