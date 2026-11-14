/**
 * Ícones das telas do app, desenhados em SVG (dono, 14/11/2026: os mockups do
 * manual tinham "cara de animação" porque no lugar dos ícones havia texto).
 *
 * São os mesmos Ionicons que o app usa (`@expo/vector-icons`), redesenhados
 * como SVG inline porque o PDF é gerado com `skipFonts: true` — fonte de ícone
 * não apareceria. Traço de 2 no espaço 24x24, como o Ionicons outline.
 * O nome de cada um é o nome do ícone no app.
 */

type P = { size?: number; color?: string; strokeWidth?: number };

function Svg({ size = 20, color = 'currentColor', strokeWidth = 2, children }: P & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      style={{ display: 'block', flexShrink: 0 }}
    >
      {children}
    </svg>
  );
}

export function IconeCasa(p: P) {
  return (
    <Svg {...p}>
      <path d="M3.5 10.5 12 3.5l8.5 7" />
      <path d="M5.5 9.8V20h13V9.8" />
      <path d="M9.5 20v-5.5h5V20" />
    </Svg>
  );
}

export function IconeRelogio(p: P) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </Svg>
  );
}

export function IconeBarras(p: P) {
  return (
    <Svg {...p}>
      <path d="M5 20V12" />
      <path d="M12 20V5" />
      <path d="M19 20v-5" />
    </Svg>
  );
}

export function IconePessoaMais(p: P) {
  return (
    <Svg {...p}>
      <circle cx="10" cy="8" r="3.6" />
      <path d="M3.8 20c0-3.4 2.8-5.6 6.2-5.6 1.2 0 2.3.3 3.2.8" />
      <path d="M17.5 14.5v6M14.5 17.5h6" />
    </Svg>
  );
}

export function IconeDinheiro(p: P) {
  return (
    <Svg {...p}>
      <rect x="3" y="7" width="18" height="10" rx="2.5" />
      <circle cx="12" cy="12" r="2.4" />
      <path d="M6.5 12h.01M17.5 12h.01" />
    </Svg>
  );
}

export function IconeMenu(p: P) {
  return (
    <Svg {...p}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </Svg>
  );
}

export function IconeSino(p: P) {
  return (
    <Svg {...p}>
      <path d="M6.5 10a5.5 5.5 0 0 1 11 0c0 3 .7 4.6 1.5 5.5H5c.8-.9 1.5-2.5 1.5-5.5Z" />
      <path d="M10 18.5a2.1 2.1 0 0 0 4 0" />
    </Svg>
  );
}

export function IconeHeadset(p: P) {
  return (
    <Svg {...p}>
      <path d="M4.5 15v-3a7.5 7.5 0 0 1 15 0v3" />
      <rect x="3" y="14" width="3.6" height="5.5" rx="1.6" />
      <rect x="17.4" y="14" width="3.6" height="5.5" rx="1.6" />
    </Svg>
  );
}

export function IconeMonitor(p: P) {
  return (
    <Svg {...p}>
      <rect x="3" y="4.5" width="18" height="12" rx="2.2" />
      <path d="M9 20h6M12 16.5V20" />
    </Svg>
  );
}

export function IconeSeta({ dir = 'cima', ...p }: P & { dir?: 'cima' | 'baixo' | 'direita' }) {
  const d = dir === 'cima' ? 'M6 14.5 12 9l6 5.5' : dir === 'baixo' ? 'M6 9.5 12 15l6-5.5' : 'M9.5 6 15 12l-5.5 6';
  return (
    <Svg {...p}>
      <path d={d} />
    </Svg>
  );
}

export function IconeLua(p: P) {
  return (
    <Svg {...p}>
      <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" />
    </Svg>
  );
}

export function IconeBusca(p: P) {
  return (
    <Svg {...p}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4 4" />
    </Svg>
  );
}

export function IconePessoas(p: P) {
  return (
    <Svg {...p}>
      <circle cx="9" cy="8.5" r="3.2" />
      <path d="M3.5 19.5c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
      <path d="M16 6.2a3.1 3.1 0 0 1 0 6M17.5 14.8c2 .5 3.2 2.2 3.2 4.7" />
    </Svg>
  );
}

export function IconeCompartilhar(p: P) {
  return (
    <Svg {...p}>
      <path d="M12 3.5v11" />
      <path d="M8.5 7 12 3.5 15.5 7" />
      <path d="M5.5 12.5V20h13v-7.5" />
    </Svg>
  );
}

export function IconeCopiar(p: P) {
  return (
    <Svg {...p}>
      <rect x="9" y="9" width="11" height="11" rx="2.2" />
      <path d="M15 6.5V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h.5" />
    </Svg>
  );
}

export function IconeEstrela(p: P) {
  return (
    <Svg {...p}>
      <path d="M12 4.5l2.3 4.7 5.2.7-3.8 3.6.9 5.1L12 16.2l-4.6 2.4.9-5.1-3.8-3.6 5.2-.7Z" />
    </Svg>
  );
}

export function IconeCamera(p: P) {
  return (
    <Svg {...p}>
      <path d="M4 8.5h3l1.5-2h7L17 8.5h3v11H4Z" />
      <circle cx="12" cy="14" r="3.2" />
    </Svg>
  );
}

export function IconeCheck({ size = 14, color = '#FFFFFF' }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden style={{ display: 'block' }}>
      <path d="M5 12.5 10 17.5 19 7" />
    </svg>
  );
}

export function IconeEnvelope(p: P) {
  return (
    <Svg {...p}>
      <rect x="3" y="5.5" width="18" height="13" rx="2.4" />
      <path d="M4 7.5l8 5.5 8-5.5" />
    </Svg>
  );
}

export function IconeOlho(p: P) {
  return (
    <Svg {...p}>
      <path d="M2.8 12S6 6.5 12 6.5 21.2 12 21.2 12 18 17.5 12 17.5 2.8 12 2.8 12Z" />
      <circle cx="12" cy="12" r="2.6" />
    </Svg>
  );
}

export function IconeApple({ size = 18, color = '#FFFFFF' }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden style={{ display: 'block' }}>
      <path d="M16.4 12.7c0-2.2 1.8-3.3 1.9-3.3-1-1.5-2.6-1.7-3.2-1.7-1.4-.1-2.6.8-3.3.8-.7 0-1.7-.8-2.9-.8-1.5 0-2.9.9-3.7 2.3-1.6 2.7-.4 6.8 1.1 9 .8 1.1 1.7 2.3 2.9 2.2 1.2 0 1.6-.7 3-.7s1.8.7 3 .7c1.3 0 2.1-1.2 2.9-2.3.6-.9.9-1.4 1.3-2.4-2.4-.9-3-3.6-3-3.8Zm-2.2-7c.6-.8 1.1-1.9 1-3-1 0-2.1.6-2.8 1.4-.6.7-1.1 1.8-1 2.9 1.1.1 2.2-.5 2.8-1.3Z" />
    </svg>
  );
}

export function LogoGoogle({ size = 17 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden style={{ display: 'block' }}>
      <path fill="#4285F4" d="M45 24c0-1.5-.1-2.6-.4-3.8H24v7.2h11.9c-.2 2-1.5 4.9-4.4 6.9l-.1.3 6.4 5 .4.1C42.3 36.1 45 30.6 45 24Z" />
      <path fill="#34A853" d="M24 46c5.8 0 10.6-1.9 14.2-5.2l-6.8-5.2c-1.8 1.3-4.3 2.2-7.4 2.2-5.6 0-10.4-3.7-12.1-8.8l-.3.1-6.6 5.1-.1.3C8.4 41 15.6 46 24 46Z" />
      <path fill="#FBBC05" d="M11.9 29c-.4-1.3-.7-2.6-.7-4s.3-2.7.7-4l-.1-.3-6.7-5.2-.2.1A21.9 21.9 0 0 0 2 25c0 3.5.9 6.9 2.9 9.4l7-5.4Z" />
      <path fill="#EA4335" d="M24 9.5c4 0 6.7 1.7 8.2 3.1l6-5.8C34.5 3.5 29.8 2 24 2 15.6 2 8.4 7 4.9 15.6l7 5.4C13.6 15.9 18.4 9.5 24 9.5Z" />
    </svg>
  );
}

export function IconeZapBranco({ size = 18, color = '#FFFFFF' }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden style={{ display: 'block' }}>
      <path d="M12 2.2a9.8 9.8 0 0 0-8.3 15l-1.4 5.1 5.3-1.4A9.8 9.8 0 1 0 12 2.2Zm5.4 13.7c-.2.6-1.2 1.2-1.7 1.3-.5 0-1 .1-1.7-.1a12 12 0 0 1-5.6-4.6c-.6-1-.8-1.8-.8-2.5 0-.6.3-1.2.7-1.6.2-.2.4-.3.6-.3h.5c.2 0 .4 0 .5.4l.7 1.7c.1.2 0 .4-.1.5l-.3.4c-.1.2-.3.3-.1.6.2.4.7 1.1 1.3 1.6.7.6 1.3.9 1.6 1 .2.1.4.1.6-.1l.6-.7c.2-.2.4-.2.6-.1l1.6.8c.3.2.4.3.4.5s0 .9-.1 1.2Z" />
    </svg>
  );
}

export function IconeInstagram(p: P) {
  return (
    <Svg {...p}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <path d="M16.8 7.2h.01" />
    </Svg>
  );
}
