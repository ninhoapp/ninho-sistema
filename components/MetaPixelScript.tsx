'use client';

/**
 * Ninho · Meta Pixel
 *
 * Só nas páginas públicas do site. Nunca no /admin (painel do dono e da
 * consultora, com dados de famílias e bebês) nem em /api.
 *
 * - PageView sai no init (só na 1ª página aberta).
 * - disablePushState: a navegação interna do Next não gera PageView sozinha,
 *   então ir de uma página pública para o /admin não manda nada à Meta.
 * - autoConfig desligado: o Pixel não lê botões nem metadados da página por
 *   conta própria; só vai o que o código manda (PageView e o Lead do
 *   formulário "Seja consultora").
 *
 * ID em lib/config.ts (META_PIXEL_ID; a env NEXT_PUBLIC_META_PIXEL_ID só troca).
 * Está na Política de Privacidade, item 7.8.
 */
import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { META_PIXEL_ID } from '@/lib/config';

const PRIVADO = /^\/(admin|api)(\/|$)/;

export function MetaPixelScript() {
  const pathname = usePathname() ?? '';
  if (!META_PIXEL_ID || PRIVADO.test(pathname)) return null;

  // Sem o <noscript><img> de reserva: o Next pré-carrega essa imagem e ela
  // contava um PageView a mais em toda visita.
  return (
    <Script
        id="meta-pixel"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window,document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq.disablePushState = true;
            fbq('set', 'autoConfig', false, '${META_PIXEL_ID}');
            fbq('init', '${META_PIXEL_ID}');
            fbq('track', 'PageView');
          `,
        }}
      />
  );
}
