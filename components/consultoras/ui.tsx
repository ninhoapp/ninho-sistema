/**
 * Peças visuais das áreas de consultoras (dono e consultora), no desenho
 * aprovado em Ninho-expo/docs/design/consultora/painel.html: cartões brancos
 * arredondados, KPIs, selos coloridos e a linha de 24 horas.
 */
import Link from 'next/link';
import { formatBRL } from '@/lib/metrics';

export const brl = (v: number) => formatBRL(v);

export function Card({ titulo, direita, children, className = '' }: { titulo?: React.ReactNode; direita?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-[22px] bg-white p-5 shadow-[0_10px_30px_-22px_rgba(80,40,160,.35)] ${className}`}>
      {(titulo || direita) && (
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          {titulo && <h2 className="text-[15px] font-extrabold text-ninho-grafite">{titulo}</h2>}
          {direita && <div className="text-xs font-semibold text-ninho-cinza">{direita}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

export function Kpi({ rotulo, valor, sub, verde = false }: { rotulo: string; valor: React.ReactNode; sub?: React.ReactNode; verde?: boolean }) {
  return (
    <div className={`rounded-[22px] p-5 shadow-[0_10px_30px_-22px_rgba(80,40,160,.35)] ${verde ? 'bg-[#EEF8F1]' : 'bg-white'}`}>
      <p className="text-xs font-bold text-[#9A95AD]">{rotulo}</p>
      <p className={`mt-1 text-[26px] font-black tabular-nums tracking-tight ${verde ? 'text-[#2F8A55]' : 'text-ninho-grafite'}`}>{valor}</p>
      {sub && <p className="mt-0.5 text-xs text-ninho-cinza">{sub}</p>}
    </div>
  );
}

const SELO: Record<string, string> = {
  verde: 'text-[#2F8A55] bg-[#E7F5EC]',
  lilas: 'text-[#7C5CD6] bg-[#EFE8FC]',
  ambar: 'text-[#B7791F] bg-[#FFF2D6]',
  cinza: 'text-[#6B6F80] bg-[#F0EEF4]',
  vermelho: 'text-[#E85D5D] bg-[#FDEEEE]',
  noite: 'text-white bg-[#3B2C78]',
};

export function Selo({ cor, children }: { cor: keyof typeof SELO; children: React.ReactNode }) {
  return <span className={`inline-block whitespace-nowrap rounded-pill px-2.5 py-0.5 text-[11px] font-extrabold ${SELO[cor]}`}>{children}</span>;
}

export function SeloEstado({ estado }: { estado: string }) {
  if (estado === 'ativa') return <Selo cor="verde">Ativa</Selo>;
  if (estado === 'pausada') return <Selo cor="cinza">Pausada</Selo>;
  return <Selo cor="ambar">Esperando cadastro</Selo>;
}

const CORES = ['#3E9D70', '#4583D6', '#C066AE', '#E58A1F', '#5F6CCB', '#33A99F', '#7F5FD6', '#D9434F'];

export function corDe(id: string): string {
  let h = 7;
  for (const ch of id) h = (Math.imul(31, h) + ch.charCodeAt(0)) | 0;
  return CORES[Math.abs(h) % CORES.length];
}

export function iniciais(nome: string | null | undefined): string {
  return (nome || '?').split(/\s+/).filter(Boolean).map((x) => x[0]).slice(0, 2).join('').toUpperCase();
}

export function Avatar({ id, nome, foto, tamanho = 36 }: { id: string; nome: string | null; foto?: string | null; tamanho?: number }) {
  if (foto) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={foto} alt="" width={tamanho} height={tamanho} className="shrink-0 rounded-full object-cover" style={{ width: tamanho, height: tamanho }} />;
  }
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full font-extrabold text-white"
      style={{ width: tamanho, height: tamanho, background: corDe(id), fontSize: Math.round(tamanho * 0.38) }}
    >
      {iniciais(nome)}
    </span>
  );
}

export function Aviso({ tom = 'lilas', children }: { tom?: 'lilas' | 'vermelho' | 'verde' | 'ambar'; children: React.ReactNode }) {
  const cls = {
    lilas: 'bg-[#F3EEFC] text-[#4B3A8C]',
    vermelho: 'bg-[#FDEEEE] text-[#9B2C2C]',
    verde: 'bg-[#EEF8F1] text-[#256B43]',
    ambar: 'bg-[#FFF8EC] text-[#7A5A12]',
  }[tom];
  return <div className={`mt-4 rounded-[18px] px-4 py-3 text-[13.5px] leading-relaxed ${cls}`}>{children}</div>;
}

export function Retorno({ ok, erro }: { ok?: string; erro?: string }) {
  if (!ok && !erro) return null;
  return (
    <div className={`mb-4 rounded-2xl px-4 py-3 text-sm font-semibold ${erro ? 'bg-red-50 text-red-600' : 'bg-[#EEF8F1] text-[#256B43]'}`} role="status">
      {erro || ok}
    </div>
  );
}

export function Abas({ base, atual, abas, extra = {} }: { base: string; atual: string; abas: [string, string][]; extra?: Record<string, string> }) {
  return (
    <div className="mb-5 flex flex-wrap gap-1.5">
      {abas.map(([k, t]) => {
        const q = new URLSearchParams({ ...extra, aba: k });
        return (
          <Link
            key={k}
            href={`${base}?${q.toString()}`}
            className={`rounded-pill px-3.5 py-2 text-[12.5px] font-bold transition ${
              atual === k ? 'bg-[#24164F] text-white' : 'bg-white text-ninho-cinza shadow-[inset_0_0_0_1.5px_#ECE6F5] hover:text-ninho-roxo-escuro'
            }`}
          >
            {t}
          </Link>
        );
      })}
    </div>
  );
}

export const th = 'border-b border-[#F0ECF6] px-2 py-2 text-left text-[10.5px] font-extrabold uppercase tracking-[0.07em] text-[#9A95AD]';
export const td = 'border-b border-[#F5F2FA] px-2 py-2.5 align-middle text-[13px]';

export const botao = {
  grad: 'inline-flex h-10 items-center justify-center gap-2 rounded-pill bg-gradient-primary px-4 text-[13.5px] font-bold text-white shadow-[0_10px_18px_-10px_rgba(140,92,248,.8)] disabled:opacity-50',
  verde: 'inline-flex h-8 items-center justify-center rounded-pill bg-[#4CAF74] px-3 text-[12.5px] font-bold text-white',
  suave: 'inline-flex h-8 items-center justify-center rounded-pill bg-[#F1EBFC] px-3 text-[12.5px] font-bold text-[#7C5CD6]',
  cinza: 'inline-flex h-8 items-center justify-center rounded-pill bg-[#F0EEF4] px-3 text-[12.5px] font-bold text-ninho-cinza',
  vermelho: 'inline-flex h-8 items-center justify-center rounded-pill bg-[#FDEEEE] px-3 text-[12.5px] font-bold text-[#E85D5D]',
};

export const campo = 'h-10 w-full rounded-xl border-[1.5px] border-transparent bg-[#F5F2FB] px-3 text-[13.5px] font-semibold outline-none focus:border-ninho-roxo';
export const rotuloCampo = 'mb-1 mt-3 block text-[11.5px] font-bold text-[#9A95AD]';

/** Chave liga/desliga (dentro de um <form>). */
export function Chave({ ligada, desabilitada = false }: { ligada: boolean; desabilitada?: boolean }) {
  return (
    <button
      type="submit"
      title="Aparecer em Encontrar consultora de sono"
      className={`relative inline-block h-[26px] w-11 rounded-full align-middle transition ${ligada ? 'bg-[#4CAF74]' : 'bg-[#E2DEEA]'} ${desabilitada ? 'opacity-45' : ''}`}
    >
      <span className="absolute top-[3px] h-5 w-5 rounded-full bg-white shadow transition-all" style={{ left: ligada ? 21 : 3 }} />
    </button>
  );
}
