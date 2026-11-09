'use client';

import { useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { botao, campo, rotuloCampo } from '@/components/consultoras/ui';

/**
 * Botão "+ Nova consultora" do painel do dono (09/11/2026). O formulário só
 * aparece quando o dono pede, numa janela por cima da tela; antes ele ocupava a
 * coluna da esquerda da aba Consultoras o tempo todo.
 * Desenho: docs/design/consultoras-admin/ideias.html (ideia A).
 */
export function NovaConsultora({
  acao,
  opcoes,
  pctDireto,
  pctRede,
  linkBase,
}: {
  acao: (fd: FormData) => Promise<void>;
  opcoes: { id: string; nome: string }[];
  pctDireto: string;
  pctRede: string;
  linkBase: string;
}) {
  const [aberta, setAberta] = useState(false);

  useEffect(() => {
    if (!aberta) return;
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setAberta(false);
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [aberta]);

  return (
    <>
      <button type="button" onClick={() => setAberta(true)} className={botao.grad}>
        <span className="text-lg leading-none">+</span> Nova consultora
      </button>

      {aberta && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto px-4 py-16" role="dialog" aria-modal="true" aria-label="Nova consultora">
          <button type="button" aria-label="Fechar" onClick={() => setAberta(false)} className="fixed inset-0 bg-[#24164F]/30" />
          <form action={acao} className="relative w-full max-w-[460px] rounded-[26px] bg-white p-6 shadow-[0_30px_60px_-20px_rgba(36,22,79,.45)]">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-[#24164F]">Nova consultora</h2>
              <button type="button" onClick={() => setAberta(false)} className={botao.cinza} aria-label="Fechar">✕</button>
            </div>
            <p className="mt-1 text-[12.5px] text-ninho-cinza">Ela vira consultora quando abrir o app com este e-mail confirmado.</p>

            <label className={rotuloCampo}>E-mail que ela vai usar no app</label>
            <input name="email" type="email" required autoFocus placeholder="nome@gmail.com" className={campo} />
            <div className="grid gap-x-3 sm:grid-cols-2">
              <div>
                <label className={rotuloCampo}>Nome</label>
                <input name="nome" required minLength={2} maxLength={80} placeholder="Nome e sobrenome" className={campo} />
              </div>
              <div>
                <label className={rotuloCampo}>Instagram</label>
                <input name="instagram" placeholder="@" className={campo} />
              </div>
              <div>
                <label className={rotuloCampo}>Código do link</label>
                <input name="codigo" maxLength={20} placeholder="Sai do nome se ficar vazio" className={`${campo} uppercase`} />
              </div>
              <div>
                <label className={rotuloCampo}>Indicada por</label>
                <select name="indicada_por" className={campo} defaultValue="">
                  <option value="">Ninguém · {pctDireto}</option>
                  {opcoes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>
            </div>
            <p className="mt-2 text-[11.5px] leading-snug text-ninho-cinza">
              Link das famílias: {linkBase}/c/codigo. Se outra consultora a trouxe, as famílias dela dão {pctRede} para cada uma.
              O painel não manda e-mail: avise ela por fora.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setAberta(false)} className={`${botao.cinza} h-10 px-4`}>Cancelar</button>
              <Enviar />
            </div>
          </form>
        </div>
      )}
    </>
  );
}

function Enviar() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={botao.grad}>
      {pending ? 'Liberando…' : 'Liberar e-mail'}
    </button>
  );
}
