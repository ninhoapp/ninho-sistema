/**
 * /sejaparceiro/guia — Guia do parceiro completo, aberto ao público (era a página
 * /parceiros até 09/11/2026; a /parceiros virou a página curta "Seja parceiro").
 * Mesmo conteúdo do guia do painel (components/parceiros/GuiaParceiroConteudo.tsx).
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE_URL } from '@/lib/config';
import { SitePage } from '@/components/site/SiteChrome';
import { GuiaParceiroConteudo } from '@/components/parceiros/GuiaParceiroConteudo';

const DESCRICAO =
  'Guia completo da parceria com o Ninho: link e código, como o download é contado, comissão, pagamento por Pix e o que falar (e não falar) no conteúdo.';

export const metadata: Metadata = {
  title: 'Guia do parceiro | Ninho',
  description: DESCRICAO,
  alternates: { canonical: `${SITE_URL}/sejaparceiro/guia` },
  openGraph: { title: 'Guia do parceiro do Ninho', description: DESCRICAO, type: 'website', url: `${SITE_URL}/sejaparceiro/guia`, siteName: 'Ninho', locale: 'pt_BR' },
};

export default function GuiaParceiroPublicoPage() {
  return (
    <SitePage>
      <section className="n-wrap" style={{ paddingTop: 48, paddingBottom: 24 }}>
        <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-ninho-roxo-escuro">Seja parceiro</p>
        <h1 className="text-3xl font-extrabold text-ninho-grafite sm:text-4xl">Guia do parceiro</h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-ninho-cinza">
          Tudo para conhecer o Ninho, falar dele do jeito certo e entender como a parceria funciona.
        </p>
        <Link href="/sejaparceiro#quero-ser-parceiro" className="n-btn n-btn-roxo" style={{ marginTop: 20, display: 'inline-flex' }}>
          Quero ser parceiro
        </Link>
      </section>
      <section className="n-wrap" style={{ paddingBottom: 64 }}>
        <GuiaParceiroConteudo publico />
      </section>
    </SitePage>
  );
}
