'use client';

import { useState } from 'react';

/** Botão que copia uma lista de valores (ex: todos os e-mails) para a área de transferência. */
export function CopyAll({
  label,
  values,
  joiner = ', ',
}: {
  label: string;
  values: string[];
  joiner?: string;
}) {
  const [copied, setCopied] = useState(false);
  const disabled = values.length === 0;
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(values.join(joiner));
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        } catch {
          /* ignore */
        }
      }}
      className="rounded-pill border border-ninho-roxo px-4 py-2 text-sm font-medium text-ninho-roxo-escuro transition hover:bg-ninho-roxo-suave disabled:opacity-40"
    >
      {copied ? 'Copiado!' : `${label} (${values.length})`}
    </button>
  );
}
