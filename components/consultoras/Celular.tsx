import {
  IconeBarras,
  IconeCasa,
  IconeDinheiro,
  IconeHeadset,
  IconeMenu,
  IconeMonitor,
  IconePessoaMais,
  IconeRelogio,
  IconeSeta,
  IconeSino,
} from '@/components/consultoras/IconesApp';

/**
 * Moldura de iPhone e peças do app para desenhar as telas do manual.
 *
 * Nada aqui é print: é desenho. Para o desenho sair FIEL (dono, 14/11/2026:
 * "melhore ainda mais a fidelidade dos mockups do PDF com o que de fato é o
 * app hoje, está muito 'animação'"), a tela é desenhada no tamanho REAL do
 * app — 390 x 844 — e só depois reduzida com `scale`. Assim os números aqui
 * são os mesmos do código do app (título de 19, módulo de raio 28 com padding
 * 18, botão de 46 de altura...) em vez de valores inventados.
 *
 * Fonte dos valores, no Ninho-expo:
 *   - `src/theme/tokens/head.ts` (HEAD_TOP/BOTTOM/INK/GLOW)
 *   - `src/theme/tokens/colors.json` (fundo #F5F2FC, lilás #9F86E0 e #7C5CD6…)
 *   - `src/components/AppHeader.tsx` (geometria da head e a onda)
 *   - `src/features/consultora/ui.tsx` (Modulo, BotaoPilula, Rotulo, Dica)
 *   - `src/features/consultora/BarraConsultora.tsx` (barra de baixo)
 * Mudou no app, mude aqui.
 */

// ── Tokens do app ─────────────────────────────────────────
export const HEAD_TOP = '#BB92FF';
export const HEAD_BOTTOM = '#A985FA';
export const HEAD_INK = '#FFFFFF';
export const HEAD_INK_SOFT = 'rgba(255,255,255,0.86)';
export const HEAD_GLOW = 'rgba(255,255,255,0.18)';
export const FUNDO = '#F5F2FC';
export const AREIA = '#F1E9FB';
export const LILAS = '#9F86E0';
export const LILAS_CLARO = '#EDE4FB';
export const LILAS_ESCURO = '#7C5CD6';
export const TINTA = '#1E1F25';
export const TINTA_FRACA = '#6B6F80';
export const ROXO_FUNDO = '#24164F';
export const VERDE = '#4CAF74';
export const GRAD_FIM = '#8C5CF8';
export const GRAD_INICIO = '#A46DFF';

/** Tela do app, em pontos. */
const W = 390;
const H = 844;
/** Quanto a tela é reduzida para caber no manual e no PDF. */
const ESCALA = 0.565;
/** Status bar + ilha do aparelho. */
const SAFE_TOP = 44;
/** AppHeader: safeTop + 12 de padding + conteúdo (82) + a curva (15). */
export const HEAD_H = SAFE_TOP + 82 + 15;
/** O lilás desce por trás do 1º módulo. */
const HEAD_UNDER = 46;
const ONDA = 'M0 16 C 100 40, 200 0, 290 16 S 370 26, 390 18 L390 34 L0 34Z';

export const SOMBRA_MODULO = '0 10px 24px -12px rgba(35,26,61,.22)';

export function Celular({
  children,
  legenda,
  fundo = FUNDO,
  statusEscura = false,
}: {
  children: React.ReactNode;
  legenda?: string;
  fundo?: string;
  /** Hora e ícones escuros: telas sem o lilás da head em cima. */
  statusEscura?: boolean;
}) {
  const larg = Math.round(W * ESCALA);
  const alt = Math.round(H * ESCALA);
  return (
    <figure className="flex shrink-0 flex-col items-center" style={{ width: larg + 14 }}>
      <div
        className="relative rounded-[34px] bg-[#111114] p-[7px]"
        style={{ width: larg + 14, height: alt + 14, boxShadow: '0 24px 40px -24px rgba(40,20,90,.55)' }}
      >
        <div className="relative overflow-hidden rounded-[28px]" style={{ width: larg, height: alt, background: fundo }}>
          <div style={{ width: W, height: H, transform: `scale(${ESCALA})`, transformOrigin: 'top left', position: 'relative' }}>
            <StatusBar escura={statusEscura} />
            {children}
          </div>
        </div>
      </div>
      {legenda && (
        <figcaption className="mt-2 text-center text-[11.5px] font-semibold leading-snug text-ninho-cinza" style={{ maxWidth: larg + 14 }}>
          {legenda}
        </figcaption>
      )}
    </figure>
  );
}

/** Hora, sinal, wifi e bateria, como o iPhone mostra (a ilha fica por cima). */
function StatusBar({ escura }: { escura: boolean }) {
  const cor = escura ? '#1E1F25' : '#FFFFFF';
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: SAFE_TOP, zIndex: 20 }}>
      <div style={{ position: 'absolute', top: 11, left: '50%', transform: 'translateX(-50%)', width: 118, height: 33, borderRadius: 999, background: '#111114' }} />
      <div style={{ position: 'absolute', top: 16, left: 30, color: cor, fontSize: 15, fontWeight: 700, letterSpacing: -0.2 }}>9:41</div>
      <div style={{ position: 'absolute', top: 19, right: 26, display: 'flex', alignItems: 'flex-end', gap: 5 }}>
        <svg width="18" height="12" viewBox="0 0 18 12" aria-hidden>
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x={i * 4.6} y={9 - i * 2.8} width="3.2" height={3 + i * 2.8} rx="1" fill={cor} />
          ))}
        </svg>
        <svg width="16" height="12" viewBox="0 0 16 12" aria-hidden>
          <path d="M8 10.4 1.2 4.2a9.8 9.8 0 0 1 13.6 0Z" fill={cor} opacity="0.95" />
        </svg>
        <svg width="26" height="13" viewBox="0 0 26 13" aria-hidden>
          <rect x="0.7" y="0.7" width="21" height="11.6" rx="3.4" fill="none" stroke={cor} strokeOpacity="0.5" />
          <rect x="2.4" y="2.4" width="17.6" height="8.2" rx="2.2" fill={cor} />
          <path d="M23.4 4.6v4a2.2 2.2 0 0 0 0-4Z" fill={cor} opacity="0.5" />
        </svg>
      </div>
    </div>
  );
}

/**
 * Head do app: gradiente lilás com brilho no canto, logo redondo, título,
 * subtítulo, sino e ☰, e a onda embaixo. `semAcoes` tira sino e menu.
 */
export function Head({
  titulo,
  sub,
  fundoDaTela = FUNDO,
  semAcoes = false,
  sinoComAviso = false,
}: {
  titulo: string;
  sub?: string;
  fundoDaTela?: string;
  semAcoes?: boolean;
  sinoComAviso?: boolean;
}) {
  return (
    <div style={{ position: 'relative', height: HEAD_H }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: HEAD_H + HEAD_UNDER, overflow: 'hidden', background: `linear-gradient(180deg, ${HEAD_TOP}, ${HEAD_BOTTOM})` }}>
        <div style={{ position: 'absolute', top: -90, right: -70, width: 240, height: 240, borderRadius: 120, background: HEAD_GLOW }} />
        <svg width={W} height={34} viewBox="0 0 390 34" preserveAspectRatio="none" style={{ position: 'absolute', left: 0, bottom: -1 }} aria-hidden>
          <path d={ONDA} fill={fundoDaTela} />
        </svg>
      </div>
      <div style={{ position: 'relative', paddingTop: SAFE_TOP + 12, paddingBottom: 18, paddingLeft: 18, paddingRight: 18, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 46, height: 46, borderRadius: 23, background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(35,26,61,.08)', overflow: 'hidden' }}>
          {/* Logo oficial do Ninho (Ninho-expo/assets/images/00_LOGO SEM FUNGO.png). */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/manual/logo-ninho.png" alt="" width={36} height={36} style={{ display: 'block' }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ color: HEAD_INK, fontWeight: 800, fontSize: 19, lineHeight: '23px', letterSpacing: -0.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{titulo}</p>
          {sub && <p style={{ color: HEAD_INK_SOFT, fontSize: 13.5, lineHeight: '18px', marginTop: 2 }}>{sub}</p>}
        </div>
        {!semAcoes && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ position: 'relative', width: 38, height: 38, borderRadius: 19, background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(35,26,61,.08)' }}>
              <IconeSino size={21} color={LILAS_ESCURO} />
              {sinoComAviso && (
                <span style={{ position: 'absolute', top: -2, right: -2, minWidth: 17, height: 17, borderRadius: 999, background: '#E85D5D', color: '#FFFFFF', fontSize: 10.5, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>1</span>
              )}
            </div>
            <div style={{ width: 38, height: 38, borderRadius: 19, background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(35,26,61,.08)' }}>
              <IconeMenu size={21} color={LILAS_ESCURO} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** Módulo branco do app: raio 28, padding 18, sombra "floating". */
export function Modulo({ children, style, padding = 18 }: { children: React.ReactNode; style?: React.CSSProperties; padding?: number }) {
  return <div style={{ background: '#FFFFFF', borderRadius: 28, padding, boxShadow: SOMBRA_MODULO, ...style }}>{children}</div>;
}

/** O conteúdo de uma tela da consultora: módulos com 12 de lado e 12 de vão. */
export function Corpo({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ position: 'relative', marginTop: -8, paddingLeft: 12, paddingRight: 12, display: 'flex', flexDirection: 'column', gap: 12, ...style }}>
      {children}
    </div>
  );
}

/** Rótulo em maiúsculas dos módulos. */
export function Rotulo({ children }: { children: React.ReactNode }) {
  return <p style={{ color: TINTA_FRACA, opacity: 0.85, fontWeight: 800, fontSize: 11, letterSpacing: 0.9, textTransform: 'uppercase' }}>{children}</p>;
}

/** Texto de apoio (Dica, no app): 13 com entrelinha 19. */
export function Dica({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <p style={{ color: TINTA_FRACA, fontSize: 13, lineHeight: '19px', ...style }}>{children}</p>;
}

export function Titulo({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <p style={{ color: TINTA, fontSize: 17, fontWeight: 800, ...style }}>{children}</p>;
}

/** BotaoPilula do app: 46 de altura, raio 999, ícone de 18 e texto 14.5. */
export function Pilula({
  children,
  tom = 'lilas',
  icone,
  dedo = false,
  style,
}: {
  children: React.ReactNode;
  tom?: 'lilas' | 'suave' | 'linha' | 'verde' | 'preto' | 'cinza';
  icone?: React.ReactNode;
  dedo?: boolean;
  style?: React.CSSProperties;
}) {
  const t = {
    lilas: { bg: GRAD_FIM, fg: '#FFFFFF', borda: 'none' },
    suave: { bg: '#F1EBFC', fg: LILAS_ESCURO, borda: 'none' },
    linha: { bg: '#FFFFFF', fg: TINTA, borda: '1.5px solid #E6E0F0' },
    verde: { bg: VERDE, fg: '#FFFFFF', borda: 'none' },
    preto: { bg: '#111114', fg: '#FFFFFF', borda: 'none' },
    cinza: { bg: '#F0EEF4', fg: TINTA_FRACA, borda: 'none' },
  }[tom];
  return (
    <div
      style={{
        position: 'relative',
        height: 46,
        borderRadius: 999,
        background: t.bg,
        border: t.borda,
        color: t.fg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: '0 16px',
        fontSize: 14.5,
        fontWeight: 700,
        ...style,
      }}
    >
      {icone}
      {children}
      {dedo && <Dedo />}
    </div>
  );
}

/** Campo de texto do app (fundo lilás claríssimo, raio 16). */
export function Campo({ rotulo, valor, placeholder, style }: { rotulo?: string; valor?: string; placeholder?: string; style?: React.CSSProperties }) {
  return (
    <div style={style}>
      {rotulo && <p style={{ color: TINTA_FRACA, fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>{rotulo}</p>}
      <div style={{ height: 48, borderRadius: 16, background: '#F5F2FB', display: 'flex', alignItems: 'center', paddingLeft: 14, paddingRight: 14, fontSize: 14.5, fontWeight: valor ? 700 : 400, color: valor ? TINTA : '#A9A4BB' }}>
        {valor ?? placeholder}
      </div>
    </div>
  );
}

/** Caixa de aceite do app: quadrado de 22 com o check. */
export function Aceite({ children, marcado = true }: { children: React.ReactNode; marcado?: boolean }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <div style={{ width: 22, height: 22, borderRadius: 7, background: marcado ? VERDE : '#FFFFFF', border: marcado ? 'none' : '1.5px solid #DFD7EE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
        {marcado && (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M5 12.5 10 17.5 19 7" />
          </svg>
        )}
      </div>
      <p style={{ flex: 1, color: TINTA_FRACA, fontSize: 12.5, lineHeight: '17px' }}>{children}</p>
    </div>
  );
}

/** Ícone redondo lilás claro, como o app usa nos módulos. */
export function IconeRedondo({ children, size = 52, cor = LILAS_CLARO }: { children: React.ReactNode; size?: number; cor?: string }) {
  return (
    <div style={{ width: size, height: size, borderRadius: size / 2, background: cor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      {children}
    </div>
  );
}

/** Iniciais no círculo colorido (como a consultora vê os bebês). */
export function Iniciais({ nome, size = 42, cor = '#7F5FD6' }: { nome: string; size?: number; cor?: string }) {
  return (
    <div style={{ width: size, height: size, borderRadius: size / 2, background: cor, color: '#FFFFFF', fontSize: Math.round(size * 0.4), fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      {nome.slice(0, 1).toUpperCase()}
    </div>
  );
}

/** Marca de toque: onde a pessoa toca naquela tela. */
export function Dedo({ style }: { style?: React.CSSProperties }) {
  return (
    <span
      style={{
        position: 'absolute',
        right: 18,
        bottom: -14,
        width: 44,
        height: 44,
        borderRadius: 22,
        background: 'rgba(247,168,60,0.30)',
        border: '3px solid #F7A83C',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style,
      }}
    >
      <span style={{ width: 13, height: 13, borderRadius: 7, background: '#F7A83C' }} />
    </span>
  );
}

/**
 * Barra de baixo da consultora (`src/features/consultora/BarraConsultora.tsx`):
 * a pílula branca com as 5 telas (aberta) e, embaixo, Ajuda · setinha · Painel.
 * No app a pílula se fecha sozinha depois de alguns segundos; no manual ela
 * aparece aberta, que é o que a gente quer ensinar.
 */
export function BarraDaConsultora({ ativa, aberta = true }: { ativa: 'Rotina' | 'Evolução' | 'Início' | 'Convidar' | 'Ganhos'; aberta?: boolean }) {
  const itens: { label: string; icone: (p: { size?: number; color?: string }) => React.ReactNode; centro?: boolean }[] = [
    { label: 'Rotina', icone: (p) => <IconeRelogio {...p} /> },
    { label: 'Evolução', icone: (p) => <IconeBarras {...p} /> },
    { label: 'Início', icone: (p) => <IconeCasa {...p} />, centro: true },
    { label: 'Convidar', icone: (p) => <IconePessoaMais {...p} /> },
    { label: 'Ganhos', icone: (p) => <IconeDinheiro {...p} /> },
  ];
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}>
      {aberta && (
        <div
          style={{
            marginLeft: 16,
            marginRight: 16,
            marginBottom: 12,
            background: '#FFFFFF',
            borderRadius: 999,
            paddingTop: 12,
            paddingBottom: 12,
            paddingLeft: 8,
            paddingRight: 8,
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center',
            boxShadow: '0 8px 20px -6px rgba(35,26,61,.18)',
          }}
        >
          {itens.map((it) => {
            const on = it.label === ativa;
            const tam = it.centro ? 48 : 40;
            const corIcone = it.centro ? '#FFFFFF' : on ? LILAS : TINTA_FRACA;
            return (
              <div key={it.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div
                  style={{
                    width: tam,
                    height: tam,
                    borderRadius: tam / 2,
                    background: it.centro ? LILAS : on ? LILAS_CLARO : AREIA,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {it.icone({ size: it.centro ? 22 : 18, color: corIcone })}
                </div>
                <span style={{ fontSize: 10, fontWeight: on ? 700 : 600, color: on ? LILAS : TINTA_FRACA }}>{it.label}</span>
              </div>
            );
          })}
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 20, paddingRight: 20, paddingBottom: 26 }}>
        <div style={{ width: 56, height: 56, borderRadius: 28, background: TINTA, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1, boxShadow: '0 4px 12px -4px rgba(35,26,61,.3)' }}>
          <IconeHeadset size={20} color="#FFFFFF" />
          <span style={{ color: '#FFFFFF', fontSize: 9.5, fontWeight: 700 }}>Ajuda</span>
        </div>
        <div style={{ paddingLeft: 22, paddingRight: 22, paddingTop: 10, paddingBottom: 10, borderRadius: 999, background: '#FFFFFF', boxShadow: '0 2px 6px rgba(35,26,61,.08)' }}>
          <IconeSeta dir={aberta ? 'baixo' : 'cima'} size={20} color={TINTA_FRACA} />
        </div>
        <div style={{ position: 'relative', width: 56, height: 56, borderRadius: 28, background: '#FFFFFF', border: '1.5px solid #E6DEF7', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px -4px rgba(35,26,61,.18)' }}>
          <IconeMonitor size={20} color={ROXO_FUNDO} />
          <span style={{ color: ROXO_FUNDO, fontSize: 9, fontWeight: 800, marginTop: 1 }}>Painel</span>
        </div>
      </div>
    </div>
  );
}
