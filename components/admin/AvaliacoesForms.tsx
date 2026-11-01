'use client';

import { useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { aprovar, type AprovarState } from '@/app/admin/(painel)/avaliacoes/actions';

const LIMITE = 350;

function Publicar() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-pill bg-ninho-roxo px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-ninho-roxo-escuro active:scale-[0.98] disabled:opacity-50"
    >
      {pending ? 'Publicando…' : 'Aprovar e publicar'}
    </button>
  );
}

/** Resposta pública a uma avaliação. Vem com o rascunho da função; o dono
 *  edita se quiser e aprova. Aprovar publica na loja na hora. */
export function AprovarAvaliacaoForm({ id, rascunho }: { id: string; rascunho: string }) {
  const [state, action] = useFormState<AprovarState, FormData>(aprovar, {});
  const [texto, setTexto] = useState(rascunho);

  if (state.ok) {
    return <div className="rounded-2xl bg-ninho-roxo-suave p-3 text-sm text-ninho-roxo-escuro">Publicada na loja. Pode levar alguns minutos para aparecer.</div>;
  }

  const passou = texto.trim().length > LIMITE;
  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="id" value={id} />
      {state.error && <div className="rounded-2xl bg-red-50 p-3 text-sm text-red-600">{state.error}</div>}
      <textarea
        name="resposta"
        rows={4}
        required
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        className="w-full rounded-2xl border border-ninho-borda bg-white px-4 py-3 text-sm text-ninho-grafite outline-none focus:border-ninho-roxo"
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className={`text-xs ${passou ? 'font-semibold text-red-600' : 'text-ninho-cinza'}`}>
          {texto.trim().length}/{LIMITE} caracteres · a resposta fica pública na loja
        </span>
        <Publicar />
      </div>
    </form>
  );
}
