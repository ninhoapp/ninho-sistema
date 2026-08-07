import type { Metadata } from 'next';
import { MetaPixelScript } from '@/components/MetaPixelScript';
import { SITE_URL } from '@/lib/config';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'Ninho — Cada momento do seu bebê, no lugar certo',
  description:
    'Ninho — o app que acompanha o dia a dia do seu bebê. Sono, mamadas, fraldas, vacinas, crescimento e memórias, compartilhados com quem cuida junto.',
  icons: { icon: '/brand/ninho-logo.png', apple: '/brand/ninho-logo.png' },
  openGraph: {
    title: 'Ninho — Cada momento do seu bebê, no lugar certo',
    description:
      'Sono, mamadas, fraldas, vacinas, crescimento e memórias. Tudo registrado em segundos e compartilhado com quem cuida junto.',
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
