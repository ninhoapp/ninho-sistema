'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { updateOwnPix, type ActionState } from '@/app/admin/actions';

function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-pill border border-ninho-borda px-6 py-3 text-sm font-semibold text-ninho-grafite transition hover:border-ninho-roxo hover:text-ninho-roxo active:scale-[0.98] disabled:opacity-50"
    >
      {pending ? 'Salvando...' : 'Salvar chave PIX'}
    </button>
  );
}

export function PixForm({ atual }: { atual: string | null }) {
  const [state, formAction] = useFormState<ActionState, FormData>(updateOwnPix, {});
  return (
    <form action={formAction} className="flex max-w-sm flex-col gap-3">
      {state.error && (
        <div className="rounded-2xl bg-red-50 p-3 text-sm text-red-600">{state.error}</div>
      )}
      {state.ok && (
        <div className="rounded-2xl bg-ninho-roxo-suave p-3 text-sm text-ninho-roxo-escuro">
          Chave PIX salva.
        </div>
      )}
      <input
        name="pix_key"
        type="text"
        defaultValue={atual ?? ''}
        placeholder="CPF, e-mail, telefone ou chave aleatória"
        className="w-full rounded-pill border border-ninho-borda bg-white px-5 py-3 text-sm text-ninho-grafite outline-none focus:border-ninho-roxo"
      />
      <div>
        <SubmitBtn />
      </div>
    </form>
  );
}
