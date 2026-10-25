'use client';

import { TabelaPessoas, type Coluna } from '@/components/admin/TabelaPessoas';

/** Um contato do conversor, já montado pela página (servidor). */
export interface ContatoConversor {
  id: string;
  em: string;
  emTexto: string;
  pessoa: string;
  desfecho: string;
  convertido: boolean;
  conversor: string;
  observacao: string;
}

const COLUNAS: Coluna<ContatoConversor>[] = [
  { key: 'em', label: 'Quando', largura: 110, valor: (c) => c.emTexto, ordem: (c) => c.em, className: 'text-ninho-cinza' },
  { key: 'pessoa', label: 'Pessoa', largura: 180, valor: (c) => c.pessoa, className: 'font-medium text-ninho-grafite' },
  {
    key: 'desfecho', label: 'Desfecho', largura: 140,
    valor: (c) => c.desfecho,
    render: (c) => (
      <span
        className={`rounded-pill px-2.5 py-1 text-[11px] font-semibold ${
          c.convertido ? 'bg-[#E4F5EC] text-[#2E7D51]' : 'bg-ninho-nuvem text-ninho-cinza'
        }`}
      >
        {c.desfecho}
      </span>
    ),
  },
  { key: 'conversor', label: 'Conversor', largura: 130, valor: (c) => c.conversor, className: 'text-ninho-cinza' },
  {
    key: 'obs', label: 'Observação', largura: 260,
    valor: (c) => c.observacao, className: 'text-ninho-cinza', title: (c) => c.observacao,
  },
];

export function TabelaContatosConversor({ lista, vazio }: { lista: ContatoConversor[]; vazio: string }) {
  return (
    <TabelaPessoas
      rows={lista}
      colunas={COLUNAS}
      getId={(c) => c.id}
      vazio={vazio}
      busca={(c) => `${c.pessoa} ${c.observacao}`}
      placeholderBusca="Buscar por pessoa ou observação..."
      unidade={['contato', 'contatos']}
    />
  );
}
