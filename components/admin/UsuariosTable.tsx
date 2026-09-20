'use client';

import { useState, useMemo, useRef, useCallback } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { excluirUsuarios, type ExclusaoState } from '@/app/admin/(painel)/admin-actions';
import { STATUS_ASSINANTE, type StatusConta } from '@/lib/app-users';
import type { PreviaExclusao } from '@/lib/painel/store';
import { PasswordInput } from '@/components/admin/PasswordInput';
import { ColumnFilter, applyColumnFilters } from '@/components/admin/ColumnFilter';
import { ExportExcelButton } from '@/components/admin/ExportExcelButton';
import { CopyAll } from '@/components/admin/CopyAll';

export interface UsuarioRow {
  id: string;
  name: string | null;
  email: string | null;
  /** Não é coluna — só usado na busca por texto. */
  phone: string | null;
  created_at: string;
  status: StatusConta;
  /** Data em que o acesso vigente acaba — trial ou ciclo pago, já resolvida.
   *  Alimenta a coluna Dias. */
  expiraEm: string | null;
  /** Registros reais do usuário (regra da view `registros_reais`). Rótulo
   *  na tela: "Lançamentos". */
  registros: number;
  /** Dias distintos COM registro — usado só no tooltip de Lançamentos. */
  diasRegistro: number;
  /** Dias distintos COM abertura do app — usado só no tooltip de Lançamentos. */
  diasAbertura: number;
  sistema: 'ios' | 'android' | 'web' | null;
  appVersion: string | null;
}

const STATUS_STYLE: Record<StatusConta, string> = {
  'Free trial ativo': 'bg-ninho-roxo-suave text-ninho-roxo-escuro',
  'Free trial expirado': 'bg-[#FDF0E4] text-[#9A5B1E]',
  'Premium mensal': 'bg-[#E4F5EC] text-[#2E7D51]',
  'Premium anual': 'bg-[#E4F5EC] text-[#2E7D51]',
  'Básico mensal': 'bg-[#E4F5EC] text-[#2E7D51]',
  'Básico anual': 'bg-[#E4F5EC] text-[#2E7D51]',
  Churn: 'bg-red-50 text-red-600',
  Cadastrado: 'bg-ninho-nuvem text-ninho-cinza',
};

// Toda coluna ordena e filtra — as duas listas cobrem as 8, na mesma ordem
// em que aparecem na tabela.
type SortKey =
  | 'nome' | 'created_at' | 'registros' | 'status'
  | 'dias' | 'sistema' | 'versao' | 'email';

type SortDir = 'asc' | 'desc';
type FilterCol = SortKey;

type StatKey = 'total' | 'hoje' | 'assinantes' | 'trial_ativo' | 'trial_expirado';

// Larguras padrão em px, na ordem das células: a primeira é a caixinha de
// seleção (que não ordena nem filtra), as outras seguem CABECALHOS.
const DEFAULT_COL_WIDTHS = [40, 170, 90, 110, 130, 70, 80, 80, 200];

// Fuso do Brasil: é onde estão os usuários e é a virada de dia que o time
// enxerga. "Hoje" e as datas da tabela seguem ele, não o fuso do navegador
// de quem abre o painel.
const TZ = 'America/Sao_Paulo';

function fmt(s: string | null): string {
  if (!s) return '—';
  return new Date(s).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: '2-digit', timeZone: TZ,
  });
}

/** Data (yyyy-mm-dd) no fuso do Brasil, pra "hoje" bater com a virada do dia. */
function tzDateString(d: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

function dias(r: UsuarioRow): number | null {
  if (!r.expiraEm) return null;
  return Math.ceil((new Date(r.expiraEm).getTime() - Date.now()) / 86400000);
}

function diasLabel(d: number | null): string {
  if (d === null) return '—';
  if (d < 0) return `${Math.abs(d)}d atrás`;
  if (d === 0) return 'Hoje';
  return `${d}d`;
}

function diasClass(d: number | null): string {
  if (d === null) return 'text-ninho-cinza';
  if (d < 0) return 'text-red-500 font-semibold';
  if (d <= 3) return 'text-red-400 font-semibold';
  if (d <= 7) return 'text-[#9A5B1E] font-medium';
  return 'text-ninho-grafite';
}

function sistemaLabel(r: UsuarioRow): string {
  if (r.sistema === 'ios') return 'iOS';
  if (r.sistema === 'android') return 'Android';
  if (r.sistema === 'web') return 'Web';
  return '—';
}

/** Valor textual de cada coluna — é o que o filtro da setinha lista e
 *  compara. Precisa bater EXATAMENTE com o que a célula mostra, senão o
 *  usuário marca um valor no filtro e some linha que estava na tela. */
function colValue(r: UsuarioRow, col: FilterCol): string {
  switch (col) {
    case 'nome':       return r.name || '—';
    case 'email':      return r.email || '—';
    case 'created_at': return fmt(r.created_at);
    case 'status':     return r.status;
    case 'registros':  return String(r.registros);
    case 'dias':       return diasLabel(dias(r));
    case 'sistema':    return sistemaLabel(r);
    case 'versao':     return r.appVersion || '—';
  }
}

/** Cabeçalhos na ordem exata das células do corpo e das larguras em
 *  DEFAULT_COL_WIDTHS (deslocadas em 1 por causa da caixa de seleção).
 *  Mexer aqui exige mexer nos três. */
const CABECALHOS: [SortKey, string][] = [
  ['nome', 'Nome'],
  ['created_at', 'Criou em'],
  ['registros', 'Lançamentos'],
  ['status', 'Status'],
  ['dias', 'Dias'],
  ['sistema', 'Sistema'],
  ['versao', 'Versão'],
  ['email', 'E-mail'],
];

/** Todas as colunas, na ordem da tabela. Toda uma delas ordena e filtra. */
const COLUNAS: SortKey[] = CABECALHOS.map(([c]) => c);

/** Colunas cujo filtro lista valores numéricos (ordena por número, não por
 *  texto — senão 10 vem antes de 2). */
const COLUNAS_NUMERICAS: Set<FilterCol> = new Set(['registros']);

function SortArrow({ col, sort }: { col: SortKey; sort: { key: SortKey; dir: SortDir } | null }) {
  if (!sort || sort.key !== col) return <span className="ml-1 text-ninho-borda opacity-70">↕</span>;
  return <span className="ml-1 text-ninho-roxo">{sort.dir === 'asc' ? '↑' : '↓'}</span>;
}

/** Cabeçalho de coluna com sort + filtro opcional.
 *  DEVE ficar fora do componente UsuariosTable — se ficar dentro, o React
 *  recria a referência da função a cada render e desmonta/remonta o th
 *  inteiro, fazendo o dropdown do ColumnFilter fechar ao marcar um item. */
function ThSort({
  col, label, className = '', onResize,
  filterOptions, filterSelected, onFilterChange,
  sort, onSort,
}: {
  col: SortKey; label: string; className?: string;
  onResize?: (e: React.MouseEvent) => void;
  filterOptions?: string[];
  filterSelected?: Set<string> | null;
  onFilterChange?: (v: Set<string> | null) => void;
  sort: { key: SortKey; dir: SortDir } | null;
  onSort: (key: SortKey) => void;
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

/** Scrollbar dupla sincronizada (topo + fundo) — a tabela é mais larga que
 *  a tela, e sem a de cima só dá pra rolar chegando ao fim da lista. */
function DualScrollTable({ children, minWidth }: { children: React.ReactNode; minWidth: number }) {
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

function BotaoConfirmar() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-pill bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
    >
      {pending ? 'Excluindo...' : 'Excluir definitivamente'}
    </button>
  );
}

export function UsuariosTable({
  rows,
  previas,
}: {
  rows: UsuarioRow[];
  /** Prévia de impacto por usuário, calculada no servidor. */
  previas: Record<string, PreviaExclusao>;
}) {
  const [busca, setBusca] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [colWidths, setColWidths] = useState<number[]>(DEFAULT_COL_WIDTHS);
  const dragRef = useRef<{ col: number; startX: number; startW: number } | null>(null);

  const startResize = useCallback((e: React.MouseEvent, col: number) => {
    e.preventDefault();
    dragRef.current = { col, startX: e.clientX, startW: colWidths[col] };
    function onMove(ev: MouseEvent) {
      if (!dragRef.current) return;
      const { col: c, startX, startW } = dragRef.current;
      setColWidths((prev) => {
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
  }, [colWidths]);

  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir } | null>(null);
  const [colFilters, setColFilters] = useState<Record<FilterCol, Set<string> | null>>(
    () => Object.fromEntries(COLUNAS.map((c) => [c, null])) as Record<FilterCol, Set<string> | null>
  );
  const [statFilter, setStatFilter] = useState<StatKey>('total');

  const [sel, setSel] = useState<Set<string>>(new Set());
  const [confirmando, setConfirmando] = useState(false);
  const [state, action] = useFormState<ExclusaoState, FormData>(excluirUsuarios, {});

  function setColFilter(col: FilterCol, next: Set<string> | null) {
    setColFilters((prev) => ({ ...prev, [col]: next }));
  }

  const hojeStr = useMemo(() => tzDateString(new Date()), []);

  const statCounts = useMemo(
    () => ({
      total: rows.length,
      hoje: rows.filter((r) => tzDateString(new Date(r.created_at)) === hojeStr).length,
      assinantes: rows.filter((r) => STATUS_ASSINANTE.includes(r.status)).length,
      trial_ativo: rows.filter((r) => r.status === 'Free trial ativo').length,
      trial_expirado: rows.filter((r) => r.status === 'Free trial expirado').length,
    }),
    [rows, hojeStr]
  );

  const statCards: { key: StatKey; label: string; value: number }[] = [
    { key: 'total', label: 'Total', value: statCounts.total },
    { key: 'hoje', label: 'Novos usuários hoje', value: statCounts.hoje },
    { key: 'assinantes', label: 'Assinantes', value: statCounts.assinantes },
    { key: 'trial_ativo', label: 'Trial ativo', value: statCounts.trial_ativo },
    { key: 'trial_expirado', label: 'Trial expirado', value: statCounts.trial_expirado },
  ];

  /** Opções do filtro de cada coluna, derivadas das linhas de verdade —
   *  assim nenhuma lista fica desatualizada quando surge um valor novo. */
  const filterOptions = useMemo(() => {
    const out = {} as Record<FilterCol, string[]>;
    for (const col of COLUNAS) {
      const vals = Array.from(new Set(rows.map((r) => colValue(r, col))));
      if (COLUNAS_NUMERICAS.has(col)) {
        vals.sort((a, b) => Number(a) - Number(b));
      } else {
        vals.sort((a, b) => a.localeCompare(b, 'pt-BR'));
      }
      out[col] = vals;
    }
    return out;
  }, [rows]);

  function toggleSort(key: SortKey) {
    setSort((prev) => {
      if (prev?.key === key) return prev.dir === 'asc' ? { key, dir: 'desc' } : null;
      return { key, dir: 'asc' };
    });
  }

  function limpar() {
    setBusca('');
    setDateFrom('');
    setDateTo('');
    setSort(null);
    setColFilters(
      Object.fromEntries(COLUNAS.map((c) => [c, null])) as Record<FilterCol, Set<string> | null>
    );
    setStatFilter('total');
  }

  const filteredRows = useMemo(() => {
    let r = [...rows];

    if (statFilter === 'hoje') r = r.filter((u) => tzDateString(new Date(u.created_at)) === hojeStr);
    if (statFilter === 'assinantes') r = r.filter((u) => STATUS_ASSINANTE.includes(u.status));
    if (statFilter === 'trial_ativo') r = r.filter((u) => u.status === 'Free trial ativo');
    if (statFilter === 'trial_expirado') r = r.filter((u) => u.status === 'Free trial expirado');

    if (busca.trim()) {
      const q = busca.trim().toLowerCase();
      r = r.filter(
        (u) =>
          u.name?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q) ||
          u.phone?.includes(q)
      );
    }

    if (dateFrom) r = r.filter((u) => tzDateString(new Date(u.created_at)) >= dateFrom);
    if (dateTo) r = r.filter((u) => tzDateString(new Date(u.created_at)) <= dateTo);

    r = applyColumnFilters(r, colFilters, colValue);

    if (sort) {
      r.sort((a, b) => {
        let cmp = 0;
        switch (sort.key) {
          case 'nome': cmp = (a.name ?? '').localeCompare(b.name ?? '', 'pt-BR'); break;
          case 'email': cmp = (a.email ?? '').localeCompare(b.email ?? '', 'pt-BR'); break;
          case 'created_at': cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime(); break;
          case 'status': cmp = a.status.localeCompare(b.status, 'pt-BR'); break;
          case 'registros': cmp = a.registros - b.registros; break;
          case 'dias': cmp = (dias(a) ?? Infinity) - (dias(b) ?? Infinity); break;
          case 'sistema': cmp = sistemaLabel(a).localeCompare(sistemaLabel(b), 'pt-BR'); break;
          case 'versao': cmp = (a.appVersion ?? '').localeCompare(b.appVersion ?? '', 'pt-BR'); break;
        }
        return sort.dir === 'asc' ? cmp : -cmp;
      });
    }

    return r;
  }, [rows, busca, dateFrom, dateTo, colFilters, sort, statFilter, hojeStr]);

  const hasColFilter = Object.values(colFilters).some((v) => v !== null);
  const hasFilter = busca || sort || hasColFilter || statFilter !== 'total' || dateFrom || dateTo;

  // A seleção só vale pra quem está VISÍVEL — filtrou, sai da conta (e da
  // exclusão). Sem isso dava pra apagar alguém que já nem está na tela.
  const visiveisIds = useMemo(() => new Set(filteredRows.map((r) => r.id)), [filteredRows]);
  const ids = useMemo(() => Array.from(sel).filter((id) => visiveisIds.has(id)), [sel, visiveisIds]);

  // Soma o impacto de tudo que está selecionado, pra confirmação ser concreta.
  const impacto = useMemo(
    () =>
      ids.reduce(
        (acc, id) => {
          const p = previas[id];
          if (!p) return acc;
          return {
            bebesApagados: acc.bebesApagados + p.bebes_exclusivos,
            bebesTransferidos: acc.bebesTransferidos + p.bebes_transferidos,
            registros: acc.registros + p.registros,
            fotos: acc.fotos + p.fotos,
          };
        },
        { bebesApagados: 0, bebesTransferidos: 0, registros: 0, fotos: 0 }
      ),
    [ids, previas]
  );

  function toggle(id: string) {
    setSel((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  function toggleTodos() {
    setSel(ids.length === filteredRows.length ? new Set() : new Set(filteredRows.map((u) => u.id)));
  }

  // Exporta exatamente o que está na tela (já filtrado/ordenado), não a lista bruta.
  const exportRows = useMemo(
    () =>
      filteredRows.map((r) => ({
        Nome: r.name || '',
        'Criou em': fmt(r.created_at),
        Lançamentos: r.registros,
        Status: r.status,
        Dias: diasLabel(dias(r)),
        Sistema: r.sistema ? sistemaLabel(r) : '',
        Versão: r.appVersion || '',
        'E-mail': r.email || '',
      })),
    [filteredRows]
  );

  const TABLE_MIN_W = colWidths.reduce((a, b) => a + b, 0);

  // Sucesso: limpa a seleção e mostra o que de fato aconteceu.
  if (state.ok && state.resumo && confirmando) {
    return (
      <div className="rounded-2xl border border-ninho-borda bg-white p-6">
        <p className="text-sm font-semibold text-ninho-grafite">
          {state.resumo.usuarios}{' '}
          {state.resumo.usuarios === 1 ? 'usuário excluído' : 'usuários excluídos'}.
        </p>
        <p className="mt-1 text-sm text-ninho-cinza">
          {state.resumo.bebesApagados}{' '}
          {state.resumo.bebesApagados === 1 ? 'bebê apagado' : 'bebês apagados'}
          {state.resumo.bebesTransferidos > 0 &&
            `, ${state.resumo.bebesTransferidos} transferido(s) para outro cuidador`}
          .
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 rounded-pill bg-ninho-roxo px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-ninho-roxo-escuro"
        >
          Atualizar lista
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* ── Cards clicáveis (filtro rápido) ──────────────────────────── */}
      <section className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-5">
        {statCards.map(({ key, label, value }) => {
          const active = statFilter === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setStatFilter(active ? 'total' : key)}
              className={[
                'rounded-2xl border p-5 text-left transition-all',
                active
                  ? 'border-ninho-roxo bg-ninho-roxo-suave ring-2 ring-ninho-roxo'
                  : 'border-ninho-borda bg-white hover:border-ninho-roxo hover:bg-ninho-roxo-suave',
              ].join(' ')}
            >
              <p className="text-xs uppercase tracking-wide text-ninho-cinza">{label}</p>
              <p className="mt-1 text-3xl font-bold text-ninho-roxo-escuro">{value}</p>
              {active && key !== 'total' && (
                <p className="mt-1 text-xs text-ninho-roxo-escuro">filtro ativo</p>
              )}
            </button>
          );
        })}
      </section>

      {/* ── Painel de filtros ─────────────────────────────────────────── */}
      <section className="mb-4 rounded-2xl border border-ninho-borda bg-white p-4">
        {/* Linha 0: filtro por data de cadastro */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="whitespace-nowrap text-xs font-medium text-ninho-cinza">Criou entre:</span>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-pill border border-ninho-borda px-3 py-1.5 text-xs text-ninho-grafite focus:border-ninho-roxo focus:outline-none"
          />
          <span className="text-xs text-ninho-cinza">e</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-pill border border-ninho-borda px-3 py-1.5 text-xs text-ninho-grafite focus:border-ninho-roxo focus:outline-none"
          />
          {(dateFrom || dateTo) && (
            <button
              type="button"
              onClick={() => { setDateFrom(''); setDateTo(''); }}
              className="text-xs text-ninho-cinza hover:text-red-500"
            >
              ✕ limpar datas
            </button>
          )}
        </div>

        {/* Linha 1: busca + ações */}
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <div className="relative min-w-[200px] flex-1">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-ninho-cinza">
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            </span>
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome, e-mail ou WhatsApp..."
              className="w-full rounded-pill border border-ninho-borda py-2 pl-9 pr-4 text-sm text-ninho-grafite placeholder:text-ninho-cinza focus:border-ninho-roxo focus:outline-none"
            />
          </div>

          {hasFilter && (
            <button
              type="button"
              onClick={limpar}
              className="rounded-pill border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-500 transition hover:bg-red-100"
            >
              ✕ Limpar tudo
            </button>
          )}

          <CopyAll
            label="Copiar e-mails"
            values={filteredRows.map((r) => r.email).filter((e): e is string => Boolean(e))}
          />
          <ExportExcelButton rows={exportRows} filename="ninho-usuarios" sheetName="Usuários" />

          <span className="ml-auto text-xs text-ninho-cinza">
            {filteredRows.length} de {rows.length} usuário{rows.length !== 1 ? 's' : ''}
          </span>
        </div>

        <p className="text-xs text-ninho-cinza">
          Toda coluna ordena (clique no título) e filtra (seta ▾ no cabeçalho). Listas com muitos
          valores têm busca dentro do filtro.
        </p>
      </section>

      {/* ── Barra de seleção ──────────────────────────────────────────── */}
      {ids.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ninho-roxo bg-ninho-roxo-suave px-5 py-3">
          <span className="text-sm font-medium text-ninho-roxo-escuro">
            {ids.length} {ids.length === 1 ? 'usuário selecionado' : 'usuários selecionados'}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setSel(new Set())}
              className="rounded-pill border border-ninho-roxo px-4 py-2 text-xs font-medium text-ninho-roxo-escuro transition hover:bg-white"
            >
              Limpar seleção
            </button>
            <button
              onClick={() => setConfirmando(true)}
              className="rounded-pill bg-red-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-700"
            >
              Excluir {ids.length === 1 ? 'usuário' : 'usuários'}
            </button>
          </div>
        </div>
      )}

      {confirmando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-full w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6">
            <h2 className="text-lg font-bold text-ninho-grafite">
              Excluir {ids.length} {ids.length === 1 ? 'usuário' : 'usuários'}?
            </h2>
            <p className="mt-2 text-sm text-ninho-cinza">
              Isso é definitivo e não tem desfazer. Não é só a conta — some tudo que estiver
              vinculado a ela.
            </p>

            <div className="mt-4 rounded-xl bg-ninho-nuvem p-4 text-sm">
              <p className="mb-2 font-semibold text-ninho-grafite">O que vai ser apagado:</p>
              <ul className="flex flex-col gap-1 text-ninho-cinza">
                <li>
                  <strong className="text-ninho-grafite">{impacto.bebesApagados}</strong>{' '}
                  {impacto.bebesApagados === 1 ? 'bebê' : 'bebês'} — com rotina, vacinas,
                  crescimento, consultas e álbuns
                </li>
                <li>
                  <strong className="text-ninho-grafite">{impacto.registros}</strong> registros de
                  rotina
                </li>
                <li>
                  <strong className="text-ninho-grafite">{impacto.fotos}</strong> fotos
                </li>
              </ul>
              {impacto.bebesTransferidos > 0 && (
                <p className="mt-3 border-t border-ninho-borda pt-3 text-ninho-grafite">
                  <strong>{impacto.bebesTransferidos}</strong>{' '}
                  {impacto.bebesTransferidos === 1 ? 'bebê' : 'bebês'} não{' '}
                  {impacto.bebesTransferidos === 1 ? 'será apagado' : 'serão apagados'}: tem outro
                  cuidador na conta e a posse passa para ele.
                </p>
              )}
            </div>

            <form action={action} className="mt-5 flex flex-col gap-3">
              <input type="hidden" name="ids" value={ids.join(',')} />
              {state.error && (
                <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{state.error}</div>
              )}
              <label className="text-xs text-ninho-cinza">
                Digite sua senha de administrador para confirmar
                <div className="mt-1">
                  <PasswordInput name="senha" placeholder="Sua senha" autoComplete="current-password" />
                </div>
              </label>
              <div className="flex flex-wrap gap-2">
                <BotaoConfirmar />
                <button
                  type="button"
                  onClick={() => setConfirmando(false)}
                  className="rounded-pill border border-ninho-borda px-5 py-2.5 text-sm font-medium text-ninho-cinza transition hover:border-ninho-roxo hover:text-ninho-roxo"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Tabela com scrollbar dupla ────────────────────────────────── */}
      <section>
        <DualScrollTable minWidth={TABLE_MIN_W}>
          <colgroup>
            {colWidths.map((w, i) => (
              <col key={i} style={{ width: w }} />
            ))}
          </colgroup>
          <thead>
            <tr className="border-b-2 border-ninho-borda text-left text-xs font-medium text-ninho-cinza">
              <th className="border-r border-ninho-borda p-3">
                <input
                  type="checkbox"
                  checked={filteredRows.length > 0 && ids.length === filteredRows.length}
                  onChange={toggleTodos}
                  aria-label="Selecionar todos"
                  className="accent-ninho-roxo"
                />
              </th>
              {/* Uma fonte só pro cabeçalho: toda coluna ordena e filtra, sem
                  exceção escrita à mão que possa ficar pra trás. */}
              {CABECALHOS.map(([col, label], i) => (
                <ThSort
                  key={col}
                  col={col}
                  label={label}
                  onResize={(e) => startResize(e, i + 1)}
                  filterOptions={filterOptions[col]}
                  filterSelected={colFilters[col]}
                  onFilterChange={(v) => setColFilter(col, v)}
                  sort={sort}
                  onSort={toggleSort}
                />
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 && (
              <tr>
                <td colSpan={CABECALHOS.length + 1} className="p-6 text-center text-ninho-cinza">
                  {rows.length === 0
                    ? 'Nenhum usuário cadastrado ainda.'
                    : 'Sem usuários com esses filtros.'}
                </td>
              </tr>
            )}
            {filteredRows.map((r) => {
              const d = dias(r);
              const marcado = sel.has(r.id);
              return (
                <tr
                  key={r.id}
                  className={`border-b border-ninho-borda transition-colors ${
                    marcado ? 'bg-ninho-roxo-suave/40' : 'hover:bg-ninho-nuvem'
                  }`}
                >
                  {/* A ordem daqui tem que espelhar CABECALHOS e DEFAULT_COL_WIDTHS. */}
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={marcado}
                      onChange={() => toggle(r.id)}
                      aria-label={`Selecionar ${r.name || r.email || 'usuário'}`}
                      className="accent-ninho-roxo"
                    />
                  </td>
                  <td className="p-3">
                    <div className="truncate font-medium text-ninho-grafite" title={r.name ?? undefined}>
                      {r.name || '—'}
                    </div>
                  </td>
                  <td className="overflow-hidden p-3 text-ninho-cinza">
                    <div className="truncate">{fmt(r.created_at)}</div>
                  </td>
                  <td
                    className="overflow-hidden p-3 text-right font-medium tabular-nums text-ninho-grafite"
                    title={`${r.diasRegistro} dia(s) registrando · ${r.diasAbertura} dia(s) abrindo o app`}
                  >
                    {r.registros}
                  </td>
                  <td className="overflow-hidden p-3">
                    <span className={`rounded-pill px-2 py-0.5 text-xs ${STATUS_STYLE[r.status]}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className={`overflow-hidden p-3 tabular-nums ${diasClass(d)}`}>
                    <div className="truncate">{diasLabel(d)}</div>
                  </td>
                  <td className="overflow-hidden p-3">
                    {r.sistema ? (
                      <span className="rounded-pill bg-ninho-nuvem px-2 py-0.5 text-xs font-medium text-ninho-grafite">
                        {sistemaLabel(r)}
                      </span>
                    ) : (
                      <span className="text-ninho-cinza">—</span>
                    )}
                  </td>
                  <td className="overflow-hidden p-3 text-ninho-cinza">
                    <div className="truncate font-mono text-xs">{r.appVersion || '—'}</div>
                  </td>
                  <td className="p-3">
                    <div className="truncate text-ninho-grafite" title={r.email ?? undefined}>
                      {r.email || '—'}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </DualScrollTable>
      </section>

      <p className="mt-3 text-xs text-ninho-cinza">
        <strong>Lançamentos:</strong> registros reais do usuário — momentos e ações do bebê (regra
        da view <code>registros_reais</code>) — o tooltip mostra em quantos dias distintos ele
        registrou e abriu o app.{' '}
        <strong>Versão/Sistema</strong> vêm do aparelho mais recente com push token: ficam vazios
        pra quem recusou notificações.
      </p>
    </div>
  );
}
