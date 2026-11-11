'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { criarCartao, trocarCartao, type ActionState } from '@/app/admin/(painel)/admin-actions';
import { CANAIS, cartaoDoCanal, nomeCartao, type Canal, type Cartao, type CartaoCanal } from '@/lib/painel/cartoes';

const inputCls =
  'w-full rounded-xl border border-ninho-borda bg-white px-3 py-2 text-sm text-ninho-grafite outline-none focus:border-ninho-roxo';

function Botao({ texto, enviando }: { texto: string; enviando: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-pill bg-ninho-roxo px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-ninho-roxo-escuro disabled:opacity-50"
    >
      {pending ? enviando : texto}
    </button>
  );
}

function hoje(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function dataBr(d: string): string {
  return `${d.slice(8, 10)}/${d.slice(5, 7)}/${d.slice(0, 4)}`;
}

/**
 * Cartões e qual cartão cada canal usa (migration 00128). Trocar o cartão de
 * um canal é o único passo manual: daí em diante cada despesa cai sozinha no
 * mês da fatura (a Meta se refaz na hora).
 */
export function CartoesManager({ cartoes, historico }: { cartoes: Cartao[]; historico: CartaoCanal[] }) {
  const [troca, acaoTroca] = useFormState<ActionState, FormData>(trocarCartao, {});
  const [novo, acaoNovo] = useFormState<ActionState, FormData>(criarCartao, {});
  const nome = (id: string | null) => {
    const c = cartoes.find((x) => x.id === id);
    return c ? nomeCartao(c) : '—';
  };
  const dia = hoje();

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-ninho-borda bg-white p-5">
      <div>
        <h3 className="text-base font-bold text-ninho-grafite">Cartões</h3>
        <p className="text-xs text-ninho-cinza">
          A despesa conta no mês em que a fatura do cartão fecha. Trocou o cartão de um canal? Registre aqui e o resto sai sozinho.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {(Object.keys(CANAIS) as Canal[]).map((canal) => (
          <div key={canal} className="rounded-xl bg-ninho-roxo-suave/40 p-3">
            <p className="text-xs text-ninho-cinza">{CANAIS[canal]} hoje</p>
            <p className="text-sm font-semibold text-ninho-grafite">{nome(cartaoDoCanal(historico, canal, dia))}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 text-xs text-ninho-cinza">
        {cartoes.map((c) => (
          <span key={c.id} className="rounded-pill border border-ninho-borda px-3 py-1">
            {nomeCartao(c)} · fecha dia {c.dia_fechamento}
            {c.dia_vencimento ? ` · vence dia ${c.dia_vencimento}` : ''}
          </span>
        ))}
      </div>

      <form action={acaoTroca} className="flex flex-col gap-3 border-t border-ninho-borda pt-4">
        <h4 className="text-sm font-bold text-ninho-grafite">Trocar o cartão de um canal</h4>
        {troca.error && <div className="rounded-xl bg-red-50 p-2.5 text-sm text-red-600">{troca.error}</div>}
        {troca.ok && <div className="rounded-xl bg-ninho-roxo-suave p-2.5 text-sm text-ninho-roxo-escuro">Troca registrada.</div>}
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-xs text-ninho-cinza">
            Canal
            <select name="canal" className={`${inputCls} mt-1`} defaultValue="meta_ads">
              {(Object.keys(CANAIS) as Canal[]).map((c) => (
                <option key={c} value={c}>
                  {CANAIS[c]}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-ninho-cinza">
            Novo cartão
            <select name="cartao_id" className={`${inputCls} mt-1`}>
              {cartoes.map((c) => (
                <option key={c.id} value={c.id}>
                  {nomeCartao(c)} · fecha dia {c.dia_fechamento}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-ninho-cinza">
            A partir de
            <input name="desde" type="date" defaultValue={dia} className={`${inputCls} mt-1`} />
          </label>
        </div>
        <div>
          <Botao texto="Registrar troca" enviando="Registrando..." />
        </div>
      </form>

      {historico.length > 0 && (
        <details className="text-xs text-ninho-cinza">
          <summary className="cursor-pointer font-medium text-ninho-roxo-escuro">Histórico de trocas</summary>
          <ul className="mt-2 flex flex-col gap-1">
            {[...historico]
              .sort((a, b) => (a.desde < b.desde ? 1 : -1))
              .map((h) => (
                <li key={`${h.canal}-${h.desde}`}>
                  {dataBr(h.desde)} · {CANAIS[h.canal] ?? h.canal} → {nome(h.cartao_id)}
                </li>
              ))}
          </ul>
        </details>
      )}

      <form action={acaoNovo} className="flex flex-col gap-3 border-t border-ninho-borda pt-4">
        <h4 className="text-sm font-bold text-ninho-grafite">Cadastrar cartão</h4>
        {novo.error && <div className="rounded-xl bg-red-50 p-2.5 text-sm text-red-600">{novo.error}</div>}
        {novo.ok && <div className="rounded-xl bg-ninho-roxo-suave p-2.5 text-sm text-ninho-roxo-escuro">Cartão cadastrado.</div>}
        <div className="grid gap-3 sm:grid-cols-4">
          <label className="text-xs text-ninho-cinza">
            Nome
            <input name="nome" className={`${inputCls} mt-1`} placeholder="Ex.: ADCB Visa" />
          </label>
          <label className="text-xs text-ninho-cinza">
            Final (opcional)
            <input name="final4" inputMode="numeric" maxLength={4} className={`${inputCls} mt-1`} placeholder="1234" />
          </label>
          <label className="text-xs text-ninho-cinza">
            Fecha dia
            <input name="dia_fechamento" type="number" min="1" max="31" className={`${inputCls} mt-1`} />
          </label>
          <label className="text-xs text-ninho-cinza">
            Vence dia (opcional)
            <input name="dia_vencimento" type="number" min="1" max="31" className={`${inputCls} mt-1`} />
          </label>
        </div>
        <div>
          <Botao texto="Cadastrar" enviando="Cadastrando..." />
        </div>
      </form>
    </div>
  );
}
