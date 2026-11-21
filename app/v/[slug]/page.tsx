/**
 * /v/<slug> — um vídeo de ajuda, para abrir no celular.
 *
 * Quem manda estes links é a consultora, pelo app (Convidar família). A página
 * é a mesma para quem tem e para quem não tem o Ninho instalado: vídeo vertical
 * em cima, passos escritos embaixo. Conteúdo em lib/videos-ajuda.ts.
 *
 * O VÍDEO NÃO É UM ARQUIVO (dono, 14/11/2026: "quando mandar o link no
 * WhatsApp, a pessoa tocar, ela tem que ver o vídeo"). Os vídeos do Ninho são
 * as telas do app desenhadas em código e uma câmera que se aproxima enquanto
 * um dedo toca — o mesmo que roda dentro do app. Aqui eles são tocados por
 * public/videos/player.js, que não depende de nada e funciona em qualquer
 * celular, sem instalar o app.
 *
 * Se um dia existir um MP4 em public/videos/<slug>.mp4, ele ganha do player
 * desenhado: é só publicar o arquivo.
 */
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Script from 'next/script';
import { SITE_URL } from '@/lib/config';
import { VIDEOS, temArquivo, videoPorSlug } from '@/lib/videos-ajuda';
import './video.css';
import './player.css';

export const dynamicParams = false;

export function generateStaticParams() {
  return VIDEOS.map((v) => ({ slug: v.slug }));
}

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const params = await props.params;
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

export default async function VideoPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
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
          <>
            {/* O player desenha dentro desta div; sem JavaScript, a pessoa
                ainda tem os passos escritos logo abaixo. */}
            <div className="nv" data-video={v.slug} />
            <Script src="/videos/player.js" strategy="afterInteractive" />
          </>
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
