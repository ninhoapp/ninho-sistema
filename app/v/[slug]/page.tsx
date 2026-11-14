/**
 * /v/<slug> — um vídeo de ajuda, para abrir no celular.
 *
 * Quem manda estes links é a consultora, pelo app (Convidar família). A página
 * é a mesma para quem tem e para quem não tem o Ninho instalado: vídeo vertical
 * em cima, passos escritos embaixo. Conteúdo em lib/videos-ajuda.ts.
 *
 * Enquanto o MP4 não estiver publicado em public/videos/<slug>.mp4, a página
 * mostra só os passos — nunca um player quebrado.
 */
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SITE_URL } from '@/lib/config';
import { VIDEOS, temArquivo, videoPorSlug } from '@/lib/videos-ajuda';
import './video.css';

export const dynamicParams = false;

export function generateStaticParams() {
  return VIDEOS.map((v) => ({ slug: v.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const v = videoPorSlug(params.slug);
  if (!v) return {};
  const url = `${SITE_URL}/v/${v.slug}`;
  const imagem = temArquivo(v.slug, 'jpg') ? `${SITE_URL}/videos/${v.slug}.jpg` : undefined;
  return {
    title: `${v.titulo} | Ninho`,
    description: v.descricao,
    alternates: { canonical: url },
    robots: v.interno ? { index: false, follow: false } : undefined,
    openGraph: {
      title: v.titulo,
      description: v.descricao,
      type: 'video.other',
      url,
      siteName: 'Ninho',
      locale: 'pt_BR',
      ...(imagem ? { images: [{ url: imagem, width: 720, height: 1280 }] } : {}),
    },
  };
}

export default function VideoPage({ params }: { params: { slug: string } }) {
  const v = videoPorSlug(params.slug);
  if (!v) notFound();

  const temVideo = temArquivo(v.slug, 'mp4');
  const poster = temArquivo(v.slug, 'jpg') ? `/videos/${v.slug}.jpg` : undefined;

  return (
    <div className="vw">
      <div className="vw-palco">
        {temVideo ? (
          <video controls playsInline preload="metadata" poster={poster} src={`/videos/${v.slug}.mp4`} />
        ) : (
          <p className="vw-sem">O passo a passo está logo abaixo, em três passos.</p>
        )}
      </div>

      <div className="vw-in">
        <h1>{v.titulo}</h1>
        <p className="vw-linha">{v.linha}</p>

        {v.abas ? (
          <nav className="vw-abas">
            {v.abas.map((a) => (
              <a key={a.slug} href={`/v/${a.slug}`} className={a.slug === v.slug ? 'on' : undefined}>
                {a.rotulo}
              </a>
            ))}
          </nav>
        ) : null}

        <ol className="vw-passos">
          {v.passos.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ol>

        {v.interno ? null : (
          <a className="vw-btn" href="/abrir">
            Abrir o Ninho
          </a>
        )}

        <p className="vw-pe">
          Ninho · <a href="/landing">useninho.com.br</a>
        </p>
      </div>
    </div>
  );
}
