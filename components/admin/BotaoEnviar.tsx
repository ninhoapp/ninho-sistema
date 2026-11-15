'use client';

import { useFormStatus } from 'react-dom';

/**
 * Botão de formulário com server action que mostra "Salvando…" e fica travado
 * enquanto a ação roda. Sem isso, o dono clicava, nada mudava na hora e ele
 * clicava de novo (painel do Instagram, 15/11/2026).
 */
export function BotaoEnviar({ children, className }: { children: React.ReactNode; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} aria-busy={pending} className={`${className ?? ''} disabled:cursor-wait disabled:opacity-60`}>
      {pending ? 'Salvando…' : children}
    </button>
  );
}
