/**
 * Logo do Ninho — mesmo asset do app (assets/images/00_LOGO SEM FUNGO.png).
 * `pulse` ativa a animação suave (usada na tela de login).
 */
/* eslint-disable @next/next/no-img-element */
export function AdminLogo({ size = 64, pulse = false }: { size?: number; pulse?: boolean }) {
  return (
    <img
      src="/brand/ninho-logo-limpo.png"
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      style={{ width: size, height: size, objectFit: 'contain' }}
      className={pulse ? 'admin-logo-pulse' : undefined}
    />
  );
}
