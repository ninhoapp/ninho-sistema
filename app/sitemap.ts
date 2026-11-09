import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/config';
import { GUIAS } from '@/lib/guias';

export default function sitemap(): MetadataRoute.Sitemap {
  const hoje = new Date();
  return [
    { url: `${SITE_URL}/landing`, lastModified: hoje, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/guia`, lastModified: hoje, changeFrequency: 'weekly', priority: 0.8 },
    ...GUIAS.map((g) => ({
      url: `${SITE_URL}/guia/${g.slug}`,
      lastModified: new Date(g.atualizado),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
    { url: `${SITE_URL}/sejaparceiro`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/suporte`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${SITE_URL}/privacidade`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${SITE_URL}/termos`, changeFrequency: 'yearly', priority: 0.2 },
  ];
}
