import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Ninho — em breve nas lojas',
  description: 'O Ninho está a caminho da App Store e do Google Play.',
  robots: { index: false },
};

/**
 * Página de espera. É para onde /get/ios e /get/android mandam enquanto as
 * lojas não estão configuradas em lib/config.ts.
 *
 * Assim que STORE_IOS_URL / STORE_ANDROID_URL forem preenchidas, os botões
 * passam a ir direto para a loja e esta página deixa de ser alcançada.
 */
export default function EmBrevePage({
  searchParams,
}: {
  searchParams: { de?: string };
}) {
  const loja = searchParams.de === 'android' ? 'Google Play' : 'App Store';

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-ninho-lavanda px-6 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/ninho-logo-limpo.png"
        alt="Ninho"
        className="mb-6 h-24 w-24 object-contain"
      />
      <h1 className="max-w-md text-3xl font-bold tracking-tight text-ninho-grafite">
        Estamos chegando na {loja}
      </h1>
      <p className="mt-4 max-w-sm text-base leading-relaxed text-ninho-cinza">
        O Ninho está em revisão na loja. Assim que for aprovado, este link leva
        você direto para o download.
      </p>
      <Link
        href="/landing"
        className="mt-8 rounded-pill bg-ninho-roxo px-8 py-3.5 text-base font-semibold text-white transition hover:bg-ninho-roxo-escuro"
      >
        Conhecer o Ninho
      </Link>
    </main>
  );
}
