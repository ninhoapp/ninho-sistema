'use client';

import { useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { excluirConsultora, type ExcluirState } from '@/app/admin/(painel)/consultor/actions';

function Confirmar() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="rounded-pill bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50">
      {pending ? 'Conferindo...' : 'Excluir'}
    </button>
  );
}

/**
 * "Excluir consultora" com a senha do admin numa janela por cima. O campo da
 * senha tem nome aleatório e autoComplete="new-password" para o navegador
 * não preencher sozinho.
 */
export function ExcluirConsultora({ id, nome }: { id: string; nome: string }) {
  const [aberto, setAberto] = useState(false);
  const [campo] = useState(() => `k${Math.random().toString(36).slice(2, 12)}`);
  const [state, action] = useFormState<ExcluirState, FormData>(excluirConsultora, {});

  if (!aberto) {
    return (
      <button type="button" onClick={() => setAberto(true)} className="inline-flex h-8 items-center rounded-pill border border-red-300 px-3 text-[12.5px] font-bold text-red-500 hover:bg-red-50">
        Excluir consultora
      </button>
    );
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setAberto(false)}>
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <p className="text-sm font-semibold text-ninho-grafite">Excluir {nome}</p>
        <p className="mt-1 text-sm text-ninho-cinza">
          Só dá para excluir quem ainda não tem histórico (famílias, aceites ou pagamentos). Com histórico, use Pausar.
        </p>
        <form action={action} className="mt-3 space-y-3" autoComplete="off">
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="campo" value={campo} />
          <div>
            <label htmlFor={campo} className="mb-1 block text-xs uppercase text-ninho-cinza">Sua senha de login</label>
            <input
              id={campo}
              autoFocus
              type="password"
              name={campo}
              autoComplete="new-password"
              data-lpignore="true"
              data-1p-ignore=""
              className="w-full rounded-pill border border-ninho-borda px-4 py-2 text-sm outline-none focus:border-ninho-roxo"
              placeholder="Digite sua senha"
            />
          </div>
          {state.error && <p className="text-sm text-red-600">{state.error}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setAberto(false)} className="rounded-pill border border-ninho-borda px-4 py-2 text-sm text-ninho-cinza hover:bg-ninho-nuvem">
              Cancelar
            </button>
            <Confirmar />
          </div>
        </form>
      </div>
    </div>
  );
}
