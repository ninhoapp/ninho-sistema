/**
 * Ninho · Meta Pixel
 *
 * Server Component — usa next/script pra injetar o código base do Pixel
 * no <head> com estratégia "afterInteractive" (não bloqueia o first paint).
 *
 * PageView é disparado automaticamente pelo init.
 * Eventos de conversão (Lead, Purchase…) ficam nos Client Components.
 *
 * Configurar: NEXT_PUBLIC_META_PIXEL_ID no .env.local e no Vercel.
 */
import Script from 'next/script';

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

export function MetaPixelScript() {
  if (!PIXEL_ID) return null; // sem var → sem pixel (dev sem .env.local)

  return (
    <>
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
            fbq('init','${PIXEL_ID}');
            fbq('track','PageView');
          `,
        }}
      />
      {/* Fallback pra usuários com JavaScript desabilitado */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}
