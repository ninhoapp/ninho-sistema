import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/config';

/**
 * Buscadores e IAs (GPTBot, ClaudeBot, PerplexityBot, Google-Extended…)
 * podem ler o site público: é assim que o Ninho aparece em respostas.
 * O painel e as pontes de redirecionamento ficam de fora.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/abrir', '/get/', '/baixar', '/landing/em-breve'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
