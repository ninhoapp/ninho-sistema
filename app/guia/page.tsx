/**
 * /guia — índice das perguntas comuns de pais (conteúdo em lib/guias.ts).
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE_URL } from '@/lib/config';
import { GUIAS, CATEGORIAS } from '@/lib/guias';
import { SitePage, StoreButtons, JsonLd } from '@/components/site/SiteChrome';

const DESCRICAO =
  'Respostas diretas para as dúvidas mais comuns dos primeiros meses: quanto o recém-nascido dorme, intervalo entre mamadas, janela de sono, fraldas e rotina.';

export const metadata: Metadata = {
  title: 'Guia para pais de recém-nascido: sono, mamada e fralda | Ninho',
  description: DESCRICAO,
  alternates: { canonical: `${SITE_URL}/guia` },
  openGraph: {
    title: 'Guia para pais de recém-nascido | Ninho',
    description: DESCRICAO,
    type: 'website',
    url: `${SITE_URL}/guia`,
    siteName: 'Ninho',
    locale: 'pt_BR',
  },
};

export default function GuiaIndice() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Guia para pais de recém-nascido',
    description: DESCRICAO,
    url: `${SITE_URL}/guia`,
    inLanguage: 'pt-BR',
    hasPart: GUIAS.map((g) => ({
      '@type': 'Article',
      headline: g.pergunta,
      url: `${SITE_URL}/guia/${g.slug}`,
    })),
  };

  return (
    <SitePage>
      <JsonLd data={jsonLd} />
      <header className="n-artigo-topo">
        <div className="n-wrap">
          <ol className="n-trilha" aria-label="Você está em">
            <li><Link href="/landing">Ninho</Link></li>
            <li>Guia para pais</li>
          </ol>
          <span className="n-rotulo">Guia para pais</span>
          <h1 style={{ maxWidth: 760 }}>As dúvidas de quem acabou de ter bebê, respondidas</h1>
          <p className="n-hero-sub" style={{ margin: 0 }}>{DESCRICAO}</p>
        </div>
      </header>

      <section style={{ padding: '8px 0 72px' }}>
        <div className="n-wrap">
          {CATEGORIAS.map((cat) => {
            const itens = GUIAS.filter((g) => g.categoria === cat);
            if (!itens.length) return null;
            return (
              <div key={cat}>
                <h2 className="n-indice-cat">{cat}</h2>
                <div className="n-guias">
                  {itens.map((g) => (
                    <Link key={g.slug} href={`/guia/${g.slug}`} className="n-guia-card">
                      <small>{g.categoria}</small>
                      <strong>{g.pergunta}</strong>
                      <span>{g.descricao}</span>
                      <em>Ler resposta →</em>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="n-final">
        <div className="n-wrap">
          <div className="n-final-box">
            <h2>Anote a rotina sem esforço</h2>
            <p>O Ninho registra mamada, sono e fralda num toque e mostra o que vem depois.</p>
            <StoreButtons claro />
          </div>
        </div>
      </section>
    </SitePage>
  );
}
