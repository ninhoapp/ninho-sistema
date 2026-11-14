/**
 * Moldura de iPhone para desenhar as telas do app no manual da consultora.
 * As telas usam as cores e os textos reais do app (lilás #9F86E0, fundo
 * #F2F3F6, módulos brancos, botões em pílula). Nada aqui é print: é desenho.
 */
export function Celular({ children, legenda, fundo = '#F2F3F6' }: { children: React.ReactNode; legenda?: string; fundo?: string }) {
  return (
    <figure className="flex w-[210px] shrink-0 flex-col items-center">
      <div className="relative h-[430px] w-[210px] rounded-[34px] bg-[#1E1F25] p-[7px] shadow-[0_24px_40px_-24px_rgba(40,20,90,.55)]">
        <div className="relative h-full w-full overflow-hidden rounded-[28px]" style={{ background: fundo }}>
          <div className="absolute left-1/2 top-[7px] z-10 h-[18px] w-[64px] -translate-x-1/2 rounded-full bg-[#1E1F25]" />
          <div className="flex h-[30px] items-end justify-between px-5 pb-0.5 text-[9px] font-bold text-[#1E1F25]">
            <span>9:41</span>
            <span>5G</span>
          </div>
          <div className="h-[calc(100%-30px)] overflow-hidden text-[10px] leading-snug text-[#1E1F25]">{children}</div>
        </div>
      </div>
      {legenda && <figcaption className="mt-2 max-w-[200px] text-center text-[11.5px] font-semibold leading-snug text-ninho-cinza">{legenda}</figcaption>}
    </figure>
  );
}

/** Head lilás do app (gradiente com curva embaixo), com título e subtítulo. */
export function Head({ titulo, sub }: { titulo: string; sub?: string }) {
  return (
    <div className="rounded-b-[26px] bg-gradient-to-br from-[#BB92FF] to-[#A985FA] px-3.5 pb-5 pt-2 text-white">
      <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-[9px] font-black text-[#7C5CD6]">N</span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] font-black">{titulo}</p>
          {sub && <p className="truncate text-[9px] opacity-90">{sub}</p>}
        </div>
      </div>
    </div>
  );
}

/** Módulo branco do app. */
export function Modulo({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`mx-2.5 mt-2.5 rounded-[16px] bg-white p-2.5 ${className}`}>{children}</div>;
}

/** Botão em pílula. `tom`: lilás (principal), branco com borda, verde, cinza. */
export function Pilula({ children, tom = 'lilas', dedo = false }: { children: React.ReactNode; tom?: 'lilas' | 'branco' | 'verde' | 'cinza' | 'preto'; dedo?: boolean }) {
  const cor = {
    lilas: 'bg-[#8C5CF8] text-white',
    branco: 'bg-white text-[#1E1F25] shadow-[inset_0_0_0_1px_#ECE6F5]',
    verde: 'bg-[#4CAF74] text-white',
    cinza: 'bg-[#F0EEF4] text-[#6B6F80]',
    preto: 'bg-[#1E1F25] text-white',
  }[tom];
  return (
    <div className={`relative mt-1.5 flex h-[26px] items-center justify-center rounded-full px-2 text-[9.5px] font-bold ${cor}`}>
      {children}
      {dedo && <Dedo />}
    </div>
  );
}

/** Marca de toque: onde a pessoa toca naquela tela. */
export function Dedo() {
  return (
    <span className="pointer-events-none absolute -bottom-1.5 right-3 flex h-6 w-6 items-center justify-center rounded-full bg-[#F7A83C]/35 ring-2 ring-[#F7A83C]">
      <span className="h-2 w-2 rounded-full bg-[#F7A83C]" />
    </span>
  );
}
