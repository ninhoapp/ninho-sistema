import { requireRole } from '@/lib/auth/guard';
import {
  fetchTestePaywall,
  cadastrosPorDia,
  hojeSaoPaulo,
  pct,
  type Grupo,
  type ResumoGrupo,
} from '@/lib/teste-paywall';
import { PageHeader } from '@/components/admin/PageHeader';
import { StatCard } from '@/components/admin/StatCard';
import { Notice } from '@/components/admin/Notice';
import { GroupedBarChart } from '@/components/admin/GroupedBarChart';

export const dynamic = 'force-dynamic';

const DIAS_GRAFICO = 28;

const COR: Record<Grupo, string> = { A: '#9F86E0', B: '#F7A83C' };
const NOME: Record<Grupo, string> = {
  A: 'Grupo A · teste do app sem cartão',
  B: 'Grupo B · planos obrigatórios, 7 dias grátis da loja',
};

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

function CartaoGrupo({ r }: { r: ResumoGrupo }) {
  const c = r.cadastros;
  return (
    <div className="rounded-2xl border border-ninho-borda bg-white p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className="inline-block h-3 w-3 rounded-sm" style={{ background: COR[r.grupo] }} />
        <h3 className="text-sm font-bold text-ninho-grafite">{NOME[r.grupo]}</h3>
      </div>
      <Linha label="Cadastros" valor={c} />
      <Linha label="Viram a oferta" valor={r.viram_oferta} detalhe={pct(r.viram_oferta, c)} />
      <Linha
        label="Puseram o cartão (teste da loja)"
        valor={r.comecaram_teste_loja}
        detalhe={pct(r.comecaram_teste_loja, c)}
      />
      <Linha label="Em teste da loja agora" valor={r.em_teste_loja_agora} />
      <Linha
        label="Cancelaram no teste"
        valor={r.cancelaram_no_teste}
        detalhe={r.comecaram_teste_loja > 0 ? `${pct(r.cancelaram_no_teste, r.comecaram_teste_loja)} de quem pôs o cartão` : undefined}
      />
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

export default async function TestePaywallPage() {
  requireRole('admin');
  const t = await fetchTestePaywall();
  const { A, B } = t.resumo;
  const total = A.cadastros + B.cadastros;
  const hoje = hojeSaoPaulo();
  const hojeA = t.diario.find((d) => d.dia === hoje && d.grupo === 'A')?.cadastros ?? 0;
  const hojeB = t.diario.find((d) => d.dia === hoje && d.grupo === 'B')?.cadastros ?? 0;
  const serie = cadastrosPorDia(t.diario, DIAS_GRAFICO);

  const status = !t.config
    ? 'Configuração do teste não encontrada'
    : t.config.ativo
    ? `Sorteio ligado · ${Math.round(t.config.fracao_b * 100)}% das contas novas vão para o grupo B`
    : 'Sorteio desligado';

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

      {total === 0 ? (
        <div className="mb-8 rounded-2xl border border-ninho-borda bg-white p-10 text-center">
          <p className="text-base font-semibold text-ninho-grafite">Teste ainda não começou — nenhum participante</p>
          <p className="mt-1 text-sm text-ninho-cinza">
            {t.config?.ativo
              ? 'O sorteio está ligado; os números aparecem aqui assim que a primeira conta nova for sorteada.'
              : 'O sorteio está desligado. Quando for ligado, cada conta nova cai no grupo A ou B e os números aparecem aqui.'}
          </p>
        </div>
      ) : (
        <>
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Cadastros hoje · A" value={hojeA} hint={`${A.cadastros} desde o início`} compactHint />
            <StatCard label="Cadastros hoje · B" value={hojeB} hint={`${B.cadastros} desde o início`} compactHint />
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

          <h2 className="mb-3 text-base font-bold text-ninho-grafite">A × B</h2>
          <div className="mb-2 grid gap-4 lg:grid-cols-2">
            <CartaoGrupo r={A} />
            <CartaoGrupo r={B} />
          </div>
          <p className="mb-8 text-xs text-ninho-cinza">
            <strong>Pagou</strong> = compra verificada e cobrança real (no B, só depois que os 7 dias
            grátis da loja acabaram). <strong>Viram a oferta</strong> conta todo o grupo B, que já
            abre na tela de planos. Receita por cadastro aos 60 dias entra quando a primeira turma
            completar 60 dias.
          </p>

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
        Fora do sorteio (bebê ainda não nasceu): <strong>{t.foraDoSorteio}</strong>{' '}
        {t.foraDoSorteio === 1 ? 'conta' : 'contas'}. Essas pessoas vão direto para o grupo A e
        ficam fora da comparação.
      </p>
    </>
  );
}
