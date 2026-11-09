'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Ficha que desliza da direita por cima da lista (09/11/2026, ideia A de
 * docs/design/consultoras-admin/ideias.html). Abre só quando o dono clica
 * numa consultora; fecha no ✕, no fundo ou no Esc, voltando para `fechar`.
 */
export function Gaveta({ fechar, children }: { fechar: string; children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && router.push(fechar, { scroll: false });
    window.addEventListener('keydown', esc);
    const antes = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', esc);
      document.body.style.overflow = antes;
    };
  }, [fechar, router]);

  return (
    <div className="fixed inset-0 z-40" role="dialog" aria-modal="true">
      <Link href={fechar} scroll={false} aria-label="Fechar" className="absolute inset-0 bg-[#24164F]/20" />
      <aside className="absolute inset-y-0 right-0 w-full max-w-[640px] overflow-y-auto bg-white shadow-[-20px_0_50px_-20px_rgba(36,22,79,.35)]">
        {children}
      </aside>
    </div>
  );
}
