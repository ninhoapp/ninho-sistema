'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { IconCalendar } from '@/components/admin/icons';

/** Seletor de mês (pílula com ícone) que reflete em ?mes=yyyy-mm na URL. */
export function MonthFilter({ value }: { value: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  return (
    <label className="inline-flex items-center gap-2 rounded-pill border border-ninho-borda bg-white px-4 py-2 text-sm text-ninho-grafite shadow-sm">
      <IconCalendar className="h-4 w-4 shrink-0 text-ninho-cinza" />
      <input
        type="month"
        value={value}
        onChange={(e) => {
          const next = new URLSearchParams(params.toString());
          if (e.target.value) next.set('mes', e.target.value);
          else next.delete('mes');
          router.push(`${pathname}?${next.toString()}`);
        }}
        className="border-none bg-transparent p-0 text-sm font-medium text-ninho-grafite outline-none"
      />
    </label>
  );
}
