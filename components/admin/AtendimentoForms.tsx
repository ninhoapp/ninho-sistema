'use client';

import { useState, useTransition } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { ensinar, rascunhar, responder, type RespostaState } from '@/app/admin/(painel)/atendimento/actions';
import type { RascunhoNina } from '@/lib/atendimento';

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

/** Resposta do dono a uma pendência, em dois passos (pedido do dono,
 *  11/11/2026): 1) ele escreve uma INSTRUÇÃO e a Nina devolve o rascunho da
 *  mensagem; 2) ele revisa, edita e só então envia — vai como está, sem
 *  reescrever. Nada chega à pessoa no passo 1.
 *  "Ensinar a Nina" vem marcado com a versão geral que a própria Nina
 *  sugere. O que ela aprende entra na conversa de TODO MUNDO, então só vale
 *  a versão geral, sem nome, e-mail ou dado do bebê — nunca o resumo ou a
 *  resposta do caso (jurídico, 19/10/2026; a função também recusa).
 *  `rascunho`: texto já escrito pela equipe (ex.: Fernanda/Claude); entra
 *  como instrução para a Nina. */
export function ResponderForm({ pendenciaId, rascunho }: { pendenciaId: string; resumo?: string; rascunho?: string | null }) {
  const [state, action] = useFormState<RespostaState, FormData>(responder, {});
  const [instrucao, setInstrucao] = useState(rascunho ?? '');
  const [draft, setDraft] = useState<RascunhoNina | null>(null);
  const [erroRascunho, setErroRascunho] = useState<string | null>(null);
  const [gerando, startGerar] = useTransition();
  const [ensinarMarcado, setEnsinar] = useState(true);

  if (state.ok) {
    return (
      <div className="rounded-2xl bg-ninho-roxo-suave p-3 text-sm text-ninho-roxo-escuro">
        Resposta enviada para a pessoa, com notificação.
        {state.aviso && <span className="mt-1 block text-xs">{state.aviso}</span>}
      </div>
    );
  }

  const gerar = () => {
    setErroRascunho(null);
    startGerar(async () => {
      const r = await rascunhar(pendenciaId, instrucao);
      if ('error' in r) {
        setErroRascunho(r.error);
        return;
      }
      setDraft(r);
      setEnsinar(Boolean(r.pergunta_geral && r.resposta_geral));
    });
  };

  if (!draft) {
    return (
      <div className="flex flex-col gap-3">
        {erroRascunho && <div className="rounded-2xl bg-red-50 p-3 text-sm text-red-600">{erroRascunho}</div>}
        <textarea
          value={instrucao}
          onChange={(e) => setInstrucao(e.target.value)}
          rows={rascunho ? 10 : 3}
          placeholder="O que a Nina deve responder. Pode ser uma instrução (ex.: diz que o app não tem esse campo). Ela escreve a mensagem e mostra aqui antes de enviar."
          className={campo}
        />
        <div>
          <button
            type="button"
            onClick={gerar}
            disabled={gerando || instrucao.trim().length < 2}
            className="rounded-pill bg-ninho-roxo px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-ninho-roxo-escuro active:scale-[0.98] disabled:opacity-50"
          >
            {gerando ? 'A Nina está escrevendo...' : 'Ver resposta da Nina'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="pendencia_id" value={pendenciaId} />
      <input type="hidden" name="texto_pronto" value="1" />
      {state.error && <div className="rounded-2xl bg-red-50 p-3 text-sm text-red-600">{state.error}</div>}
      <p className="text-xs text-ninho-cinza">
        Rascunho da Nina. <strong>Ainda não foi enviado.</strong> Edite o que quiser: vai para a pessoa exatamente como estiver aqui.
      </p>
      <textarea name="resposta" rows={8} required defaultValue={draft.mensagem} className={campo} />
      <label className="flex items-center gap-2 text-sm text-ninho-grafite">
        <input type="checkbox" name="ensinar" checked={ensinarMarcado} onChange={(e) => setEnsinar(e.target.checked)} className="h-4 w-4 accent-[#9F86E0]" />
        Ensinar a Nina (ela passa a responder isso sozinha)
      </label>
      {ensinarMarcado && (
        <div className="ml-6 flex flex-col gap-2">
          <p className="text-xs text-ninho-cinza">
            Vale para qualquer pessoa: <strong>sem nome, e-mail ou dado do bebê</strong>. É isto que a Nina vai repetir.
          </p>
          <input
            name="pergunta_geral"
            required
            defaultValue={draft.pergunta_geral}
            placeholder="Pergunta, de forma geral (ex.: Dá para trocar o e-mail da conta?)"
            className={campo}
          />
          <textarea name="resposta_geral" required rows={2} defaultValue={draft.resposta_geral} placeholder="Como responder da próxima vez" className={campo} />
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <Enviar rotulo="Enviar para a pessoa" enviando="Enviando..." />
        <button type="button" onClick={() => setDraft(null)} className="text-sm font-semibold text-ninho-roxo hover:underline">
          Mudar a instrução
        </button>
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
