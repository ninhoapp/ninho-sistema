'use client';

import { useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { botao } from '@/components/consultoras/ui';

/**
 * "Trocar foto" da ficha da consultora: um botão só. Escolheu o arquivo, envia
 * (sem o "Escolher arquivo / Nenhum arquivo escolhido" do navegador).
 */
export function TrocarFoto({ acao, id }: { acao: (fd: FormData) => Promise<void>; id: string }) {
  const form = useRef<HTMLFormElement>(null);
  return (
    <form ref={form} action={acao} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <Botao onEscolher={() => form.current?.requestSubmit()} />
      <span className="text-[11.5px] text-ninho-cinza">JPG, PNG ou WebP até 2 MB</span>
    </form>
  );
}

function Botao({ onEscolher }: { onEscolher: () => void }) {
  const { pending } = useFormStatus();
  return (
    <label className={`${botao.suave} cursor-pointer ${pending ? 'pointer-events-none opacity-60' : ''}`}>
      {pending ? 'Enviando…' : 'Trocar foto'}
      <input type="file" name="foto" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => e.target.files?.length && onEscolher()} />
    </label>
  );
}
