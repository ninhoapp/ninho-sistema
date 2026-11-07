'use client';

import { useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { signInConsultora, type ActionState } from '@/app/admin/actions';
import { LoginForm } from '@/components/admin/LoginForm';

function Entrar() {
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

function FormConsultora() {
  const [state, formAction] = useFormState<ActionState, FormData>(signInConsultora, {});
  return (
    <form action={formAction} className="flex flex-col gap-3">
      {state.error && <div className="rounded-2xl bg-red-50 p-3 text-sm text-red-600">{state.error}</div>}
      <input
        name="email"
        type="email"
        autoComplete="email"
        autoCapitalize="none"
        placeholder="E-mail que você usa no app"
        className="w-full rounded-pill border border-ninho-borda bg-white px-5 py-3.5 text-sm text-ninho-grafite outline-none focus:border-ninho-roxo"
        autoFocus
      />
      <input
        name="codigo"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={7}
        placeholder="Código de 6 dígitos"
        className="w-full rounded-pill border border-ninho-borda bg-white px-5 py-3.5 text-center font-mono text-lg tracking-[0.4em] text-ninho-grafite outline-none placeholder:font-sans placeholder:text-sm placeholder:tracking-normal focus:border-ninho-roxo"
      />
      <Entrar />
      <p className="text-center text-xs leading-relaxed text-ninho-cinza">
        Gere o código no app do Ninho, na sua área de consultora. Ele vale 10 minutos e serve uma vez só.
      </p>
    </form>
  );
}

/** Login do painel com duas portas: equipe (usuário e senha) e consultora (e-mail + código do app). */
export function LoginPortas({ inicial = 'equipe' }: { inicial?: 'equipe' | 'consultora' }) {
  const [porta, setPorta] = useState(inicial);
  const aba = (v: 'equipe' | 'consultora', t: string) => (
    <button
      type="button"
      onClick={() => setPorta(v)}
      className={`flex-1 rounded-pill py-2 text-sm font-semibold transition ${
        porta === v ? 'bg-ninho-roxo text-white' : 'text-ninho-cinza hover:text-ninho-roxo-escuro'
      }`}
    >
      {t}
    </button>
  );
  return (
    <div>
      <div className="mb-4 flex gap-1 rounded-pill border border-ninho-borda bg-white p-1">
        {aba('equipe', 'Equipe Ninho')}
        {aba('consultora', 'Sou consultora')}
      </div>
      {porta === 'equipe' ? <LoginForm /> : <FormConsultora />}
    </div>
  );
}
