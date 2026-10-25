'use client';

import type { Cartao, Liberado } from '@/lib/teste-paywall';
import { diasAte, quandoDubai, valorCartao } from '@/lib/teste-paywall-formato';
import { ORIGEM_LABEL, ORIGENS } from '@/lib/origem';
import { PLANO_LABEL } from '@/lib/precos';
import { OrigemPill, TabelaPessoas, type Coluna } from '@/components/admin/TabelaPessoas';

/** Pagou ou desligou a renovação: não há mais cobrança para esperar. */
const encerrado = (c: Cartao) => c.pagou || c.renova === false;

function diasTexto(c: Cartao): string {
  const d = diasAte(c.cobranca_em);
  if (encerrado(c) || d == null) return '—';
  return d <= 0 ? 'cobrando agora' : String(d);
}

const COLUNAS_CARTAO: Coluna<Cartao>[] = [
  {
    key: 'nome', label: 'Nome', largura: 150,
    valor: (c) => c.nome ?? 'sem nome',
    className: 'font-medium text-ninho-grafite',
  },
  { key: 'criado', label: 'Conta criada', largura: 110, valor: (c) => quandoDubai(c.criado_em), ordem: (c) => c.criado_em },
  { key: 'cobranca', label: 'Compra prevista', largura: 120, valor: (c) => quandoDubai(c.cobranca_em), ordem: (c) => c.cobranca_em },
  {
    key: 'registros', label: 'Lançamentos', largura: 125, numerica: true,
    valor: (c) => String(c.registros), ordem: (c) => c.registros,
    className: (c) => (c.registros === 0 ? 'font-semibold text-state-danger' : ''),
  },
  { key: 'plano', label: 'Plano', largura: 130, valor: (c) => (c.plano ? `${PLANO_LABEL[c.plano]} ${c.ciclo ?? ''}`.trim() : '—') },
  {
    key: 'dias', label: 'Dias até a cobrança', largura: 120, numerica: true,
    valor: diasTexto,
    ordem: (c) => (encerrado(c) ? null : diasAte(c.cobranca_em)),
  },
  {
    key: 'valor', label: 'Valor a faturar', largura: 140,
    valor: (c) => valorCartao(c).texto,
    ordem: (c) => valorCartao(c).valor,
    className: (c) => (c.renova === false && !c.pagou ? 'text-ninho-cinza' : ''),
  },
  {
    key: 'origem', label: 'Origem', largura: 185,
    valor: (c) => ORIGEM_LABEL[c.origem],
    ordem: (c) => ORIGENS.indexOf(c.origem),
    render: (c) => <OrigemPill origem={c.origem} />,
  },
];

export function TabelaCartoes({ lista }: { lista: Cartao[] }) {
  return (
    <TabelaPessoas
      rows={lista}
      colunas={COLUNAS_CARTAO}
      getId={(c) => c.profile_id}
      vazio="Ninguém pôs o cartão ainda."
      busca={(c) => c.nome ?? ''}
      excel={{ arquivo: 'ninho-cartoes-teste-paywall', aba: 'Cartões' }}
    />
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
      vazio="Ninguém liberado ainda. A cada 15 minutos o servidor libera quem está no B há 2h sem cartão."
      busca={(l) => l.primeiro_nome ?? ''}
      excel={{ arquivo: 'ninho-b-liberados', aba: 'Liberados' }}
    />
  );
}
