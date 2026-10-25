'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { applyColumnFilters } from '@/components/admin/ColumnFilter';
import { ThSort, nextSort, type SortState } from '@/components/admin/ThSort';
import { ExportExcelButton } from '@/components/admin/ExportExcelButton';
import { CopyAll } from '@/components/admin/CopyAll';
import { ORIGEM_COR, ORIGEM_LABEL, type Origem } from '@/lib/origem';

/** Selo de origem com a bolinha da cor do canal — igual ao de Usuários ativos. */
export function OrigemPill({ origem, title }: { origem: Origem; title?: string }) {
  return (
    <span
      className="inline-flex max-w-full items-center gap-1.5 rounded-pill bg-ninho-nuvem px-2 py-0.5 text-xs font-medium text-ninho-grafite"
      title={title}
    >
      <i className="inline-block h-2 w-2 shrink-0 rounded-full" style={{ background: ORIGEM_COR[origem] }} />
      <span className="truncate">{ORIGEM_LABEL[origem]}</span>
    </span>
  );
}

/**
 * Lista de pessoas no padrão da tela de Usuários ativos (pedido do dono em
 * 25/10/2026): toda coluna ordena (clique no título), filtra (seta ▾) e muda
 * de largura (arrastando a borda do cabeçalho), com rolagem horizontal em
 * cima e embaixo. Qualquer tabela de pessoas do painel usa esta.
 *
 * Como as colunas levam funções, quem usa é um Client Component: a página
 * (servidor) manda as linhas já prontas, com datas em ISO e textos
 * formatados, e um wrapper 'use client' define as colunas.
 */
export interface Coluna<T> {
  key: string;
  label: string;
  /** Largura inicial em px (dá para arrastar depois). */
  largura: number;
  /** Texto da coluna: vai para o filtro, para o Excel e para a célula
   *  quando não há `render`. */
  valor: (r: T) => string;
  /** Valor de ordenação; sem ele, ordena pelo texto. */
  ordem?: (r: T) => number | string | null;
  /** Número: alinha à direita e o filtro lista em ordem numérica. */
  numerica?: boolean;
  render?: (r: T) => React.ReactNode;
  className?: string | ((r: T) => string);
  title?: (r: T) => string | undefined;
}

/** Rolagem horizontal dupla e sincronizada (topo + fundo): com a de cima dá
 *  para rolar sem descer até o fim da lista. */
export function DualScrollTable({ children, minWidth }: { children: React.ReactNode; minWidth: number }) {
  const topRef = useRef<HTMLDivElement>(null);
  const botRef = useRef<HTMLDivElement>(null);
  const syncing = useRef(false);

  const syncTop = useCallback(() => {
    if (syncing.current || !topRef.current || !botRef.current) return;
    syncing.current = true;
    botRef.current.scrollLeft = topRef.current.scrollLeft;
    syncing.current = false;
  }, []);

  const syncBot = useCallback(() => {
    if (syncing.current || !topRef.current || !botRef.current) return;
    syncing.current = true;
    topRef.current.scrollLeft = botRef.current.scrollLeft;
    syncing.current = false;
  }, []);

  return (
    <div className="rounded-2xl border border-ninho-borda bg-white p-2">
      <div
        ref={topRef}
        onScroll={syncTop}
        className="admin-scroll overflow-x-auto"
        style={{ overflowY: 'hidden', height: 12 }}
      >
        <div style={{ width: minWidth, height: 1 }} />
      </div>

      <div ref={botRef} onScroll={syncBot} className="admin-scroll overflow-x-auto">
        <table className="w-full table-fixed text-sm" style={{ minWidth }}>
          {children}
        </table>
      </div>
    </div>
  );
}

/** Larguras arrastáveis: devolve as larguras atuais e o handler do
 *  mousedown na borda do cabeçalho. */
export function useLargurasColunas(iniciais: number[]) {
  const [larguras, setLarguras] = useState<number[]>(iniciais);
  const dragRef = useRef<{ col: number; startX: number; startW: number } | null>(null);

  const iniciarArraste = useCallback(
    (e: React.MouseEvent, col: number) => {
      e.preventDefault();
      e.stopPropagation();
      dragRef.current = { col, startX: e.clientX, startW: larguras[col] };
      function onMove(ev: MouseEvent) {
        if (!dragRef.current) return;
        const { col: c, startX, startW } = dragRef.current;
        setLarguras((prev) => {
          const next = [...prev];
          next[c] = Math.max(40, startW + ev.clientX - startX);
          return next;
        });
      }
      function onUp() {
        dragRef.current = null;
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      }
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    },
    [larguras]
  );

  return { larguras, iniciarArraste };
}

function cmp(a: number | string | null, b: number | string | null): number {
  // Vazio fica no fim da ordem crescente.
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b), 'pt-BR');
}

export function TabelaPessoas<T>({
  rows,
  colunas,
  getId,
  vazio,
  busca,
  placeholderBusca = 'Buscar por nome...',
  excel,
  emails,
  rodape,
  unidade = ['pessoa', 'pessoas'],
}: {
  rows: T[];
  colunas: Coluna<T>[];
  getId: (r: T) => string;
  /** Mensagem quando a lista está vazia. */
  vazio: string;
  /** Texto pesquisável de cada linha; sem isso, não aparece a busca. */
  busca?: (r: T) => string;
  placeholderBusca?: string;
  /** Mostra o botão de exportar com as linhas filtradas. */
  excel?: { arquivo: string; aba: string };
  /** Mostra "Copiar e-mails" com as linhas filtradas. */
  emails?: (r: T) => string | null;
  /** Linha de total (recebe as linhas filtradas). */
  rodape?: (filtradas: T[]) => React.ReactNode;
  unidade?: [string, string];
}) {
  const { larguras, iniciarArraste } = useLargurasColunas(colunas.map((c) => c.largura));
  const [texto, setTexto] = useState('');
  const [sort, setSort] = useState<SortState<string> | null>(null);
  const semFiltro = () => Object.fromEntries(colunas.map((c) => [c.key, null])) as Record<string, Set<string> | null>;
  const [filtros, setFiltros] = useState<Record<string, Set<string> | null>>(semFiltro);

  const porKey = useMemo(() => new Map(colunas.map((c) => [c.key, c])), [colunas]);

  const opcoes = useMemo(() => {
    const out: Record<string, string[]> = {};
    for (const c of colunas) {
      const vals = Array.from(new Set(rows.map((r) => c.valor(r))));
      vals.sort((a, b) => (c.numerica ? Number(a) - Number(b) : a.localeCompare(b, 'pt-BR')));
      out[c.key] = vals;
    }
    return out;
  }, [rows, colunas]);

  const filtradas = useMemo(() => {
    let r = [...rows];
    if (busca && texto.trim()) {
      const q = texto.trim().toLowerCase();
      r = r.filter((x) => busca(x).toLowerCase().includes(q));
    }
    r = applyColumnFilters(r, filtros, (x, col) => porKey.get(col)!.valor(x));
    if (sort) {
      const c = porKey.get(sort.key);
      if (c) {
        const v = (x: T) => (c.ordem ? c.ordem(x) : c.valor(x));
        r.sort((a, b) => (sort.dir === 'asc' ? 1 : -1) * cmp(v(a), v(b)));
      }
    }
    return r;
  }, [rows, busca, texto, filtros, sort, porKey]);

  const temFiltro = !!texto.trim() || !!sort || Object.values(filtros).some((v) => v !== null);
  const minWidth = larguras.reduce((a, b) => a + b, 0);

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-ninho-borda bg-white p-8 text-center text-sm text-ninho-cinza">
        {vazio}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        {busca && (
          <div className="relative min-w-[200px] max-w-sm flex-1">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-ninho-cinza">
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            </span>
            <input
              type="text"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder={placeholderBusca}
              className="w-full rounded-pill border border-ninho-borda py-1.5 pl-9 pr-4 text-sm text-ninho-grafite placeholder:text-ninho-cinza focus:border-ninho-roxo focus:outline-none"
            />
          </div>
        )}
        {temFiltro && (
          <button
            type="button"
            onClick={() => {
              setTexto('');
              setSort(null);
              setFiltros(semFiltro());
            }}
            className="rounded-pill border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-500 transition hover:bg-red-100"
          >
            ✕ Limpar
          </button>
        )}
        {emails && (
          <CopyAll
            label="Copiar e-mails"
            values={filtradas.map(emails).filter((e): e is string => Boolean(e))}
          />
        )}
        {excel && (
          <ExportExcelButton
            rows={filtradas.map((r) => Object.fromEntries(colunas.map((c) => [c.label, c.valor(r)])))}
            filename={excel.arquivo}
            sheetName={excel.aba}
          />
        )}
        <span className="ml-auto text-xs text-ninho-cinza">
          {filtradas.length === rows.length ? rows.length : `${filtradas.length} de ${rows.length}`}{' '}
          {rows.length === 1 ? unidade[0] : unidade[1]}
        </span>
      </div>

      <DualScrollTable minWidth={minWidth}>
        <colgroup>
          {larguras.map((w, i) => (
            <col key={i} style={{ width: w }} />
          ))}
        </colgroup>
        <thead>
          <tr className="border-b-2 border-ninho-borda text-left text-xs font-medium text-ninho-cinza">
            {colunas.map((c, i) => (
              <ThSort
                key={c.key}
                col={c.key}
                label={c.label}
                onResize={(e) => iniciarArraste(e, i)}
                filterOptions={opcoes[c.key]}
                filterSelected={filtros[c.key]}
                onFilterChange={(v) => setFiltros((p) => ({ ...p, [c.key]: v }))}
                sort={sort}
                onSort={(k) => setSort((prev) => nextSort(prev, k))}
              />
            ))}
          </tr>
        </thead>
        <tbody>
          {filtradas.length === 0 && (
            <tr>
              <td colSpan={colunas.length} className="p-6 text-center text-ninho-cinza">
                Ninguém com esses filtros.
              </td>
            </tr>
          )}
          {filtradas.map((r) => (
            <tr key={getId(r)} className="border-b border-ninho-borda transition-colors hover:bg-ninho-nuvem">
              {colunas.map((c) => {
                const extra = typeof c.className === 'function' ? c.className(r) : c.className ?? '';
                return (
                  <td
                    key={c.key}
                    className={`overflow-hidden p-3 ${c.numerica ? 'text-right tabular-nums' : ''} ${extra}`}
                    title={c.title ? c.title(r) : undefined}
                  >
                    {c.render ? c.render(r) : <div className="truncate">{c.valor(r)}</div>}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
        {rodape && <tfoot>{rodape(filtradas)}</tfoot>}
      </DualScrollTable>
      <p className="mt-2 text-[11px] text-ninho-cinza">
        Toda coluna ordena (clique no título), filtra (seta ▾) e muda de largura (arraste a borda do
        cabeçalho).
      </p>
    </div>
  );
}
