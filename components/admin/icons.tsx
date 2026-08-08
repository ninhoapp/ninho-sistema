/** Ícones de linha simples (sem dependência externa) usados nos StatCard. */
type IconProps = { className?: string };

const base = 'h-4 w-4';

export function IconCash({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v9M9.5 9.5c0-1.1 1-2 2.5-2s2.5.7 2.5 1.8-1 1.6-2.5 2-2.5.8-2.5 2 1 1.7 2.5 1.7 2.5-.7 2.5-1.7" />
    </svg>
  );
}

export function IconDownload({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="M12 4v11M7.5 11 12 15.5 16.5 11" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 19.5h14" strokeLinecap="round" />
    </svg>
  );
}

export function IconMinusCircle({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12h8" strokeLinecap="round" />
    </svg>
  );
}

export function IconTrendingUp({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="M4 16.5 10 10.5 13.5 14 20 7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 7h5v5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconExchange({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="M4 8h13M13.5 4.5 17 8l-3.5 3.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 16H7M10.5 12.5 7 16l3.5 3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconScale({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="M12 3v18M7 21h10" strokeLinecap="round" />
      <path d="M12 6 5 8l3.2 6.2a3.6 3.6 0 0 0 3.6 0L18.6 8 12 6Z" strokeLinejoin="round" />
      <path d="M5 8h0M18.6 8h0" />
    </svg>
  );
}

export function IconUsers({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <circle cx="9" cy="9" r="3" />
      <path d="M3.5 19c.7-3 2.8-4.5 5.5-4.5s4.8 1.5 5.5 4.5" strokeLinecap="round" />
      <circle cx="17" cy="8.5" r="2.3" />
      <path d="M15.5 14.6c2.2.2 3.7 1.6 4.3 4.4" strokeLinecap="round" />
    </svg>
  );
}

export function IconCard({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="M3.5 10h17" />
      <path d="M7 14.5h4" strokeLinecap="round" />
    </svg>
  );
}

export function IconShieldCheck({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="M12 3.5 5 6v5.5c0 4.2 3 7.4 7 9 4-1.6 7-4.8 7-9V6l-7-2.5Z" strokeLinejoin="round" />
      <path d="m9 12 2 2 4-4.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconCrown({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="M4 17h16l-1.3-8-4.2 3.3L12 6l-2.5 6.3L5.3 9 4 17Z" strokeLinejoin="round" />
      <path d="M6 20h12" strokeLinecap="round" />
    </svg>
  );
}

export function IconClock({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5.3l3.5 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconHourglass({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="M6.5 3.5h11M6.5 20.5h11" strokeLinecap="round" />
      <path d="M7.5 3.5v3.2c0 2 1.6 3 3.2 4.1L12 11l1.3-.8c1.6-1.1 3.2-2.1 3.2-4.1V3.5" strokeLinejoin="round" />
      <path d="M7.5 20.5v-3.2c0-2 1.6-3 3.2-4.1L12 12l1.3.8c1.6 1.1 3.2 2.1 3.2 4.1v3.2" strokeLinejoin="round" />
    </svg>
  );
}

export function IconStar({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.8l-5.2 2.9 1-5.9-4.3-4.1 5.9-.8L12 3.5Z" strokeLinejoin="round" />
    </svg>
  );
}

export function IconPercent({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="M5 19 19 5" strokeLinecap="round" />
      <circle cx="7" cy="7" r="2.2" />
      <circle cx="17" cy="17" r="2.2" />
    </svg>
  );
}

export function IconMegaphone({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="M3.5 10.5v3a1.5 1.5 0 0 0 1.5 1.5h1l1.5 5h2l-1-5h3l7 4v-14l-7 4h-6a1.5 1.5 0 0 0-1.5 1.5Z" strokeLinejoin="round" />
      <path d="M20.5 9v6" strokeLinecap="round" />
    </svg>
  );
}

export function IconServer({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <rect x="3.5" y="4" width="17" height="6" rx="1.5" />
      <rect x="3.5" y="14" width="17" height="6" rx="1.5" />
      <path d="M7 7h.01M7 17h.01" strokeLinecap="round" />
    </svg>
  );
}

export function IconCalendar({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
      <path d="M3.5 9.5h17M8 3v3.5M16 3v3.5" strokeLinecap="round" />
    </svg>
  );
}

/** Bebê — específico do Ninho, usado onde o SOMI usava ícone de produto. */
export function IconBaby({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M9 10.5h.01M15 10.5h.01" strokeLinecap="round" />
      <path d="M9.8 14.5c.6.6 1.3.9 2.2.9s1.6-.3 2.2-.9" strokeLinecap="round" />
    </svg>
  );
}
