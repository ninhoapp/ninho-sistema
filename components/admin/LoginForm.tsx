'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { signIn, type ActionState } from '@/app/admin/actions';

function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-pill bg-ninho-roxo py-3.5 text-base font-semibold text-white transition hover:bg-ninho-roxo-escuro active:scale-[0.98] disabled:opacity-50"
    >
      {pending ? 'Entrando...' : 'Entrar'}
    </button>
  );
}

export function LoginForm() {
  const [state, formAction] = useFormState<ActionState, FormData>(signIn, {});
  return (
    <form action={formAction} className="flex flex-col gap-3">
      {state.error && (
        <div className="rounded-2xl bg-red-50 p-3 text-sm text-red-600">{state.error}</div>
      )}
      <input
        name="login"
        type="text"
        autoComplete="username"
        autoCapitalize="none"
        placeholder="Usuário ou e-mail"
        className="w-full rounded-pill border border-ninho-borda bg-white px-5 py-3.5 text-sm text-ninho-grafite outline-none focus:border-ninho-roxo"
        autoFocus
      />
      <input
        name="password"
        type="password"
        autoComplete="current-password"
        placeholder="Senha"
        className="w-full rounded-pill border border-ninho-borda bg-white px-5 py-3.5 text-sm text-ninho-grafite outline-none focus:border-ninho-roxo"
      />
      <SubmitBtn />
    </form>
  );
}
