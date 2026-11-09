'use client';

import { useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { limparDadosDoLink, type LimparState } from '@/app/admin/(painel)/limpar-link-actions';

function Confirmar() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="rounded-pill bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50">
      {pending ? 'Apagando...' : 'Apagar'}
    </button>
  );
}

/**
 * "Limpar dados do link" de um parceiro ou consultora: mostra quantos cliques
 * e downloads vão sair e pede a senha do admin (campo com nome aleatório e
 * autoComplete="new-password", para o navegador não preencher sozinho).
 */
export function LimparLink({
  tipo,
  id,
  nome,
  cliques,
  downloads,
}: {
  tipo: 'parceiro' | 'consultora';
  id: string;
  nome: string;
  cliques: number | null;
  downloads: number | null;
}) {
  const [aberto, setAberto] = useState(false);
  const [campo] = useState(() => `k${Math.random().toString(36).slice(2, 12)}`);
  const [state, action] = useFormState<LimparState, FormData>(limparDadosDoLink, {});

  if (!aberto) {
    return (
      <button type="button" onClick={() => setAberto(true)} className="inline-flex h-8 items-center rounded-pill border border-red-300 px-3 text-[12.5px] font-bold text-red-500 hover:bg-red-50">
        Limpar dados do link
      </button>
    );
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setAberto(false)}>
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <p className="text-sm font-semibold text-ninho-grafite">Limpar dados do link de {nome}</p>
        <p className="mt-2 text-sm text-ninho-cinza">
          Vai apagar <b>{cliques ?? '—'} clique(s)</b> e <b>{downloads ?? '—'} download(s)</b> deste código.
        </p>
        <p className="mt-2 rounded-xl bg-ninho-nuvem p-2.5 text-[12.5px] text-ninho-cinza">
          Não apaga as contas atribuídas a {tipo === 'parceiro' ? 'este parceiro' : 'esta consultora'}, nem comissões ou pagamentos. Não dá para desfazer.
        </p>
        {state.ok ? (
          <>
            <p className="mt-3 rounded-xl bg-[#EEF8F1] p-2.5 text-sm text-[#256B43]">{state.ok}</p>
            <div className="mt-3 flex justify-end">
              <button type="button" onClick={() => setAberto(false)} className="rounded-pill border border-ninho-borda px-4 py-2 text-sm text-ninho-cinza hover:bg-ninho-nuvem">Fechar</button>
            </div>
          </>
        ) : (
          <form action={action} className="mt-3 space-y-3" autoComplete="off">
            <input type="hidden" name="tipo" value={tipo} />
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
              <button type="button" onClick={() => setAberto(false)} className="rounded-pill border border-ninho-borda px-4 py-2 text-sm text-ninho-cinza hover:bg-ninho-nuvem">Cancelar</button>
              <Confirmar />
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
