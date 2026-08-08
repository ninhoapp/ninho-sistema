import type { Estado } from '@/lib/app-users';

const MAP: Record<Estado, { label: string; cls: string }> = {
  pagante: { label: 'Pagante', cls: 'bg-[#E4F5EC] text-[#2E7D51]' },
  trial_ativo: { label: 'Trial ativo', cls: 'bg-ninho-roxo-suave text-ninho-roxo-escuro' },
  trial_expirado: { label: 'Trial expirado', cls: 'bg-[#FDF0E4] text-[#9A5B1E]' },
  churn: { label: 'Churn', cls: 'bg-red-50 text-red-600' },
  free: { label: 'Free', cls: 'bg-ninho-nuvem text-ninho-cinza' },
};

export function EstadoBadge({ estado }: { estado: Estado }) {
  const e = MAP[estado] ?? MAP.free;
  return (
    <span className={`inline-block whitespace-nowrap rounded-pill px-2.5 py-1 text-[11px] font-semibold ${e.cls}`}>
      {e.label}
    </span>
  );
}
