import { requireRole } from '@/lib/auth/guard';
import {
  fetchTestePaywall,
  cadastrosPorDia,
  hojeDubai,
  pct,
  type Grupo,
  type Liberado,
  type ResumoGrupo,
} from '@/lib/teste-paywall';
import { brl } from '@/lib/precos';
import { valorCartao } from '@/lib/teste-paywall-formato';
import { TabelaCartoes, TabelaLiberados } from '@/components/admin/TabelasTestePaywall';
import { PageHeader } from '@/components/admin/PageHeader';
import { StatCard } from '@/components/admin/StatCard';
import { Notice } from '@/components/admin/Notice';
import { GroupedBarChart } from '@/components/admin/GroupedBarChart';

export const dynamic = 'force-dynamic';

const DIAS_GRAFICO = 28;

const COR: Record<Grupo, string> = { A: '#9F86E0', B: '#F7A83C' };
const COR_LIBERADO = '#4CAF8E';
const NOME: Record<Grupo, string> = {
  A: 'Grupo A · teste do app sem cartão',
  B: 'Grupo B · planos obrigatórios, 7 dias grátis da loja',
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

function CartaoGrupo({ r, totalSorteado }: { r: ResumoGrupo; totalSorteado: number }) {
  const c = r.cadastros;
  const cartao = r.comecaram_teste_loja;
  // Só o B passa pela tela obrigatória; no A, "sem cartão" é o fluxo normal.
  const semCartao = r.grupo === 'B' ? Math.max(c - cartao, 0) : null;
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
        label="Pagaram ÷ cadastros"
        valor={r.pct_pagou != null ? `${r.pct_pagou.toFixed(1)}%` : '—'}
        detalhe={`${r.pagaram} de ${c}`}
        destaque
      />
      <Linha label="Pagantes hoje" valor={r.pagantes_hoje} detalhe="fora do teste da loja" />
      <Linha label="Convidaram cuidador" valor={r.convidaram_cuidador} detalhe={pct(r.convidaram_cuidador, c)} />
      <Linha label="Média de registros por pessoa" valor={r.media_registros != null ? r.media_registros.toFixed(1) : '—'} />
      <Linha label="Receita por cadastro aos 60 dias" valor="—" detalhe="ainda não medida" />
    </div>
  );
}

/** Terceira coluna: quem caiu no B, ficou 2h sem cartão e foi liberado com
 *  7 dias sem cartão (migration 00089). Continua contando no B ao lado; aqui
 *  é o caminho de volta de cada um. */
function CartaoLiberados({ lista }: { lista: Liberado[] | null }) {
  if (lista == null) {
    return (
      <div className="rounded-2xl border border-dashed border-ninho-borda bg-white p-5">
        <div className="mb-3 flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-sm" style={{ background: COR_LIBERADO }} />
          <h3 className="text-sm font-bold text-ninho-grafite">B liberado · sem cartão em 2h</h3>
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
        <h3 className="text-sm font-bold text-ninho-grafite">B liberado · sem cartão em 2h</h3>
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

export default async function TestePaywallPage() {
  requireRole('admin');
  const t = await fetchTestePaywall();
  const { A, B } = t.resumo;
  const total = A.cadastros + B.cadastros;
  const hoje = hojeDubai();
  const hojeA = t.diario.find((d) => d.dia === hoje && d.grupo === 'A')?.cadastros ?? 0;
  const hojeB = t.diario.find((d) => d.dia === hoje && d.grupo === 'B')?.cadastros ?? 0;
  const serie = cadastrosPorDia(t.diario, DIAS_GRAFICO);

  const status = !t.config
    ? 'Configuração do teste não encontrada'
    : t.config.ativo
    ? `Rodízio ligado · ${proporcao(t.config.fracao_b)}`
    : 'Rodízio desligado';
  // Quem entrou antes da 00088 foi pelo sorteio aleatório (1 em 3 para o B),
  // não pelo rodízio: sem este aviso, "3 para o A, 1 para o B" no selo e
  // 1 A × 3 B nos números pareciam erro.
  const antesDoRodizio = t.config ? Math.max(0, total - t.config.sorteios) : 0;

  return (
    <>
      <PageHeader
        title="Teste de paywall"
        subtitle="Grupo A (7 dias de teste do app, sem cartão) lado a lado com o grupo B (tela de planos obrigatória, 7 dias grátis da loja com cartão)."
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

      <Notice tone="warn">
        <strong>Pôr o cartão não é pagar.</strong> No grupo B, quem começa os 7 dias grátis da loja
        ainda pode cancelar antes da primeira cobrança. A métrica que decide o teste é{' '}
        <strong>pagaram ÷ cadastros</strong> (e, depois, a receita por cadastro aos 60 dias) — nunca
        &ldquo;puseram o cartão&rdquo;.
      </Notice>

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
              label="Pagaram ÷ cadastros · A"
              value={A.pct_pagou != null ? `${A.pct_pagou.toFixed(1)}%` : '—'}
              hint={`${A.pagaram} de ${A.cadastros}`}
              compactHint
              accent
            />
            <StatCard
              label="Pagaram ÷ cadastros · B"
              value={B.pct_pagou != null ? `${B.pct_pagou.toFixed(1)}%` : '—'}
              hint={`${B.pagaram} de ${B.cadastros}`}
              compactHint
              accent
            />
          </div>

          <h2 className="mb-3 text-base font-bold text-ninho-grafite">A × B × B liberado</h2>
          <div className="mb-2 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            <CartaoGrupo r={A} totalSorteado={total} />
            <CartaoGrupo r={B} totalSorteado={total} />
            <CartaoLiberados lista={t.liberados} />
          </div>
          <p className="mb-8 text-xs text-ninho-cinza">
            <strong>Pagou</strong> = compra verificada e cobrança real (no B, só depois que os 7 dias
            grátis da loja acabaram). <strong>Viram a oferta</strong> conta todo o grupo B, que já
            abre na tela de planos. <strong>B liberado</strong>: quem ficou 2h no B sem pôr o cartão
            ganha 7 dias sem cartão e passa para o fluxo do A; continua contando no B, e aqui aparece
            se voltou ao app (qualquer abertura depois da liberação) e se fez pelo menos 1 registro.
            Receita por cadastro aos 60 dias entra quando a primeira turma completar 60 dias.
          </p>

          <h2 className="mb-1 text-base font-bold text-ninho-grafite">Quem pôs o cartão</h2>
          <p className="mb-3 text-xs text-ninho-cinza">
            Horários no fuso de Dubai. A loja tenta a 1ª cobrança no fim dos 7 dias grátis.{' '}
            {(() => {
              const previsto = t.cartoes.reduce((s, c) => s + valorCartao(c).valor, 0);
              const aCobrar = t.cartoes.filter((c) => valorCartao(c).valor > 0).length;
              return (
                <>
                  <strong>{brl(previsto)}</strong> previstos de {aCobrar}{' '}
                  {aCobrar === 1 ? 'pessoa' : 'pessoas'} que ainda não cancelaram (valor de tabela, antes da
                  taxa da loja). Lançamentos em vermelho = ainda não registrou nada.
                </>
              );
            })()}
          </p>
          <div className="mb-8">
            <TabelaCartoes lista={t.cartoes} />
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
              data={serie.map((p) => ({ label: p.label, values: { A: p.A, B: p.B }, highlight: p.hoje }))}
              series={[
                { key: 'A', label: 'Grupo A', color: COR.A },
                { key: 'B', label: 'Grupo B', color: COR.B },
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
    </>
  );
}
