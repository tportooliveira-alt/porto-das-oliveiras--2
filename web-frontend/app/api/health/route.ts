import { NextResponse } from 'next/server';

/**
 * Health check para monitoramento externo.
 *
 * Retorna 200 + status do Next.js + ping no Drupal.
 * Se o Drupal estiver fora, ainda retorna 200 mas marca drupal: 'down'
 * — assim o site continua sendo considerado "vivo" e monitoring distingue
 * uma queda do app de uma queda do backend.
 */
export const dynamic = 'force-dynamic';

export async function GET() {
  const inicio = Date.now();
  const drupalUrl = process.env.DRUPAL_BASE_URL ?? 'http://porto-das-oliveiras.ddev.site';

  let drupalStatus: 'up' | 'down' = 'down';
  let drupalLatency: number | null = null;

  try {
    const t0 = Date.now();
    const r = await fetch(`${drupalUrl}/jsonapi`, {
      signal: AbortSignal.timeout(3000),
      cache: 'no-store',
    });
    drupalLatency = Date.now() - t0;
    drupalStatus = r.ok ? 'up' : 'down';
  }
  catch {
    drupalStatus = 'down';
  }

  return NextResponse.json(
    {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime_ms: process.uptime() * 1000,
      response_ms: Date.now() - inicio,
      drupal: {
        status: drupalStatus,
        latency_ms: drupalLatency,
      },
    },
    {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    }
  );
}
