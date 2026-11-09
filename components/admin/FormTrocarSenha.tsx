'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { trocarSenhaProvisoria, type ActionState } from '@/app/admin/actions';
import { PasswordInput } from '@/components/admin/PasswordInput';
import { SenhaForteInput } from '@/components/admin/SenhaForteInput';

function Salvar() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-2 inline-flex h-11 w-full items-center justify-center rounded-pill bg-gradient-primary text-[15px] font-bold text-white disabled:opacity-50"
    >
      {pending ? 'Salvando...' : 'Salvar e entrar'}
    </button>
  );
}

export function FormTrocarSenha() {
  const [state, action] = useFormState<ActionState, FormData>(trocarSenhaProvisoria, {});
  return (
    <form action={action} className="mt-6 flex flex-col gap-3">
      {state.error && <div className="rounded-xl bg-red-50 p-2.5 text-sm text-red-600">{state.error}</div>}
      <label className="text-xs font-bold text-[#9A95AD]">
        Nova senha
        <div className="mt-1">
          <SenhaForteInput name="nova" placeholder="Nova senha" />
        </div>
      </label>
      <label className="text-xs font-bold text-[#9A95AD]">
        Repita a nova senha
        <div className="mt-1">
          <PasswordInput name="confirma" placeholder="Repita a senha" autoComplete="new-password" />
        </div>
      </label>
      <Salvar />
    </form>
  );
}
