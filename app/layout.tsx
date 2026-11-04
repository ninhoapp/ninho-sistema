import type { Metadata } from 'next';
import { MetaPixelScript } from '@/components/MetaPixelScript';
import { SITE_URL } from '@/lib/config';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'Ninho: app de rotina do bebê — mamada, sono e fralda',
  description:
    'Ninho — o app de rotina do bebê. Mamada, sono e fralda num toque, a próxima soneca e mamada à vista e o dia compartilhado com quem cuida junto.',
  icons: { icon: '/brand/ninho-logo.png', apple: '/brand/ninho-logo.png' },
  openGraph: {
    title: 'Ninho: app de rotina do bebê',
    description:
      'Mamada, sono e fralda registrados num toque, a próxima soneca e mamada à vista e o dia compartilhado com quem cuida junto.',
    type: 'website',
    url: SITE_URL,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <MetaPixelScript />
        {children}
      </body>
    </html>
  );
}
