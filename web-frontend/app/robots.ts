import type { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

/**
 * robots.txt dinâmico — Next.js 14.
 *
 * Bloqueia área autenticada do cliente, área administrativa do Drupal
 * e rotas técnicas. Sitemap apontado para a versão dinâmica.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/painel',
          '/parcelas',
          '/contratos',
          '/documentos',
          '/api/',
          '/login',
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
