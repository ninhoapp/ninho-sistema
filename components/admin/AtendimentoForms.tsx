'use client';

import { useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { ensinar, responder, type RespostaState } from '@/app/admin/(painel)/atendimento/actions';

const campo =
  'w-full rounded-2xl border border-ninho-borda bg-white px-4 py-3 text-sm text-ninho-grafite outline-none focus:border-ninho-roxo';

function Enviar({ rotulo, enviando }: { rotulo: string; enviando: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-pill bg-ninho-roxo px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-ninho-roxo-escuro active:scale-[0.98] disabled:opacity-50"
    >
      {pending ? enviando : rotulo}
    </button>
  );
}

/** Resposta do dono a uma pendência. "Ensinar a Nina" vem marcado: o
 *  normal é a resposta servir para a próxima pessoa também. Mas o que ela
 *  aprende entra na conversa de TODO MUNDO, então só vale a versão geral,
 *  escrita aqui, sem nome, e-mail ou dado do bebê — nunca o resumo ou a
 *  resposta do caso (jurídico, 19/10/2026; a função também recusa). */
export function ResponderForm({ pendenciaId }: { pendenciaId: string; resumo?: string }) {
  const [state, action] = useFormState<RespostaState, FormData>(responder, {});
  const [ensinarMarcado, setEnsinar] = useState(true);

  if (state.ok) {
    return (
      <div className="rounded-2xl bg-ninho-roxo-suave p-3 text-sm text-ninho-roxo-escuro">
        Resposta entregue. A Nina escreveu para a pessoa e mandou a notificação.
        {state.aviso && <span className="mt-1 block text-xs">{state.aviso}</span>}
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="pendencia_id" value={pendenciaId} />
      {state.error && <div className="rounded-2xl bg-red-50 p-3 text-sm text-red-600">{state.error}</div>}
      <textarea
        name="resposta"
        rows={3}
        required
        placeholder="Sua resposta. Pode ser direta: a Nina reescreve no tom dela e no idioma da pessoa, sem acrescentar nada."
        className={campo}
      />
      <label className="flex items-center gap-2 text-sm text-ninho-grafite">
        <input type="checkbox" name="ensinar" checked={ensinarMarcado} onChange={(e) => setEnsinar(e.target.checked)} className="h-4 w-4 accent-[#9F86E0]" />
        Ensinar a Nina (ela passa a responder isso sozinha)
      </label>
      {ensinarMarcado && (
        <div className="ml-6 flex flex-col gap-2">
          <p className="text-xs text-ninho-cinza">
            Escreva para qualquer pessoa: <strong>sem nome, e-mail ou dado do bebê</strong>. É isto que a Nina vai repetir.
          </p>
          <input name="pergunta_geral" required placeholder="Pergunta, de forma geral (ex.: Dá para trocar o e-mail da conta?)" className={campo} />
          <textarea name="resposta_geral" required rows={2} placeholder="Como responder da próxima vez" className={campo} />
        </div>
      )}
      <div>
        <Enviar rotulo="Responder" enviando="Enviando..." />
      </div>
    </form>
  );
}

/** Ensinar sem esperar alguém perguntar (ex.: uma mudança de preço). */
export function EnsinarForm() {
  const [state, action] = useFormState<RespostaState, FormData>(ensinar, {});
  return (
    <form action={action} className="flex flex-col gap-3" key={state.ok ? 'ok' : 'novo'}>
      {state.error && <div className="rounded-2xl bg-red-50 p-3 text-sm text-red-600">{state.error}</div>}
      {state.ok && <div className="rounded-2xl bg-ninho-roxo-suave p-3 text-sm text-ninho-roxo-escuro">Anotado. A Nina já usa na próxima conversa.</div>}
      <input name="pergunta" placeholder="Pergunta (ex.: Tem desconto para quem tem gêmeos?)" className={campo} />
      <textarea name="resposta" rows={2} placeholder="Como a Nina deve responder" className={campo} />
      <div>
        <Enviar rotulo="Ensinar" enviando="Salvando..." />
      </div>
    </form>
  );
}
