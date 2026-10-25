'use client';

import { TabelaPessoas, type Coluna } from '@/components/admin/TabelaPessoas';

/** Linhas já formatadas pela página (servidor): datas em ISO para ordenar e
 *  em texto para mostrar. */
export interface AssinouTarde {
  id: string;
  nome: string | null;
  plano: string;
  em: string;
  emTexto: string;
  diasDepois: number;
  recebeu: string[];
}

export interface CompraComOferta {
  id: string;
  nome: string | null;
  plano: string;
  preco: number;
  precoTabela: number;
  oferta: string;
  em: string;
  emTexto: string;
}

const reais = (v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`;

const COLUNAS_TARDE: Coluna<AssinouTarde>[] = [
  { key: 'nome', label: 'Quem', largura: 150, valor: (p) => p.nome ?? '—', className: 'font-medium text-ninho-grafite' },
  { key: 'plano', label: 'Plano', largura: 130, valor: (p) => p.plano },
  { key: 'em', label: 'Assinou', largura: 100, valor: (p) => p.emTexto, ordem: (p) => p.em },
  {
    key: 'dias', label: 'Dias após expirar', largura: 110, numerica: true,
    valor: (p) => String(p.diasDepois), ordem: (p) => p.diasDepois,
  },
  {
    key: 'recebeu', label: 'Recebeu antes (7d)', largura: 200,
    valor: (p) => (p.recebeu.length ? p.recebeu.join(', ') : 'nenhuma campanha'),
    className: (p) => `text-xs ${p.recebeu.length ? '' : 'text-ninho-cinza'}`,
    title: (p) => (p.recebeu.length ? p.recebeu.join(', ') : undefined),
  },
];

export function TabelaAssinouTarde({ lista }: { lista: AssinouTarde[] }) {
  return (
    <TabelaPessoas
      rows={lista}
      colunas={COLUNAS_TARDE}
      getId={(p) => p.id}
      vazio="Ninguém assinou 3+ dias depois de expirar."
      busca={(p) => p.nome ?? ''}
    />
  );
}

const COLUNAS_OFERTA: Coluna<CompraComOferta>[] = [
  { key: 'nome', label: 'Quem', largura: 150, valor: (o) => o.nome ?? '—', className: 'font-medium text-ninho-grafite' },
  { key: 'plano', label: 'Plano', largura: 130, valor: (o) => o.plano },
  { key: 'preco', label: 'Pagou', largura: 100, numerica: true, valor: (o) => reais(o.preco), ordem: (o) => o.preco },
  {
    key: 'tabela', label: 'Tabela', largura: 100, numerica: true,
    valor: (o) => reais(o.precoTabela), ordem: (o) => o.precoTabela, className: 'text-ninho-cinza',
  },
  { key: 'oferta', label: 'Oferta', largura: 160, valor: (o) => o.oferta },
  { key: 'em', label: 'Quando', largura: 100, valor: (o) => o.emTexto, ordem: (o) => o.em },
];

export function TabelaOfertas({ lista }: { lista: CompraComOferta[] }) {
  return (
    <TabelaPessoas
      rows={lista}
      colunas={COLUNAS_OFERTA}
      getId={(o) => o.id}
      vazio="Ninguém assinou com oferta ainda."
      busca={(o) => o.nome ?? ''}
      excel={{ arquivo: 'ninho-assinaturas-com-oferta', aba: 'Ofertas' }}
    />
  );
}
