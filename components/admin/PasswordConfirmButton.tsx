'use client';

import { useEffect, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';

export interface PasswordConfirmState {
  error?: string;
  ok?: boolean;
}

function ConfirmSubmit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-pill bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? 'Verificando...' : 'Confirmar'}
    </button>
  );
}

/**
 * Botão de ação destrutiva que exige a senha de login do admin, validada no
 * servidor, antes de executar — sem confirmação de um clique só.
 */
export function PasswordConfirmButton({
  action,
  hidden,
  label,
  message,
}: {
  action: (prev: PasswordConfirmState, formData: FormData) => Promise<PasswordConfirmState>;
  hidden: Record<string, string>;
  label: string;
  message: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useFormState<PasswordConfirmState, FormData>(action, {});

  useEffect(() => {
    if (state.ok) setOpen(false);
  }, [state.ok]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-pill border border-red-300 px-3 py-1.5 text-xs font-medium text-red-500 transition hover:bg-red-50"
      >
        {label}
      </button>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-sm font-semibold text-ninho-grafite">{label}</p>
        <p className="mt-1 text-sm text-ninho-cinza">{message}</p>
        <form action={formAction} className="mt-3 space-y-3">
          {Object.entries(hidden).map(([k, v]) => (
            <input key={k} type="hidden" name={k} value={v} />
          ))}
          <div>
            <label className="mb-1 block text-xs uppercase text-ninho-cinza">
              Sua senha de login
            </label>
            <input
              autoFocus
              type="password"
              name="password"
              className="w-full rounded-pill border border-ninho-borda px-4 py-2 text-sm outline-none focus:border-ninho-roxo"
              placeholder="Digite sua senha"
            />
          </div>
          {state.error && <p className="text-sm text-red-600">{state.error}</p>}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-pill border border-ninho-borda px-4 py-2 text-sm text-ninho-cinza hover:bg-ninho-nuvem"
            >
              Cancelar
            </button>
            <ConfirmSubmit />
          </div>
        </form>
      </div>
    </div>
  );
}
