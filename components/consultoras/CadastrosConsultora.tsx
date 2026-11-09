'use client';

import { useMemo, useState } from 'react';
import { ThSort, nextSort, type SortState } from '@/components/admin/ThSort';

/** Uma conta atribuída à consultora (veio pelo link ou código dela). */
export interface CadastroLinha {
  id: string;
  nome: string;
  comoChegou: string;
  atribuidaEm: string | null;
  /** dd/mm/aaaa para a tela. */
  atribuidaEmTxt: string;
  plano: string;
  pagaHoje: boolean;
  comissaoMes: number;
  /** Por que está sem valor no mês ("cancelou em 12/11", "em teste grátis até 14/11"...). */
  motivoSemValor: string | null;
  status: string;
  email: string;
}

type Col = 'nome' | 'comoChegou' | 'atribuidaEm' | 'plano' | 'comissaoMes' | 'status' | 'email';
const FILTRAVEIS: Col[] = ['nome', 'comoChegou', 'plano', 'status', 'email'];

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

/**
 * Cadastros da consultora no padrão das listas do painel: ordenar pelo
 * cabeçalho e filtrar pela seta ▾ de cada coluna (pedido do dono, 09/11/2026).
 */
export function CadastrosConsultora({ linhas, mes }: { linhas: CadastroLinha[]; mes: string }) {
  const [sort, setSort] = useState<SortState<Col> | null>({ key: 'atribuidaEm', dir: 'desc' });
  const [filtros, setFiltros] = useState<Partial<Record<Col, Set<string> | null>>>({});

  const valor = (l: CadastroLinha, c: Col): string => (c === 'comissaoMes' ? String(l.comissaoMes) : String(l[c] ?? ''));
  const opcoes = useMemo(() => {
    const o: Partial<Record<Col, string[]>> = {};
    for (const c of FILTRAVEIS) o[c] = Array.from(new Set(linhas.map((l) => valor(l, c)))).sort((a, b) => a.localeCompare(b, 'pt-BR'));
    return o;
  }, [linhas]);

  const visiveis = useMemo(() => {
    let r = linhas.filter((l) => FILTRAVEIS.every((c) => !filtros[c] || filtros[c]!.has(valor(l, c))));
    if (sort) {
      const k = sort.key;
      r = [...r].sort((a, b) => {
        const x = k === 'comissaoMes' ? a.comissaoMes - b.comissaoMes : String(a[k] ?? '').localeCompare(String(b[k] ?? ''), 'pt-BR');
        return sort.dir === 'asc' ? x : -x;
      });
    }
    return r;
  }, [linhas, filtros, sort]);

  const th = (col: Col, label: string, className = '') => (
    <ThSort<Col>
      col={col}
      label={label}
      className={className}
      sort={sort}
      onSort={(k) => setSort((p) => nextSort(p, k))}
      filterOptions={FILTRAVEIS.includes(col) ? opcoes[col] : undefined}
      filterSelected={filtros[col] ?? null}
      onFilterChange={(v) => setFiltros((f) => ({ ...f, [col]: v }))}
    />
  );

  if (linhas.length === 0) {
    return <p className="py-4 text-center text-sm text-ninho-cinza">Nenhum cadastro atribuído ainda.</p>;
  }
  return (
    <div className="admin-scroll overflow-x-auto rounded-2xl border border-ninho-borda bg-white">
      <table className="w-full min-w-[820px] text-left text-sm">
        <thead className="text-[11px] font-semibold uppercase tracking-wide text-ninho-cinza">
          <tr className="border-b border-ninho-borda">
            {th('nome', 'Nome')}
            {th('comoChegou', 'Como chegou')}
            {th('atribuidaEm', 'Atribuída em')}
            {th('plano', 'Plano')}
            {th('comissaoMes', `Comissão ${mes}`, 'text-right')}
            {th('status', 'Status')}
            {th('email', 'Email')}
          </tr>
        </thead>
        <tbody className="divide-y divide-ninho-borda">
          {visiveis.map((l) => (
            <tr key={l.id}>
              <td className="px-3 py-2.5 font-semibold text-ninho-grafite">{l.nome}</td>
              <td className="px-3 py-2.5 text-ninho-cinza">{l.comoChegou}</td>
              <td className="px-3 py-2.5 tabular-nums text-ninho-cinza">{l.atribuidaEmTxt}</td>
              <td className="px-3 py-2.5">
                <span className={`rounded-pill px-2 py-0.5 text-[12px] font-semibold ${l.pagaHoje ? 'bg-[#E4F5EC] text-[#2E7D51]' : 'bg-ninho-nuvem text-ninho-cinza'}`}>{l.plano}</span>
              </td>
              <td className="px-3 py-2.5 text-right tabular-nums">
                {l.comissaoMes ? brl(l.comissaoMes) : (<>{brl(0)}{l.motivoSemValor && <small className="block text-[11px] text-ninho-cinza">{l.motivoSemValor}</small>}</>)}
              </td>
              <td className="px-3 py-2.5">{l.status}</td>
              <td className="px-3 py-2.5 text-ninho-cinza">{l.email || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {visiveis.length === 0 && <p className="py-4 text-center text-sm text-ninho-cinza">Nenhum cadastro com esses filtros.</p>}
    </div>
  );
}
