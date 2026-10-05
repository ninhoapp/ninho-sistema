'use client';

import { ColumnFilter } from '@/components/admin/ColumnFilter';

export type SortDir = 'asc' | 'desc';
export interface SortState<K extends string> {
  key: K;
  dir: SortDir;
}

/**
 * Próximo estado ao clicar num cabeçalho: crescente → decrescente → sem
 * ordenação. O terceiro clique volta à ordem natural da consulta, que é o
 * comportamento que a tela de Usuários ativos já tinha.
 */
export function nextSort<K extends string>(
  prev: SortState<K> | null,
  key: K
): SortState<K> | null {
  if (prev?.key === key) return prev.dir === 'asc' ? { key, dir: 'desc' } : null;
  return { key, dir: 'asc' };
}

function SortArrow<K extends string>({ col, sort }: { col: K; sort: SortState<K> | null }) {
  if (!sort || sort.key !== col) {
    return <span className="ml-1 text-ninho-borda opacity-70">↕</span>;
  }
  return <span className="ml-1 text-ninho-roxo">{sort.dir === 'asc' ? '↑' : '↓'}</span>;
}

/** Handle de redimensionamento no canto direito do th. */
export function ResizeHandle({ onMouseDown }: { onMouseDown: (e: React.MouseEvent) => void }) {
  return (
    <div
      onMouseDown={onMouseDown}
      className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize opacity-0 transition-opacity hover:bg-ninho-roxo hover:opacity-40 group-hover:opacity-20"
      style={{ zIndex: 1 }}
    />
  );
}

/**
 * Cabeçalho de coluna com ordenação (clique no título) e filtro (seta ▾).
 *
 * DEVE ficar fora do componente que o usa — se for declarado dentro, o React
 * recria a referência da função a cada render e desmonta/remonta o th inteiro,
 * fazendo o dropdown do filtro fechar sozinho ao marcar um item.
 */
export function ThSort<K extends string>({
  col,
  label,
  className = '',
  onResize,
  filterOptions,
  filterSelected,
  onFilterChange,
  sort,
  onSort,
}: {
  col: K;
  label: string;
  className?: string;
  onResize?: (e: React.MouseEvent) => void;
  filterOptions?: string[];
  filterSelected?: Set<string> | null;
  onFilterChange?: (v: Set<string> | null) => void;
  sort: SortState<K> | null;
  onSort: (key: K) => void;
}) {
  return (
    <th
      className={`group relative cursor-pointer select-none border-r border-ninho-borda p-3 last:border-r-0 hover:text-ninho-roxo ${className}`}
      onClick={() => onSort(col)}
    >
      <div className="flex min-w-0 items-start gap-0.5">
        <span className="min-w-0 flex-1 break-words leading-snug">
          {label}
          <SortArrow col={col} sort={sort} />
        </span>
        {filterOptions && (
          <ColumnFilter
            options={filterOptions}
            selected={filterSelected ?? null}
            onChange={onFilterChange!}
          />
        )}
      </div>
      {onResize && <ResizeHandle onMouseDown={onResize} />}
    </th>
  );
}
