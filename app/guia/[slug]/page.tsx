/**
 * /guia/<slug> — uma pergunta comum de pais, respondida de forma direta,
 * com o Ninho como ajuda prática no fim. Conteúdo em lib/guias.ts.
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SITE_URL } from '@/lib/config';
import { GUIAS, FONTES, guiaPorSlug } from '@/lib/guias';
import { SitePage, StoreButtons, Phone, JsonLd } from '@/components/site/SiteChrome';

export const dynamicParams = false;

export function generateStaticParams() {
  return GUIAS.map((g) => ({ slug: g.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const g = guiaPorSlug(params.slug);
  if (!g) return {};
  const url = `${SITE_URL}/guia/${g.slug}`;
  return {
    title: `${g.titulo} | Ninho`,
    description: g.descricao,
    alternates: { canonical: url },
    openGraph: {
      title: g.pergunta,
      description: g.descricao,
      type: 'article',
      url,
      siteName: 'Ninho',
      locale: 'pt_BR',
      modifiedTime: g.atualizado,
    },
  };
}

function dataBr(iso: string) {
  const [a, m, d] = iso.split('-');
  return `${d}/${m}/${a}`;
}

export default function GuiaPage({ params }: { params: { slug: string } }) {
  const g = guiaPorSlug(params.slug);
  if (!g) notFound();

  const url = `${SITE_URL}/guia/${g.slug}`;
  const relacionados = g.relacionados.map((s) => guiaPorSlug(s)).filter(Boolean) as typeof GUIAS;

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: g.pergunta,
      description: g.descricao,
      inLanguage: 'pt-BR',
      dateModified: g.atualizado,
      datePublished: g.atualizado,
      mainEntityOfPage: url,
      image: `${SITE_URL}${g.ninho.tela}`,
      author: { '@type': 'Organization', name: 'Ninho', url: SITE_URL },
      publisher: {
        '@type': 'Organization',
        name: 'Ninho',
        logo: { '@type': 'ImageObject', url: `${SITE_URL}/brand/ninho-logo.png` },
      },
      about: g.categoria,
      ...(g.fontes.length ? { citation: g.fontes.map((f) => FONTES[f].nome) } : {}),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        { q: g.pergunta, a: g.resumo },
        ...g.faqs,
      ].map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Ninho', item: `${SITE_URL}/landing` },
        { '@type': 'ListItem', position: 2, name: 'Guia para pais', item: `${SITE_URL}/guia` },
        { '@type': 'ListItem', position: 3, name: g.pergunta, item: url },
      ],
    },
  ];

  return (
    <SitePage>
      <JsonLd data={jsonLd} />

      <header className="n-artigo-topo">
        <div className="n-wrap-estreito">
          <ol className="n-trilha" aria-label="Você está em">
            <li><Link href="/landing">Ninho</Link></li>
            <li><Link href="/guia">Guia para pais</Link></li>
            <li>{g.categoria}</li>
          </ol>
          <span className="n-rotulo">{g.categoria}</span>
          <h1>{g.pergunta}</h1>
          <div className="n-artigo-meta">
            <span>Por equipe Ninho</span>
            <span>Atualizado em <time dateTime={g.atualizado}>{dataBr(g.atualizado)}</time></span>
            {g.fontes.length > 0 && <span>Com referências da {g.fontes.map((f) => FONTES[f].nome.split(' (')[0].split(' —')[0]).slice(0, 2).join(' e ')}</span>}
          </div>
          <div className="n-resposta">
            <strong>Resposta rápida</strong>
            <p>{g.resumo}</p>
          </div>
        </div>
      </header>

      <article className="n-artigo">
        <div className="n-wrap-estreito">
          {g.secoes.map((s) => (
            <section key={s.titulo}>
              <h2>{s.titulo}</h2>
              {s.tabela && (
                <div className="n-tabela-wrap">
                  <table className="n-tabela">
                    <thead>
                      <tr>{s.tabela.cabecalho.map((c) => <th key={c}>{c}</th>)}</tr>
                    </thead>
                    <tbody>
                      {s.tabela.linhas.map((l, i) => (
                        <tr key={i}>{l.map((c, j) => <td key={j}>{c}</td>)}</tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {s.paragrafos?.map((p, i) => <p key={i}>{p}</p>)}
              {s.lista && (
                <ul className="n-pontos">
                  {s.lista.map((item) => <li key={item}>{item}</li>)}
                </ul>
              )}
            </section>
          ))}

          {g.alerta && (
            <div className="n-aviso" role="note">
              <strong>Quando procurar o pediatra: </strong>
              {g.alerta}
            </div>
          )}

          <aside className="n-ninho-box" aria-label="Como o Ninho ajuda">
            <div>
              <span className="n-rotulo">Como o Ninho ajuda</span>
              <h2>{g.ninho.titulo}</h2>
              <p>{g.ninho.texto}</p>
              {g.ninho.itens && (
                <ul className="n-lista">
                  {g.ninho.itens.map((i) => <li key={i}>{i}</li>)}
                </ul>
              )}
              <StoreButtons />
            </div>
            <Phone src={g.ninho.tela} alt={g.ninho.alt} />
          </aside>

          {g.faqs.length > 0 && (
            <section>
              <h2>Outras dúvidas comuns</h2>
              <div className="n-faq" style={{ margin: 0 }}>
                {g.faqs.map((f) => (
                  <details key={f.q}>
                    <summary>{f.q}</summary>
                    <div><p>{f.a}</p></div>
                  </details>
                ))}
              </div>
            </section>
          )}

          <div className="n-fontes">
            Conteúdo informativo, escrito para ajudar a organizar a rotina. Não substitui a
            avaliação do pediatra, que conhece a história do seu bebê.
            {g.fontes.length > 0 && (
              <>
                {' '}Referências:
                <ul>
                  {g.fontes.map((f) => (
                    <li key={f}>
                      <a href={FONTES[f].url} rel="noopener" target="_blank" style={{ textDecoration: 'underline' }}>
                        {FONTES[f].nome}
                      </a>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      </article>

      {relacionados.length > 0 && (
        <section className="n-secao n-secao-lavanda" style={{ padding: '64px 0' }}>
          <div className="n-wrap">
            <div className="n-cabeca" style={{ marginBottom: 28 }}>
              <h2 style={{ fontSize: 30 }}>Perguntas relacionadas</h2>
            </div>
            <div className="n-guias">
              {relacionados.map((r) => (
                <Link key={r.slug} href={`/guia/${r.slug}`} className="n-guia-card">
                  <small>{r.categoria}</small>
                  <strong>{r.pergunta}</strong>
                  <span>{r.descricao}</span>
                  <em>Ler resposta →</em>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </SitePage>
  );
}
