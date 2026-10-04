'use client';

import { useMemo, useState } from 'react';
import type { AppUser } from '@/lib/app-users';
import { ColumnFilter, applyColumnFilters } from '@/components/admin/ColumnFilter';
import { ExportExcelButton } from '@/components/admin/ExportExcelButton';
import { CopyAll } from '@/components/admin/CopyAll';
import {
  formatBRL,
  formatDate,
  monthlyRevenueForUser,
  priceForUser,
  planoLabel,
  cicloDoUsuario,
  receitaNoMes,
} from '@/lib/metrics';
import { liquido } from '@/lib/precos';

type Col = 'plano';

/**
 * Quem está pagando hoje.
 *
 * DUAS colunas de dinheiro, que respondem perguntas diferentes:
 *   "Valor cobrado"  = o que a loja tira por cobrança (anual = o ano inteiro).
 *   "Entrou em <mês>" = caixa: o valor cheio no mês em que a loja cobrou, e
 *                      R$ 0,00 nos outros. Um anual comprado em outubro mostra
 *                      R$ 129,90 em outubro e zero de novembro a setembro.
 *
 * A soma do rodapé é a do mês selecionado — bate com a "Receita bruta" do topo
 * da página, que é o mesmo número.
 */
export function AssinantesTable({ rows, mes }: { rows: AppUser[]; mes: string }) {
  const [colFilters, setColFilters] = useState<Record<Col, Set<string> | null>>({ plano: null });

  // Tier + ciclo: "Premium anual", "Básico mensal". Antes mostrava só o ciclo,
  // e não dava pra distinguir um Básico de um Premium na tela.
  const planoDe = (u: AppUser) => planoLabel(u);

  const opcoesPlano = useMemo(
    () => Array.from(new Set(rows.map(planoDe))).sort((a, b) => a.localeCompare(b, 'pt-BR')),
    [rows]
  );

  const filtradas = useMemo(
    () => applyColumnFilters(rows, colFilters, (u) => planoDe(u)),
    [rows, colFilters]
  );

  // Caixa do mês selecionado — é o que soma no rodapé e bate com o topo da página.
  const totalBruto = filtradas.reduce((s, u) => s + receitaNoMes(u, mes), 0);

  const paraExcel = filtradas.map((u) => ({
    Nome: u.name || '',
    'E-mail': u.email || '',
    Plano: planoDe(u),
    'Valor cobrado': priceForUser(u),
    Ciclo: cicloDoUsuario(u),
    [`Entrou em ${mes}`]: receitaNoMes(u, mes),
    'MRR (anual diluído)': monthlyRevenueForUser(u),
    'Assinou em': u.assinouEm ? new Date(u.assinouEm).toLocaleDateString('pt-BR') : '',
    'Renova em': u.current_period_end
      ? new Date(u.current_period_end).toLocaleDateString('pt-BR')
      : '',
    Cadastro: new Date(u.created_at).toLocaleDateString('pt-BR'),
  }));

  const emails = filtradas.map((u) => u.email).filter((e): e is string => Boolean(e));

  const COLS_DEPOIS = [
    'Valor cobrado',
    `Entrou em ${mes}`,
    'Assinou em',
    'Renova em',
    'Cadastro',
  ];

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
          <table className="w-full min-w-[920px] text-left text-sm">
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
                {COLS_DEPOIS.map((h) => (
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
              {filtradas.map((u) => {
                const anual = cicloDoUsuario(u) === 'anual';
                const caixa = receitaNoMes(u, mes);
                return (
                  <tr key={u.id}>
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
                        {planoDe(u)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-semibold text-ninho-grafite">
                      {formatBRL(priceForUser(u))}
                      <span className="ml-1 text-[11px] font-normal text-ninho-cinza">
                        {anual ? '/ano' : '/mês'}
                      </span>
                    </td>
                    <td
                      className={`whitespace-nowrap px-4 py-3 ${
                        caixa > 0 ? 'font-semibold text-ninho-grafite' : 'text-ninho-cinza'
                      }`}
                      title={
                        caixa > 0
                          ? `A loja cobrou nesse mês`
                          : `Sem cobrança em ${mes} — ${anual ? 'o anual só cobra uma vez por ano' : 'assinou depois ou já tinha cancelado'}`
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
              <tr className="border-t border-ninho-borda bg-ninho-nuvem">
                <td colSpan={4} className="px-4 py-3 text-xs font-semibold uppercase text-ninho-cinza">
                  Entrou em {mes} — bruto · líquido
                </td>
                <td colSpan={4} className="px-4 py-3 font-bold text-ninho-roxo-escuro">
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

      <p className="mt-3 text-xs text-ninho-cinza">
        <strong>Valor cobrado</strong> é o que a loja tira por cobrança — no anual, o ano inteiro.{' '}
        <strong>Entrou em {mes}</strong> é caixa: o valor cheio no mês em que a loja cobrou e R$ 0,00
        nos demais, porque o anual paga uma vez só. <strong>Assinou em</strong> vem da primeira
        compra verificada, não da data de cadastro. As datas de cobrança são derivadas da primeira
        compra + um ciclo de cada vez — exatas enquanto ninguém renovou, e substituíveis pelo log
        real quando os webhooks de renovação das lojas começarem a gravar.
      </p>
    </>
  );
}
