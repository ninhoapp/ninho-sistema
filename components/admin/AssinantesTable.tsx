'use client';

import { useMemo, useState } from 'react';
import type { AppUser } from '@/lib/app-users';
import { ColumnFilter, applyColumnFilters } from '@/components/admin/ColumnFilter';
import { ExportExcelButton } from '@/components/admin/ExportExcelButton';
import { CopyAll } from '@/components/admin/CopyAll';
import { formatBRL, formatDate, monthlyRevenueForUser } from '@/lib/metrics';
import { liquido } from '@/lib/precos';

type Col = 'plano';

/** Quem está pagando hoje, com o valor que cada um traz por mês. */
export function AssinantesTable({ rows }: { rows: AppUser[] }) {
  const [colFilters, setColFilters] = useState<Record<Col, Set<string> | null>>({ plano: null });

  const planoDe = (u: AppUser) => (u.plan_interval === 'anual' ? 'Anual' : 'Mensal');

  const opcoesPlano = useMemo(
    () => Array.from(new Set(rows.map(planoDe))).sort(),
    [rows]
  );

  const filtradas = useMemo(
    () => applyColumnFilters(rows, colFilters, (u) => planoDe(u)),
    [rows, colFilters]
  );

  const totalBruto = filtradas.reduce((s, u) => s + monthlyRevenueForUser(u), 0);

  const paraExcel = filtradas.map((u) => ({
    Nome: u.name || '',
    'E-mail': u.email || '',
    Plano: planoDe(u),
    'Receita mensal bruta': monthlyRevenueForUser(u),
    'Receita mensal líquida': liquido(monthlyRevenueForUser(u)),
    'Renova em': u.current_period_end
      ? new Date(u.current_period_end).toLocaleDateString('pt-BR')
      : '',
    Cadastro: new Date(u.created_at).toLocaleDateString('pt-BR'),
  }));

  const emails = filtradas.map((u) => u.email).filter((e): e is string => Boolean(e));

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-bold text-ninho-grafite">
          Assinantes{' '}
          <span className="ml-1 rounded-pill bg-ninho-roxo-suave px-2.5 py-0.5 text-xs font-semibold text-ninho-roxo-escuro">
            {filtradas.length}
          </span>
        </h2>
        <div className="flex flex-wrap gap-2">
          <CopyAll label="Copiar e-mails" values={emails} />
          <ExportExcelButton rows={paraExcel} filename="ninho-assinantes" sheetName="Assinantes" />
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-ninho-borda bg-white p-8 text-center text-sm text-ninho-cinza">
          Nenhum assinante ainda. Quando a cobrança entrar no app e alguém pagar, aparece aqui.
        </div>
      ) : (
        <div className="admin-scroll overflow-x-auto rounded-2xl border border-ninho-borda bg-white">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead>
              <tr className="border-b border-ninho-borda">
                {['Nome', 'E-mail'].map((h) => (
                  <th
                    key={h}
                    className="whitespace-nowrap px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-ninho-cinza"
                  >
                    {h}
                  </th>
                ))}
                {/* sem overflow-hidden aqui: o dropdown do ColumnFilter precisa "escapar" da célula */}
                <th className="whitespace-nowrap px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-ninho-cinza">
                  Plano
                  <ColumnFilter
                    options={opcoesPlano}
                    selected={colFilters.plano}
                    onChange={(v) => setColFilters((p) => ({ ...p, plano: v }))}
                  />
                </th>
                {['Receita/mês', 'Renova em', 'Cadastro'].map((h) => (
                  <th
                    key={h}
                    className="whitespace-nowrap px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-ninho-cinza"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-ninho-borda">
              {filtradas.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-3 font-medium text-ninho-grafite">{u.name || '—'}</td>
                  <td className="px-4 py-3 text-ninho-cinza">{u.email || '—'}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-pill bg-ninho-roxo-suave px-2.5 py-1 text-[11px] font-semibold text-ninho-roxo-escuro">
                      {planoDe(u)}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-semibold text-ninho-grafite">
                    {formatBRL(monthlyRevenueForUser(u))}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-ninho-cinza">
                    {formatDate(u.current_period_end)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-ninho-cinza">
                    {formatDate(u.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-ninho-borda bg-ninho-nuvem">
                <td colSpan={3} className="px-4 py-3 text-xs font-semibold uppercase text-ninho-cinza">
                  Total bruto · líquido
                </td>
                <td colSpan={3} className="px-4 py-3 font-bold text-ninho-roxo-escuro">
                  {formatBRL(totalBruto)}{' '}
                  <span className="font-medium text-ninho-cinza">
                    · {formatBRL(liquido(totalBruto))} líquido
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </>
  );
}
