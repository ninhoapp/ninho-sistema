'use client';

/**
 * Rastreio do link /c/<código> (cliques, downloads, cadastros, assinantes e
 * cancelamentos). Padrão das tabelas do painel (CadastrosConsultora,
 * UsuariosTable): por padrão mostra o TOTAL do período num quadro; o seletor ao
 * lado do título troca para um mês. Embaixo, mês a mês, com ordenação.
 */
import { useMemo, useState } from 'react';
import type { MesFunil } from '@/lib/consultoras';
import { useTextos } from '@/components/consultoras/IdiomaConsultora';
import { ThSort, nextSort, type SortState } from '@/components/admin/ThSort';

type Col = 'mes' | 'cliques' | 'downloads' | 'cadastros' | 'assinantes' | 'cancelamentos';

/**
 * Também usado no painel do dono (consultor/Ficha.tsx): lá o provedor de
 * idioma não existe e useTextos() devolve pt, o texto de sempre.
 */
export function FunilTabela({ meses, indisponivel, titulo }: { meses: MesFunil[]; indisponivel: boolean; titulo?: string }) {
  const r = useTextos().rotina;
  const t = r.funil;
  // Mês por extenso do próprio dicionário (mesmos nomes de nomeMes em pt).
  const mesAno = (mes: string) => r.mesAno(r.meses[Number(mes.split('-')[1]) - 1], mes.slice(0, 4));
  const [escolha, setEscolha] = useState<string>('total');
  const [sort, setSort] = useState<SortState<Col> | null>(null);

  const total = useMemo(
    () =>
      meses.reduce(
        (s, m) => ({
          cliques: s.cliques + m.cliques,
          cliquesUnicos: s.cliquesUnicos + m.cliquesUnicos,
          downloads: s.downloads + m.downloads,
          cadastros: s.cadastros + m.cadastros,
          assinantes: s.assinantes + m.assinantes,
          cancelamentos: s.cancelamentos + m.cancelamentos,
        }),
        { cliques: 0, cliquesUnicos: 0, downloads: 0, cadastros: 0, assinantes: 0, cancelamentos: 0 },
      ),
    [meses],
  );
  const atual = escolha === 'total' ? total : meses.find((m) => m.mes === escolha) ?? total;
  const linhas = useMemo(() => {
    const r = [...meses].reverse();
    if (!sort) return r;
    const k = sort.key;
    return [...r].sort((a, b) => {
      const x = k === 'mes' ? a.mes.localeCompare(b.mes) : a[k] - b[k];
      return sort.dir === 'asc' ? x : -x;
    });
  }, [meses, sort]);

  const traco = indisponivel ? '—' : null;
  const quadro: [string, string | number][] = [
    [t.cliques, traco ?? `${atual.cliques} (${atual.cliquesUnicos})`],
    [t.downloads, traco ?? atual.downloads],
    [t.cadastros, atual.cadastros],
    [t.assinaram, atual.assinantes],
    [t.cancelaram, atual.cancelamentos],
  ];
  const th = (col: Col, label: string, className = '') => (
    <ThSort<Col> col={col} label={label} className={className} sort={sort} onSort={(k) => setSort((p) => nextSort(p, k))} />
  );

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[13px] font-extrabold text-ninho-grafite">{titulo ?? t.titulo}</p>
        <select
          value={escolha}
          onChange={(e) => setEscolha(e.target.value)}
          aria-label={t.periodo}
          className="h-8 rounded-pill border border-ninho-borda bg-white px-3 text-[12.5px] font-semibold text-ninho-grafite outline-none focus:border-ninho-roxo"
        >
          <option value="total">{t.total(meses.length)}</option>
          {[...meses].reverse().map((m) => (
            <option key={m.mes} value={m.mes}>{mesAno(m.mes)}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {quadro.map(([k, v]) => (
          <div key={k} className="rounded-xl border border-ninho-borda bg-white p-3">
            <p className="text-[10.5px] font-semibold uppercase tracking-wide text-ninho-cinza">{k}</p>
            <p className="mt-0.5 text-xl font-bold tabular-nums text-ninho-roxo-escuro">{v}</p>
          </div>
        ))}
      </div>
      <details className="mt-2">
        <summary className="cursor-pointer text-[12.5px] font-semibold text-ninho-roxo-escuro">{t.verMesAMes}</summary>
        <div className="admin-scroll mt-2 overflow-x-auto rounded-2xl border border-ninho-borda bg-white">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="text-[11px] font-semibold uppercase tracking-wide text-ninho-cinza">
              <tr className="border-b border-ninho-borda">
                {th('mes', t.mes)}
                {th('cliques', t.cliques, 'text-right')}
                {th('downloads', t.downloads, 'text-right')}
                {th('cadastros', t.cadastros, 'text-right')}
                {th('assinantes', t.assinaram, 'text-right')}
                {th('cancelamentos', t.cancelaram, 'text-right')}
              </tr>
            </thead>
            <tbody className="divide-y divide-ninho-borda">
              {linhas.map((m) => (
                <tr key={m.mes}>
                  <td className="px-3 py-2.5 font-semibold text-ninho-grafite">{mesAno(m.mes)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{traco ?? `${m.cliques} (${m.cliquesUnicos})`}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{traco ?? m.downloads}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{m.cadastros}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{m.assinantes}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{m.cancelamentos}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
      <p className="mt-2 text-[11.5px] leading-snug text-ninho-cinza">
        {indisponivel ? t.indisponivel : ''}
        {t.explica}
      </p>
    </div>
  );
}
