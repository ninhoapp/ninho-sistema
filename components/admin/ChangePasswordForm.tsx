'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { changeOwnPassword, type ActionState } from '@/app/admin/actions';
import { PasswordInput } from '@/components/admin/PasswordInput';

function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-pill bg-ninho-roxo px-6 py-3 text-sm font-semibold text-white transition hover:bg-ninho-roxo-escuro active:scale-[0.98] disabled:opacity-50"
    >
      {pending ? 'Salvando...' : 'Salvar nova senha'}
    </button>
  );
}

export function ChangePasswordForm() {
  const [state, formAction] = useFormState<ActionState, FormData>(changeOwnPassword, {});
  return (
    <form action={formAction} className="flex max-w-sm flex-col gap-3">
      {state.error && (
        <div className="rounded-2xl bg-red-50 p-3 text-sm text-red-600">{state.error}</div>
      )}
      {state.ok && (
        <div className="rounded-2xl bg-ninho-roxo-suave p-3 text-sm text-ninho-roxo-escuro">
          Senha alterada com sucesso.
        </div>
      )}
      <PasswordInput name="atual" placeholder="Senha atual" autoComplete="current-password" />
      <PasswordInput
        name="nova"
        placeholder="Nova senha (mín. 8 caracteres)"
        autoComplete="new-password"
      />
      <PasswordInput name="confirma" placeholder="Confirmar nova senha" autoComplete="new-password" />
      <div>
        <SubmitBtn />
      </div>
    </form>
  );
}
