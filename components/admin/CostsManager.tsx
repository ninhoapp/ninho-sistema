'use client';

import { useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { criarCusto, removerCusto, salvarCusto, type ActionState } from '@/app/admin/(painel)/admin-actions';
import type { Cost } from '@/lib/painel/store';
import { formatAED } from '@/lib/cambio';
import { Tabela, Td } from '@/components/admin/Tabela';
import { ExportExcelButton } from '@/components/admin/ExportExcelButton';
import { cartaoDoCanal, mesDaFatura, nomeCartao, nomeMes, type Cartao, type CartaoCanal } from '@/lib/painel/cartoes';

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

function hoje(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** "Entra na fatura de dezembro de 2026" para a data e o cartão escolhidos. */
function MesDaFatura({ data, cartao, cartoes }: { data: string; cartao: string; cartoes: Cartao[] }) {
  const c = cartoes.find((x) => x.id === cartao);
  if (!data || !c) return null;
  return (
    <p className="text-xs text-ninho-roxo-escuro">
      Entra em <strong>{nomeMes(mesDaFatura(data, c.dia_fechamento))}</strong> (o cartão fecha dia {c.dia_fechamento}).
    </p>
  );
}

export function CostsManager({
  custos,
  mesFiltro,
  cartoes = [],
  historico = [],
}: {
  custos: Cost[];
  /** Quando informado, a tabela mostra só esse mês (yyyy-mm). */
  mesFiltro?: string;
  /** Cartões da 00128. Vazio (antes da migration): o formulário volta a pedir o mês. */
  cartoes?: Cartao[];
  historico?: CartaoCanal[];
}) {
  const [state, action] = useFormState<ActionState, FormData>(criarCusto, {});
  const [kind, setKind] = useState<'fixo' | 'variavel'>('fixo');
  const [data, setData] = useState(hoje());
  const [cartao, setCartao] = useState(() => cartaoDoCanal(historico, 'ferramentas', hoje()) ?? cartoes[0]?.id ?? '');
  const comCartao = cartoes.length > 0;

  const visiveis = mesFiltro
    ? custos.filter((c) => c.ref_month.slice(0, 7) === mesFiltro)
    : custos;

  const paraExcel = visiveis.map((c) => ({
    Descrição: c.label,
    Categoria: c.category === 'marketing' ? 'Marketing' : 'App',
    Tipo: c.kind === 'fixo' ? 'Fixo' : 'Variável',
    Mês: c.ref_month.slice(0, 7),
    'Valor (AED)': Number(c.amount),
  }));

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
            Valor (AED)
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
          {comCartao ? (
            <>
              <label className="text-xs text-ninho-cinza">
                Data da cobrança
                <input
                  name="data_cobranca"
                  type="date"
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                  className={`${inputCls} mt-1`}
                />
              </label>
              <label className="text-xs text-ninho-cinza">
                Cartão
                <select name="cartao_id" value={cartao} onChange={(e) => setCartao(e.target.value)} className={`${inputCls} mt-1`}>
                  {cartoes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {nomeCartao(c)} · fecha dia {c.dia_fechamento}
                    </option>
                  ))}
                </select>
              </label>
            </>
          ) : (
            <label className="text-xs text-ninho-cinza">
              Mês de referência
              <input name="ref_month" type="month" defaultValue={mesAtual()} className={`${inputCls} mt-1`} />
            </label>
          )}
          {kind === 'fixo' && (
            <label className="text-xs text-ninho-cinza">
              Repetir até (opcional)
              <input name="ate_month" type="month" className={`${inputCls} mt-1`} />
            </label>
          )}
        </div>

        {comCartao && <MesDaFatura data={data} cartao={cartao} cartoes={cartoes} />}

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

      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-bold text-ninho-grafite">
          Lançamentos{mesFiltro ? ` de ${mesFiltro}` : ''}
        </h3>
        <ExportExcelButton rows={paraExcel} filename="ninho-despesas" sheetName="Despesas" />
      </div>

      <Tabela
        headers={['Descrição', 'Categoria', 'Tipo', 'Mês', 'Valor (AED)', '']}
        vazio={
          mesFiltro
            ? `Nenhuma despesa lançada em ${mesFiltro}.`
            : 'Nenhuma despesa lançada ainda.'
        }
      >
        {visiveis.map((c) => (
          <LinhaCusto key={c.id} c={c} cartoes={cartoes} />
        ))}
      </Tabela>
    </div>
  );
}

function BadgeCategoria({ category }: { category: Cost['category'] }) {
  return (
    <span
      className={`rounded-pill px-2.5 py-1 text-[11px] font-semibold ${
        category === 'marketing' ? 'bg-[#FDF0E4] text-[#9A5B1E]' : 'bg-ninho-roxo-suave text-ninho-roxo-escuro'
      }`}
    >
      {category === 'marketing' ? 'Marketing' : 'App'}
    </span>
  );
}

function Salvar() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-pill bg-ninho-roxo px-3 py-1 text-xs font-semibold text-white hover:bg-ninho-roxo-escuro disabled:opacity-50"
    >
      {pending ? 'Salvando...' : 'Salvar'}
    </button>
  );
}

/**
 * Uma linha de despesa. "Editar" troca as células por campos; os campos ficam
 * ligados ao formulário da última célula pelo atributo `form`, porque um
 * <form> não pode envolver uma linha de tabela.
 */
function dataBr(d: string): string {
  return `${d.slice(8, 10)}/${d.slice(5, 7)}`;
}

function LinhaCusto({ c, cartoes }: { c: Cost; cartoes: Cartao[] }) {
  const [editando, setEditando] = useState(false);
  const [state, action] = useFormState<ActionState, FormData>(async (prev, fd) => {
    const res = await salvarCusto(prev, fd);
    if (res.ok) setEditando(false);
    return res;
  }, {});
  const formId = `custo-${c.id}`;
  const campo = 'w-full min-w-[90px] rounded-lg border border-ninho-borda bg-white px-2 py-1 text-sm outline-none focus:border-ninho-roxo';

  if (editando) {
    return (
      <tr className="bg-ninho-roxo-suave/40">
        <Td>
          <input form={formId} name="label" defaultValue={c.label} className={campo} aria-label="Descrição" />
        </Td>
        <Td>
          <select form={formId} name="category" defaultValue={c.category} className={campo} aria-label="Categoria">
            <option value="app">App</option>
            <option value="marketing">Marketing</option>
          </select>
        </Td>
        <Td>
          <select form={formId} name="kind" defaultValue={c.kind} className={campo} aria-label="Tipo">
            <option value="fixo">Fixo</option>
            <option value="variavel">Variável</option>
          </select>
        </Td>
        <Td>
          <div className="flex flex-col gap-1">
            {cartoes.length > 0 && (
              <>
                <input
                  form={formId}
                  name="data_cobranca"
                  type="date"
                  defaultValue={c.data_cobranca ?? ''}
                  className={campo}
                  aria-label="Data da cobrança"
                />
                <select form={formId} name="cartao_id" defaultValue={c.cartao_id ?? cartoes[0]?.id} className={campo} aria-label="Cartão">
                  {cartoes.map((k) => (
                    <option key={k.id} value={k.id}>
                      {nomeCartao(k)}
                    </option>
                  ))}
                </select>
              </>
            )}
            <input form={formId} name="ref_month" type="month" defaultValue={c.ref_month.slice(0, 7)} className={campo} aria-label="Mês (sem data)" />
            {cartoes.length > 0 && <span className="text-[11px] text-ninho-cinza">Com data, o mês sai do cartão.</span>}
          </div>
        </Td>
        <Td>
          <input
            form={formId}
            name="amount"
            type="number"
            step="0.01"
            min="0"
            defaultValue={Number(c.amount)}
            className={campo}
            aria-label="Valor em AED"
          />
        </Td>
        <Td>
          <form id={formId} action={action} className="flex flex-col gap-1">
            <input type="hidden" name="id" value={c.id} />
            <div className="flex items-center gap-2">
              <Salvar />
              <button type="button" onClick={() => setEditando(false)} className="text-xs font-medium text-ninho-cinza hover:underline">
                Cancelar
              </button>
            </div>
            {state.error && <span className="text-[11px] text-red-600">{state.error}</span>}
            {c.series_id && <span className="text-[11px] text-ninho-cinza">Muda só este mês da série.</span>}
          </form>
        </Td>
      </tr>
    );
  }

  return (
    <tr>
      <Td className="font-medium">{c.label}</Td>
      <Td>
        <BadgeCategoria category={c.category} />
      </Td>
      <Td className="text-ninho-cinza">{c.kind === 'fixo' ? 'Fixo' : 'Variável'}</Td>
      <Td className="whitespace-nowrap text-ninho-cinza">
        {c.ref_month.slice(0, 7)}
        {c.data_cobranca && (
          <span className="block text-[11px]">
            cobrado {dataBr(c.data_cobranca)}
            {c.cartao_id ? ` · ${cartoes.find((k) => k.id === c.cartao_id)?.nome ?? c.cartao_id}` : ''}
          </span>
        )}
      </Td>
      <Td className="whitespace-nowrap font-semibold">{formatAED(Number(c.amount))}</Td>
      <Td>
        <div className="flex gap-3">
          <button type="button" onClick={() => setEditando(true)} className="text-xs font-medium text-ninho-roxo-escuro hover:underline">
            Editar
          </button>
          <form action={removerCusto}>
            <input type="hidden" name="id" value={c.id} />
            <button className="text-xs font-medium text-red-600 hover:underline">Excluir</button>
          </form>
          {c.series_id && (
            <form action={removerCusto}>
              <input type="hidden" name="id" value={c.id} />
              <input type="hidden" name="series_id" value={c.series_id} />
              <input type="hidden" name="todaSerie" value="1" />
              <button className="whitespace-nowrap text-xs font-medium text-ninho-cinza hover:underline">Excluir série</button>
            </form>
          )}
        </div>
      </Td>
    </tr>
  );
}
