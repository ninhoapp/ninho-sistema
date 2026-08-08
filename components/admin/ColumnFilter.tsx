'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Filtro de coluna estilo planilha: seta que abre uma lista de valores
 * únicos daquela coluna, marcáveis individualmente. `selected === null`
 * significa "todos selecionados" (sem filtro ativo).
 */
export function ColumnFilter({
  options,
  selected,
  onChange,
}: {
  options: string[];
  selected: Set<string> | null;
  onChange: (next: Set<string> | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [busca, setBusca] = useState('');
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  const active = selected !== null && selected.size < options.length;
  const effective = selected ?? new Set(options);
  const visiveis = busca.trim()
    ? options.filter((o) => o.toLowerCase().includes(busca.trim().toLowerCase()))
    : options;

  function toggle(v: string) {
    const next = new Set(effective);
    if (next.has(v)) next.delete(v);
    else next.add(v);
    onChange(next.size === options.length ? null : next);
  }

  return (
    <span className="relative inline-block" ref={ref} onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative ml-1 inline-flex h-5 w-5 items-center justify-center rounded text-base font-bold leading-none text-ninho-roxo hover:text-ninho-roxo-escuro"
        title="Filtrar coluna"
      >
        ▾
        {active && (
          <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-ninho-roxo" />
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-full z-30 mt-1 max-h-72 w-56 overflow-hidden rounded-xl border border-ninho-borda bg-white shadow-lg">
          {options.length > 8 && (
            <div className="border-b border-ninho-borda p-2">
              <input
                autoFocus
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar..."
                className="w-full rounded-lg border border-ninho-borda px-2 py-1 text-xs outline-none focus:border-ninho-roxo"
              />
            </div>
          )}
          <div className="flex justify-between border-b border-ninho-borda px-2 py-1.5 text-[11px] font-medium">
            <button
              type="button"
              onClick={() => onChange(null)}
              className="text-ninho-roxo-escuro hover:underline"
            >
              Selecionar todos
            </button>
            <button
              type="button"
              onClick={() => onChange(new Set())}
              className="text-red-500 hover:underline"
            >
              Limpar
            </button>
          </div>
          <div className="admin-scroll max-h-48 overflow-y-auto p-1">
            {visiveis.length === 0 && <p className="p-2 text-xs text-ninho-cinza">Nenhum valor.</p>}
            {visiveis.map((v) => (
              <label
                key={v}
                className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 text-xs text-ninho-grafite hover:bg-ninho-nuvem"
              >
                <input
                  type="checkbox"
                  checked={effective.has(v)}
                  onChange={() => toggle(v)}
                  className="accent-ninho-roxo"
                />
                <span className="truncate">{v || '(vazio)'}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </span>
  );
}

/** Aplica um mapa de filtros de coluna { coluna: Set<valor> | null } a uma lista de linhas. */
export function applyColumnFilters<T, C extends string>(
  rows: T[],
  filters: Record<C, Set<string> | null>,
  getValue: (row: T, col: C) => string
): T[] {
  const activeCols = Object.entries(filters).filter(([, v]) => v !== null) as [C, Set<string>][];
  if (activeCols.length === 0) return rows;
  return rows.filter((r) => activeCols.every(([col, set]) => set.has(getValue(r, col))));
}
