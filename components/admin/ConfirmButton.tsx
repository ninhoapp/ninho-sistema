'use client';

/**
 * Botão de ação destrutiva com confirmação (window.confirm).
 * Recebe um server action e campos ocultos. Usado nos "zerar" por escopo.
 */
export function ConfirmButton({
  action,
  hidden,
  label,
  message,
}: {
  action: (formData: FormData) => Promise<void>;
  hidden: Record<string, string>;
  label: string;
  message: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {Object.entries(hidden).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <button className="rounded-pill border border-red-300 px-3 py-1.5 text-xs font-medium text-red-500 transition hover:bg-red-50">
        {label}
      </button>
    </form>
  );
}
