/**
 * /parceiros — Guia do parceiro aberto ao público (aba "Seja parceiro" no
 * menu do site). Para os criadores de conteúdo que o dono está contatando
 * entenderem a parceria antes de fechar. Mesmo conteúdo do guia do painel
 * (components/parceiros/GuiaParceiroConteudo.tsx); preços de lib/precos.ts.
 */
import type { Metadata } from 'next';
import { SITE_URL, CONTATO_EMAIL } from '@/lib/config';
import { SitePage } from '@/components/site/SiteChrome';
import { GuiaParceiroConteudo } from '@/components/parceiros/GuiaParceiroConteudo';

const DESCRICAO =
  'Como funciona a parceria com o Ninho: link e código próprios, como o download é contado, comissão de 25% sobre a assinatura, pagamento por Pix e o que falar (e não falar) no conteúdo.';

export const metadata: Metadata = {
  title: 'Seja parceiro do Ninho: guia da parceria | Ninho',
  description: DESCRICAO,
  alternates: { canonical: `${SITE_URL}/parceiros` },
  openGraph: {
    title: 'Seja parceiro do Ninho',
    description: DESCRICAO,
    type: 'website',
    url: `${SITE_URL}/parceiros`,
    siteName: 'Ninho',
    locale: 'pt_BR',
  },
};

export default function ParceirosPage() {
  const assunto = encodeURIComponent('Quero ser parceiro do Ninho');
  return (
    <SitePage>
      <section className="n-wrap" style={{ paddingTop: 48, paddingBottom: 24 }}>
        <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-ninho-roxo-escuro">Seja parceiro</p>
        <h1 className="text-3xl font-extrabold text-ninho-grafite sm:text-4xl">Guia do parceiro</h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-ninho-cinza">
          Tudo para conhecer o Ninho, falar dele do jeito certo e entender como a parceria funciona: o seu link e o
          seu código, como cada download é contado, quanto você ganha e quando recebe.
        </p>
        <a
          href={`mailto:${CONTATO_EMAIL}?subject=${assunto}`}
          className="n-btn n-btn-roxo"
          style={{ marginTop: 20, display: 'inline-flex' }}
        >
          Quero ser parceiro
        </a>
      </section>
      <section className="n-wrap" style={{ paddingBottom: 64 }}>
        <GuiaParceiroConteudo publico />
      </section>
    </SitePage>
  );
}
