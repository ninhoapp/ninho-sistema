'use client';

import { useMemo, useState } from 'react';
import type { Cartao, Liberado } from '@/lib/teste-paywall';
import {
  cartaoEm,
  diasAte,
  quandoDubai,
  situacao,
  SITUACAO_LABEL,
  valorCartao,
  type Situacao,
} from '@/lib/teste-paywall-formato';
import { ORIGEM_LABEL, ORIGENS } from '@/lib/origem';
import { brl, PLANO_LABEL } from '@/lib/precos';
import { TESTE_STYLE } from '@/components/admin/GrupoTesteEstilo';
import { OrigemPill, TabelaPessoas, type Coluna } from '@/components/admin/TabelaPessoas';

/** Linha da tabela de cartões: o cartão mais os dias de uso (de Usuários ativos). */
export type CartaoLinha = Cartao & { diasUso: number };

const SIT_ESTILO: Record<Situacao, string> = {
  gratis: 'bg-ninho-roxo-suave text-ninho-roxo-escuro',
  cobrando: 'bg-ninho-roxo-suave text-ninho-roxo-escuro',
  pago: 'bg-[#E3F4EA] text-[#2E8A55]',
  cancelou: 'bg-[#FDECEC] text-[#C24343]',
  recusado: 'bg-[#FFF1DD] text-[#9A5B1E]',
};

/** Dias até a 1ª cobrança; só para quem ainda está nos dias grátis. */
function falta(c: Cartao): number | null {
  return situacao(c) === 'gratis' ? diasAte(c.cobranca_em) : null;
}

function faltaTexto(c: Cartao): string {
  const d = falta(c);
  if (d == null) return '—';
  return d <= 0 ? 'hoje' : d === 1 ? 'amanhã' : `${d} dias`;
}

const COLUNAS_CARTAO: Coluna<CartaoLinha>[] = [
  { key: 'nome', label: 'Nome', largura: 160, valor: (c) => c.nome ?? 'sem nome', className: 'font-medium text-ninho-grafite' },
  {
    key: 'grupo', label: 'Grupo', largura: 95,
    valor: (c) => c.grupo ?? '—',
    render: (c) =>
      c.grupo ? (
        <span className={`inline-block rounded-pill px-2 py-0.5 text-xs font-semibold ${TESTE_STYLE[c.grupo]}`}>{c.grupo}</span>
      ) : (
        <span className="text-ninho-cinza">—</span>
      ),
    title: (c) => (c.grupo ? `${c.grupo}: ${c.sorteado ? 'caiu neste grupo no sorteio' : 'entrou neste grupo sem sorteio'}` : undefined),
  },
  { key: 'cartao', label: 'Pôs o cartão', largura: 120, valor: (c) => quandoDubai(cartaoEm(c)), ordem: (c) => cartaoEm(c) },
  {
    key: 'situacao', label: 'Situação', largura: 190,
    valor: (c) => SITUACAO_LABEL[situacao(c)],
    render: (c) => (
      <span className={`whitespace-nowrap rounded-pill px-2.5 py-1 text-[11px] font-semibold ${SIT_ESTILO[situacao(c)]}`}>
        {SITUACAO_LABEL[situacao(c)]}
      </span>
    ),
  },
  {
    key: 'cobranca', label: 'Cobrança', largura: 120,
    valor: (c) => quandoDubai(c.cobranca_em), ordem: (c) => c.cobranca_em,
    title: (c) => (situacao(c) === 'cancelou' ? 'Desligou a renovação: não vai ser cobrado' : undefined),
    className: (c) => (situacao(c) === 'cancelou' ? 'text-ninho-cinza line-through' : ''),
  },
  {
    key: 'falta', label: 'Falta', largura: 90, numerica: true,
    valor: faltaTexto, ordem: falta,
    className: (c) => {
      const d = falta(c);
      return d != null && d <= 2 ? 'font-semibold text-ninho-roxo-escuro' : '';
    },
  },
  { key: 'plano', label: 'Plano', largura: 140, valor: (c) => (c.plano ? `${PLANO_LABEL[c.plano]} ${c.ciclo ?? ''}`.trim() : '—') },
  {
    key: 'valor', label: 'Valor', largura: 150,
    valor: (c) => valorCartao(c).texto,
    ordem: (c) => valorCartao(c).valor,
    className: (c) => (c.renova === false && !c.pagou ? 'text-ninho-cinza' : ''),
  },
  {
    key: 'registros', label: 'Lançamentos', largura: 135, numerica: true,
    valor: (c) => String(c.registros), ordem: (c) => c.registros,
    className: (c) => (c.registros === 0 ? 'font-semibold text-state-danger' : ''),
  },
  {
    key: 'dias', label: 'Dias de uso', largura: 110, numerica: true,
    valor: (c) => String(c.diasUso), ordem: (c) => c.diasUso,
    title: () => 'Dias diferentes em que abriu o app ou registrou algo (o mesmo de Usuários ativos)',
  },
  {
    key: 'origem', label: 'Origem', largura: 185,
    valor: (c) => ORIGEM_LABEL[c.origem],
    ordem: (c) => ORIGENS.indexOf(c.origem),
    render: (c) => <OrigemPill origem={c.origem} />,
  },
];

const CARTOES: { k: Situacao | null; label: string; cor: string }[] = [
  { k: null, label: 'Puseram o cartão', cor: '#9F86E0' },
  { k: 'gratis', label: 'Nos 7 dias grátis agora', cor: '#7C5CD6' },
  { k: 'cancelou', label: 'Cancelaram antes de pagar', cor: '#E85D5D' },
  { k: 'pago', label: 'Pagaram', cor: '#4CAF74' },
  { k: 'recusado', label: 'Cartão recusado', cor: '#E8A33C' },
];

const CHIPS: (Situacao | null)[] = [null, 'gratis', 'cobrando', 'pago', 'cancelou', 'recusado'];

/**
 * Topo da tela de paywall (pedido do dono, 25/11/2026): cartões com quem pôs
 * o cartão, cancelou, pagou e foi recusado, e a tabela de cada pessoa. Abre
 * no fluxo atual (cartão depois do corte de 14/11) com o cartão mais recente
 * em cima; clicar num cartão ou num chip filtra a tabela.
 */
export function PainelCartoes({
  lista,
  corte,
  cadastrosAtual,
}: {
  lista: CartaoLinha[];
  /** Hora (ISO) em que todo iPhone novo passou para o C. */
  corte: string;
  /** Cadastros do fluxo atual, para "x% dos cadastros". */
  cadastrosAtual: number;
}) {
  const [periodo, setPeriodo] = useState<'atual' | 'tudo'>('atual');
  const [filtro, setFiltro] = useState<Situacao | null>(null);
  const [proxima, setProxima] = useState(false);

  const base = useMemo(() => {
    const t = new Date(corte).getTime();
    return periodo === 'tudo' ? lista : lista.filter((c) => new Date(cartaoEm(c) ?? 0).getTime() > t);
  }, [lista, periodo, corte]);

  const conta = (s: Situacao) => base.filter((c) => situacao(c) === s).length;
  const decididos = base.filter((c) => situacao(c) !== 'gratis').length;
  const previsto = base.filter((c) => situacao(c) === 'gratis').reduce((s, c) => s + valorCartao(c).valor, 0);
  const pct = (a: number, b: number) => (b > 0 ? `${Math.round((a / b) * 100)}%` : '—');

  const detalhe: Record<string, string> = {
    todos: periodo === 'atual' ? `${cadastrosAtual > 0 ? ((base.length / cadastrosAtual) * 100).toFixed(1).replace('.', ',') : '—'}% dos ${cadastrosAtual} cadastros` : 'desde o começo do teste',
    gratis: `${brl(previsto)} previstos na 1ª cobrança`,
    cancelou: `${pct(conta('cancelou'), base.length)} de quem pôs o cartão`,
    pago: `${pct(conta('pago'), decididos)} de quem já decidiu (${conta('pago')} de ${decididos})`,
    recusado: 'a loja segue tentando cobrar',
  };

  // Ordem pronta antes da tabela: cartão mais recente em cima, ou a cobrança
  // mais próxima (quem já saiu dos dias grátis vai para o fim).
  const linhas = useMemo(() => {
    const r = base.filter((c) => !filtro || situacao(c) === filtro);
    if (proxima) {
      return r.sort((a, b) => (falta(a) ?? 9999) - (falta(b) ?? 9999) || (a.cobranca_em ?? '').localeCompare(b.cobranca_em ?? ''));
    }
    return r.sort((a, b) => (cartaoEm(b) ?? '').localeCompare(cartaoEm(a) ?? ''));
  }, [base, filtro, proxima]);

  const pilula = (ativo: boolean) =>
    `rounded-pill px-3.5 py-1.5 text-xs font-medium transition ${ativo ? 'bg-ninho-roxo text-white' : 'text-ninho-cinza hover:text-ninho-grafite'}`;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-bold text-ninho-grafite">Cartões</h2>
        <div className="inline-flex rounded-pill border border-ninho-borda bg-white p-0.5">
          <button type="button" className={pilula(periodo === 'atual')} onClick={() => setPeriodo('atual')}>
            Fluxo atual · desde {quandoDubai(corte).slice(0, 5)}
          </button>
          <button type="button" className={pilula(periodo === 'tudo')} onClick={() => setPeriodo('tudo')}>
            Tudo
          </button>
        </div>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {CARTOES.map(({ k, label, cor }) => (
          <button
            key={label}
            type="button"
            onClick={() => setFiltro(k)}
            className={`rounded-2xl border bg-white p-4 text-left transition hover:border-ninho-roxo ${
              filtro === k ? 'border-ninho-roxo ring-2 ring-inset ring-ninho-roxo' : 'border-ninho-borda'
            }`}
          >
            <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-ninho-cinza">
              <i className="inline-block h-2 w-2 rounded-full" style={{ background: cor }} />
              {label}
            </span>
            <span className="mt-1 block text-3xl font-extrabold tabular-nums text-ninho-roxo-escuro">
              {k ? conta(k) : base.length}
            </span>
            <span className="block text-xs text-ninho-cinza">{detalhe[k ?? 'todos']}</span>
          </button>
        ))}
      </div>

      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-bold text-ninho-grafite">Quem pôs o cartão</h2>
        <button
          type="button"
          onClick={() => setProxima((v) => !v)}
          className={`rounded-pill border px-3.5 py-1.5 text-xs font-semibold transition ${
            proxima
              ? 'border-ninho-roxo bg-ninho-roxo-suave text-ninho-roxo-escuro'
              : 'border-ninho-borda bg-white text-ninho-roxo-escuro hover:border-ninho-roxo'
          }`}
        >
          {proxima ? '✓ ' : ''}Cobrança mais próxima primeiro
        </button>
      </div>
      <p className="mb-3 text-xs text-ninho-cinza">
        Abre com quem pôs o cartão mais recente em cima. Toda coluna ordena (clique no título) e filtra (▾). Horários no
        fuso de Dubai; o cartão entra 7 dias antes da 1ª cobrança. Lançamentos em vermelho = ainda não registrou nada.
      </p>
      <div className="mb-2 flex flex-wrap gap-1.5">
        {CHIPS.filter((k) => k !== 'cobrando' || conta('cobrando') > 0).map((k) => (
          <button
            key={k ?? 'todos'}
            type="button"
            onClick={() => setFiltro(k)}
            className={`rounded-pill border px-3 py-1 text-xs transition ${
              filtro === k
                ? 'border-ninho-roxo-escuro bg-ninho-roxo-escuro text-white'
                : 'border-ninho-borda bg-white text-ninho-grafite hover:border-ninho-roxo'
            }`}
          >
            {k ? SITUACAO_LABEL[k] : 'Todos'} <strong className="tabular-nums">{k ? conta(k) : base.length}</strong>
          </button>
        ))}
      </div>
      <TabelaPessoas
        key={`${periodo}|${filtro}|${proxima}`}
        rows={linhas}
        colunas={COLUNAS_CARTAO}
        getId={(c) => c.profile_id}
        vazio={periodo === 'atual' ? 'Ninguém pôs o cartão no fluxo atual ainda.' : 'Ninguém pôs o cartão ainda.'}
        busca={(c) => `${c.nome ?? ''} ${ORIGEM_LABEL[c.origem]}`}
        placeholderBusca="Buscar nome ou origem..."
        excel={{ arquivo: 'ninho-cartoes', aba: 'Cartões' }}
        rodape={(f) => (
          <tr className="border-t-2 border-ninho-borda bg-ninho-nuvem">
            <td colSpan={COLUNAS_CARTAO.length} className="p-3 text-xs text-ninho-cinza">
              Ainda vão ser cobrados:{' '}
              <strong className="text-ninho-roxo-escuro">
                {brl(f.filter((c) => situacao(c) === 'gratis').reduce((s, c) => s + valorCartao(c).valor, 0))}
              </strong>{' '}
              (preço de tabela, antes da taxa da loja)
            </td>
          </tr>
        )}
      />
    </div>
  );
}

const COLUNAS_LIBERADO: Coluna<Liberado>[] = [
  {
    key: 'nome', label: 'Pessoa', largura: 150,
    valor: (l) => l.primeiro_nome ?? 'sem nome',
    className: 'font-medium text-ninho-grafite',
  },
  { key: 'liberada', label: 'Liberada', largura: 110, valor: (l) => quandoDubai(l.liberado_em), ordem: (l) => l.liberado_em },
  { key: 'aviso', label: 'Aviso', largura: 110, valor: (l) => quandoDubai(l.avisado_em), ordem: (l) => l.avisado_em },
  { key: 'push', label: 'Abriu a push', largura: 110, valor: (l) => quandoDubai(l.push_aberta_em), ordem: (l) => l.push_aberta_em },
  { key: 'voltou', label: 'Voltou', largura: 110, valor: (l) => quandoDubai(l.voltou_em), ordem: (l) => l.voltou_em },
  { key: 'registro', label: '1º registro', largura: 110, valor: (l) => quandoDubai(l.registrou_em), ordem: (l) => l.registrou_em },
  {
    key: 'registros', label: 'Registros', largura: 100, numerica: true,
    valor: (l) => String(l.registros_depois), ordem: (l) => l.registros_depois,
  },
  { key: 'assinou', label: 'Assinou', largura: 90, valor: (l) => (l.assinou ? 'sim' : '—') },
];

export function TabelaLiberados({ lista }: { lista: Liberado[] }) {
  return (
    <TabelaPessoas
      rows={lista}
      colunas={COLUNAS_LIBERADO}
      getId={(l) => l.profile_id}
      vazio="Ninguém liberado ainda. A cada 5 minutos o servidor libera quem está no B há 30 min sem cartão."
      busca={(l) => l.primeiro_nome ?? ''}
      excel={{ arquivo: 'ninho-b-liberados', aba: 'Liberados' }}
    />
  );
}
