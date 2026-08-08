'use client';

import { useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { criarCusto, removerCusto, type ActionState } from '@/app/admin/(painel)/admin-actions';
import type { Cost } from '@/lib/painel/store';
import { formatBRL } from '@/lib/metrics';
import { Tabela, Td } from '@/components/admin/Tabela';

const inputCls =
  'w-full rounded-xl border border-ninho-borda bg-white px-3 py-2 text-sm text-ninho-grafite outline-none focus:border-ninho-roxo';

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-pill bg-ninho-roxo px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-ninho-roxo-escuro disabled:opacity-50"
    >
      {pending ? 'Lançando...' : 'Lançar despesa'}
    </button>
  );
}

function mesAtual(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function CostsManager({ custos }: { custos: Cost[] }) {
  const [state, action] = useFormState<ActionState, FormData>(criarCusto, {});
  const [kind, setKind] = useState<'fixo' | 'variavel'>('fixo');

  return (
    <div className="flex flex-col gap-6">
      <form action={action} className="flex flex-col gap-3 rounded-2xl border border-ninho-borda bg-white p-5">
        <h3 className="text-base font-bold text-ninho-grafite">Nova despesa</h3>
        {state.error && (
          <div className="rounded-xl bg-red-50 p-2.5 text-sm text-red-600">{state.error}</div>
        )}
        {state.ok && (
          <div className="rounded-xl bg-ninho-roxo-suave p-2.5 text-sm text-ninho-roxo-escuro">
            Despesa lançada.
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="text-xs text-ninho-cinza">
            Descrição
            <input name="label" className={`${inputCls} mt-1`} placeholder="Supabase, OpenAI, anúncios..." />
          </label>
          <label className="text-xs text-ninho-cinza">
            Valor (R$)
            <input name="amount" type="number" step="0.01" min="0" className={`${inputCls} mt-1`} />
          </label>
          <label className="text-xs text-ninho-cinza">
            Tipo
            <select
              name="kind"
              value={kind}
              onChange={(e) => setKind(e.target.value as 'fixo' | 'variavel')}
              className={`${inputCls} mt-1`}
            >
              <option value="fixo">Fixo (repete todo mês)</option>
              <option value="variavel">Variável (uma vez)</option>
            </select>
          </label>
          <label className="text-xs text-ninho-cinza">
            Categoria
            <select name="category" className={`${inputCls} mt-1`}>
              <option value="app">App (servidor, IA, lojas)</option>
              <option value="marketing">Marketing (vira CAC)</option>
            </select>
          </label>
          <label className="text-xs text-ninho-cinza">
            Mês de referência
            <input name="ref_month" type="month" defaultValue={mesAtual()} className={`${inputCls} mt-1`} />
          </label>
          {kind === 'fixo' && (
            <label className="text-xs text-ninho-cinza">
              Repetir até (opcional)
              <input name="ate_month" type="month" className={`${inputCls} mt-1`} />
            </label>
          )}
        </div>

        {kind === 'fixo' && (
          <p className="text-xs text-ninho-cinza">
            Preenchendo &quot;repetir até&quot;, o valor é lançado uma vez em cada mês do intervalo —
            e depois dá para apagar a série inteira de uma vez.
          </p>
        )}

        <div>
          <Submit />
        </div>
      </form>

      <Tabela
        headers={['Descrição', 'Categoria', 'Tipo', 'Mês', 'Valor', '']}
        vazio="Nenhuma despesa lançada ainda."
      >
        {custos.map((c) => (
          <tr key={c.id}>
            <Td className="font-medium">{c.label}</Td>
            <Td>
              <span
                className={`rounded-pill px-2.5 py-1 text-[11px] font-semibold ${
                  c.category === 'marketing'
                    ? 'bg-[#FDF0E4] text-[#9A5B1E]'
                    : 'bg-ninho-roxo-suave text-ninho-roxo-escuro'
                }`}
              >
                {c.category === 'marketing' ? 'Marketing' : 'App'}
              </span>
            </Td>
            <Td className="text-ninho-cinza">{c.kind === 'fixo' ? 'Fixo' : 'Variável'}</Td>
            <Td className="whitespace-nowrap text-ninho-cinza">{c.ref_month.slice(0, 7)}</Td>
            <Td className="whitespace-nowrap font-semibold">{formatBRL(Number(c.amount))}</Td>
            <Td>
              <div className="flex gap-2">
                <form action={removerCusto}>
                  <input type="hidden" name="id" value={c.id} />
                  <button className="text-xs font-medium text-red-600 hover:underline">
                    Excluir
                  </button>
                </form>
                {c.series_id && (
                  <form action={removerCusto}>
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="series_id" value={c.series_id} />
                    <input type="hidden" name="todaSerie" value="1" />
                    <button className="whitespace-nowrap text-xs font-medium text-ninho-cinza hover:underline">
                      Excluir série
                    </button>
                  </form>
                )}
              </div>
            </Td>
          </tr>
        ))}
      </Tabela>
    </div>
  );
}
