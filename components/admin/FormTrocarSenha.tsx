'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { trocarSenhaProvisoria, type ActionState } from '@/app/admin/actions';
import { PasswordInput } from '@/components/admin/PasswordInput';
import { SenhaForteInput } from '@/components/admin/SenhaForteInput';
import { useTextos } from '@/components/consultoras/IdiomaConsultora';

function Salvar() {
  const { pending } = useFormStatus();
  const t = useTextos().geral.trocarSenha;
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-2 inline-flex h-11 w-full items-center justify-center rounded-pill bg-gradient-primary text-[15px] font-bold text-white disabled:opacity-50"
    >
      {pending ? t.salvando : t.salvar}
    </button>
  );
}

export function FormTrocarSenha() {
  const [state, action] = useActionState<ActionState, FormData>(trocarSenhaProvisoria, {});
  // Idioma do provedor da página (consultora); para os outros papéis vale pt.
  const t = useTextos().geral.trocarSenha;
  return (
    <form action={action} className="mt-6 flex flex-col gap-3">
      {state.error && <div className="rounded-xl bg-red-50 p-2.5 text-sm text-red-600">{state.error}</div>}
      <label className="text-xs font-bold text-[#9A95AD]">
        {t.nova}
        <div className="mt-1">
          <SenhaForteInput name="nova" placeholder={t.nova} />
        </div>
      </label>
      <label className="text-xs font-bold text-[#9A95AD]">
        {t.repita}
        <div className="mt-1">
          <PasswordInput name="confirma" placeholder={t.repitaPlaceholder} autoComplete="new-password" />
        </div>
      </label>
      <Salvar />
    </form>
  );
}
