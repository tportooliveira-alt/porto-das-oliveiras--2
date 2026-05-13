import type { MetadataRoute } from 'next';
import { listarLotes } from '@/lib/drupal/lotes';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

/**
 * Sitemap dinâmico do Next.js 14.
 *
 * - Rotas públicas estáticas (priority alto)
 * - Cada lote como rota indexável (priority por status — disponíveis primeiro)
 *
 * Lotes vendidos continuam no sitemap por 90 dias para preservar histórico
 * de SEO; depois disso podemos removê-los do índice via 410 Gone.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const agora = new Date();

  const estaticas: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`,           lastModified: agora, changeFrequency: 'daily',  priority: 1.0 },
    { url: `${BASE_URL}/lotes`,      lastModified: agora, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${BASE_URL}/assistente`, lastModified: agora, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${BASE_URL}/login`,      lastModified: agora, changeFrequency: 'monthly', priority: 0.3 },
  ];

  let lotes: MetadataRoute.Sitemap = [];
  try {
    const lista = await listarLotes({ limit: 200 });
    lotes = lista.map((lote) => ({
      url: `${BASE_URL}/lotes/${lote.slug}`,
      lastModified: agora,
      changeFrequency: 'weekly' as const,
      priority: lote.status === 'disponivel' ? 0.8 : 0.5,
    }));
  }
  catch {
    // Drupal offline durante build — sitemap continua só com estáticas
  }

  return [...estaticas, ...lotes];
}
