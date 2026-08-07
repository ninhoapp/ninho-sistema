/** Aviso informativo (ex: banco do app não configurado). */
export function Notice({
  children,
  tone = 'info',
}: {
  children: React.ReactNode;
  tone?: 'info' | 'warn';
}) {
  const cls =
    tone === 'warn'
      ? 'border-[#E0B44A] bg-[#FDF6E3] text-[#7A5A12]'
      : 'border-ninho-roxo-suave bg-ninho-roxo-suave text-ninho-roxo-escuro';
  return <div className={`mb-6 rounded-2xl border p-4 text-sm ${cls}`}>{children}</div>;
}
