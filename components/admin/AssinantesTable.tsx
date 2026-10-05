'use client';

import { useMemo, useState } from 'react';
import type { AppUser } from '@/lib/app-users';
import { applyColumnFilters } from '@/components/admin/ColumnFilter';
import { ThSort, nextSort, type SortState } from '@/components/admin/ThSort';
import { ExportExcelButton } from '@/components/admin/ExportExcelButton';
import { CopyAll } from '@/components/admin/CopyAll';
import {
  formatBRL,
  formatDate,
  priceForUser,
  planoLabel,
  cicloDoUsuario,
  receitaNoMes,
} from '@/lib/metrics';
import { liquido, TAXA_LOJA } from '@/lib/precos';

// Toda coluna ordena e filtra — mesma regra da tela de Usuários ativos.
type Col = 'nome' | 'email' | 'plano' | 'cobrado' | 'entrou' | 'assinou' | 'renova' | 'cadastro';

const CABECALHOS: [Col, string][] = [
  ['nome', 'Nome'],
  ['email', 'E-mail'],
  ['plano', 'Plano'],
  ['cobrado', 'Valor cobrado'],
  ['entrou', 'Entrou (líquido)'],
  ['assinou', 'Assinou em'],
  ['renova', 'Renova em'],
  ['cadastro', 'Cadastro'],
];

const COLUNAS: Col[] = CABECALHOS.map(([c]) => c);

/** Colunas cujo filtro ordena por número, não por texto — senão "R$ 9,90"
 *  viria depois de "R$ 129,90" na lista. */
const COLUNAS_NUMERICAS: Set<Col> = new Set(['cobrado', 'entrou']);

/**
 * Quem está pagando hoje.
 *
 * DUAS colunas de dinheiro, que respondem perguntas diferentes:
 *   "Valor cobrado"    = preço de tabela, o que a loja tira do cartão do
 *                        cliente por cobrança (anual = o ano inteiro). BRUTO,
 *                        porque é o preço anunciado.
 *   "Entrou (líquido)" = o que de fato caiu pra você no mês selecionado: valor
 *                        cheio da cobrança menos a taxa da loja, e R$ 0,00 nos
 *                        meses sem cobrança. É esta coluna que soma no caixa.
 */
export function AssinantesTable({ rows, mes }: { rows: AppUser[]; mes: string }) {
  const [sort, setSort] = useState<SortState<Col> | null>(null);
  const [colFilters, setColFilters] = useState<Record<Col, Set<string> | null>>(
    () => Object.fromEntries(COLUNAS.map((c) => [c, null])) as Record<Col, Set<string> | null>
  );

  // Caixa LÍQUIDO da conta no mês — já sem a taxa da loja.
  const entrouLiquido = (u: AppUser) => liquido(receitaNoMes(u, mes));

  /** Texto de cada coluna. Precisa bater EXATAMENTE com o que a célula mostra,
   *  senão o usuário marca um valor no filtro e some linha que estava na tela. */
  function colValue(u: AppUser, col: Col): string {
    switch (col) {
      case 'nome':     return u.name || '—';
      case 'email':    return u.email || '—';
      case 'plano':    return planoLabel(u);
      case 'cobrado':  return formatBRL(priceForUser(u));
      case 'entrou':   return formatBRL(entrouLiquido(u));
      case 'assinou':  return formatDate(u.assinouEm);
      case 'renova':   return formatDate(u.current_period_end);
      case 'cadastro': return formatDate(u.created_at);
    }
  }

  /** Valor de ordenação: número onde é número, data onde é data — ordenar pelo
   *  texto poria "10/11" antes de "02/12" e "R$ 9,90" depois de "R$ 129,90". */
  function sortValue(u: AppUser, col: Col): number | string {
    switch (col) {
      case 'nome':     return (u.name ?? '').toLowerCase();
      case 'email':    return (u.email ?? '').toLowerCase();
      case 'plano':    return planoLabel(u);
      case 'cobrado':  return priceForUser(u);
      case 'entrou':   return entrouLiquido(u);
      case 'assinou':  return u.assinouEm ? new Date(u.assinouEm).getTime() : -Infinity;
      case 'renova':   return u.current_period_end ? new Date(u.current_period_end).getTime() : -Infinity;
      case 'cadastro': return new Date(u.created_at).getTime();
    }
  }

  const filterOptions = useMemo(() => {
    const out = {} as Record<Col, string[]>;
    for (const col of COLUNAS) {
      const vals = Array.from(new Set(rows.map((r) => colValue(r, col))));
      if (COLUNAS_NUMERICAS.has(col)) {
        // Ordena pelo valor real por trás do texto formatado.
        const porTexto = new Map(rows.map((r) => [colValue(r, col), sortValue(r, col) as number]));
        vals.sort((a, b) => (porTexto.get(a) ?? 0) - (porTexto.get(b) ?? 0));
      } else {
        vals.sort((a, b) => a.localeCompare(b, 'pt-BR'));
      }
      out[col] = vals;
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, mes]);

  const filtradas = useMemo(() => {
    let r = applyColumnFilters([...rows], colFilters, colValue);

    if (sort) {
      r.sort((a, b) => {
        const va = sortValue(a, sort.key);
        const vb = sortValue(b, sort.key);
        const cmp =
          typeof va === 'number' && typeof vb === 'number'
            ? va - vb
            : String(va).localeCompare(String(vb), 'pt-BR');
        return sort.dir === 'asc' ? cmp : -cmp;
      });
    }
    return r;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, colFilters, sort, mes]);

  const totalLiquido = filtradas.reduce((s, u) => s + entrouLiquido(u), 0);
  const totalBruto = filtradas.reduce((s, u) => s + receitaNoMes(u, mes), 0);

  const paraExcel = filtradas.map((u) => ({
    Nome: u.name || '',
    'E-mail': u.email || '',
    Plano: planoLabel(u),
    Ciclo: cicloDoUsuario(u),
    'Valor cobrado (bruto)': priceForUser(u),
    [`Entrou em ${mes} (bruto)`]: receitaNoMes(u, mes),
    [`Entrou em ${mes} (líquido)`]: entrouLiquido(u),
    'Assinou em': u.assinouEm ? new Date(u.assinouEm).toLocaleDateString('pt-BR') : '',
    'Renova em': u.current_period_end
      ? new Date(u.current_period_end).toLocaleDateString('pt-BR')
      : '',
    Cadastro: new Date(u.created_at).toLocaleDateString('pt-BR'),
  }));

  const emails = filtradas.map((u) => u.email).filter((e): e is string => Boolean(e));
  const temFiltro = Object.values(colFilters).some((v) => v !== null) || sort !== null;

  function limpar() {
    setSort(null);
    setColFilters(
      Object.fromEntries(COLUNAS.map((c) => [c, null])) as Record<Col, Set<string> | null>
    );
  }

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-bold text-ninho-grafite">
          Assinantes{' '}
          <span className="ml-1 rounded-pill bg-ninho-roxo-suave px-2.5 py-0.5 text-xs font-semibold text-ninho-roxo-escuro">
            {filtradas.length}
            {filtradas.length !== rows.length && ` de ${rows.length}`}
          </span>
        </h2>
        <div className="flex flex-wrap gap-2">
          {temFiltro && (
            <button
              type="button"
              onClick={limpar}
              className="rounded-pill border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-500 transition hover:bg-red-100"
            >
              ✕ Limpar
            </button>
          )}
          <CopyAll label="Copiar e-mails" values={emails} />
          <ExportExcelButton rows={paraExcel} filename="ninho-assinantes" sheetName="Assinantes" />
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-ninho-borda bg-white p-8 text-center text-sm text-ninho-cinza">
          Nenhum assinante ainda. Quando alguém pagar, aparece aqui.
        </div>
      ) : (
        <div className="admin-scroll overflow-x-auto rounded-2xl border border-ninho-borda bg-white">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead>
              <tr className="border-b-2 border-ninho-borda text-xs font-medium text-ninho-cinza">
                {CABECALHOS.map(([col, label]) => (
                  <ThSort
                    key={col}
                    col={col}
                    label={col === 'entrou' ? `Entrou em ${mes} (líq.)` : label}
                    filterOptions={filterOptions[col]}
                    filterSelected={colFilters[col]}
                    onFilterChange={(v) => setColFilters((p) => ({ ...p, [col]: v }))}
                    sort={sort}
                    onSort={(k) => setSort((prev) => nextSort(prev, k))}
                  />
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-ninho-borda">
              {filtradas.length === 0 && (
                <tr>
                  <td colSpan={CABECALHOS.length} className="p-6 text-center text-ninho-cinza">
                    Sem assinantes com esses filtros.
                  </td>
                </tr>
              )}
              {filtradas.map((u) => {
                const anual = cicloDoUsuario(u) === 'anual';
                const caixa = entrouLiquido(u);
                return (
                  <tr key={u.id} className="hover:bg-ninho-nuvem">
                    <td className="px-4 py-3 font-medium text-ninho-grafite">{u.name || '—'}</td>
                    <td className="px-4 py-3 text-ninho-cinza">{u.email || '—'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`whitespace-nowrap rounded-pill px-2.5 py-1 text-[11px] font-semibold ${
                          u.plan === 'basico'
                            ? 'bg-ninho-nuvem text-ninho-grafite'
                            : 'bg-ninho-roxo-suave text-ninho-roxo-escuro'
                        }`}
                      >
                        {planoLabel(u)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-ninho-grafite">
                      {formatBRL(priceForUser(u))}
                      <span className="ml-1 text-[11px] text-ninho-cinza">
                        {anual ? '/ano' : '/mês'}
                      </span>
                    </td>
                    <td
                      className={`whitespace-nowrap px-4 py-3 tabular-nums ${
                        caixa > 0 ? 'font-semibold text-ninho-grafite' : 'text-ninho-cinza'
                      }`}
                      title={
                        caixa > 0
                          ? `Cobrança de ${formatBRL(receitaNoMes(u, mes))} menos ${Math.round(TAXA_LOJA * 100)}% da loja`
                          : `Sem cobrança em ${mes} — ${anual ? 'o anual cobra uma vez por ano' : 'assinou depois, ou a próxima cobrança ainda não chegou'}`
                      }
                    >
                      {formatBRL(caixa)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-ninho-cinza">
                      {formatDate(u.assinouEm)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-ninho-cinza">
                      {formatDate(u.current_period_end)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-ninho-cinza">
                      {formatDate(u.created_at)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-ninho-borda bg-ninho-nuvem">
                <td colSpan={4} className="px-4 py-3 text-xs font-semibold uppercase text-ninho-cinza">
                  Entrou em {mes}
                </td>
                <td colSpan={4} className="px-4 py-3 font-bold text-ninho-roxo-escuro">
                  {formatBRL(totalLiquido)}{' '}
                  <span className="font-medium text-ninho-cinza">
                    líquido · {formatBRL(totalBruto)} bruto
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      <p className="mt-3 text-xs text-ninho-cinza">
        Toda coluna ordena (clique no título: crescente → decrescente → sem ordem) e filtra (seta ▾).{' '}
        <strong>Valor cobrado</strong> é o preço de tabela, o que sai do cartão do cliente — no
        anual, o ano inteiro. <strong>Entrou</strong> é o que caiu pra você no mês: a cobrança menos
        os {Math.round(TAXA_LOJA * 100)}% da loja, e R$ 0,00 nos meses sem cobrança.{' '}
        <strong>Assinou em</strong> vem da primeira compra verificada, não da data de cadastro.
      </p>
    </>
  );
}
