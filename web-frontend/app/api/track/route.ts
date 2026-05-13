import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

const BASE = process.env.DRUPAL_BASE_URL ?? 'http://porto-das-oliveiras.ddev.site';

const TIPOS_VALIDOS = new Set([
  'lote_visualizado',
  'lote_listado',
  'whatsapp_clicado',
  'busca_executada',
  'login_iniciado',
  'login_concluido',
  'parcela_baixada',
  'contrato_visualizado',
]);

/**
 * Proxy server-side para /api/track do Drupal.
 *
 * O middleware do Next.js já aplicou rate limit (60/min por IP).
 * Aqui validamos o tipo do evento e encaminhamos via fetch keepalive.
 *
 * Resposta é 202 Accepted mesmo se o Drupal falhar — analytics é
 * "best-effort", não pode bloquear a navegação do usuário.
 */
export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ erro: 'JSON inválido' }, { status: 400 });
    }
    if (!TIPOS_VALIDOS.has((body as { tipo?: string }).tipo ?? '')) {
      return NextResponse.json({ erro: 'tipo desconhecido' }, { status: 400 });
    }

    // Fire-and-forget para o Drupal — não bloqueia resposta ao cliente
    const forwardHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': request.headers.get('user-agent') ?? '',
    };
    const fwd = request.headers.get('x-forwarded-for');
    if (fwd) forwardHeaders['X-Forwarded-For'] = fwd;
    const ref = request.headers.get('referer');
    if (ref) forwardHeaders['Referer'] = ref;

    fetch(`${BASE}/api/track`, {
      method: 'POST',
      headers: forwardHeaders,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(2000),
      keepalive: true,
    }).catch((e) => {
      logger.warn('track_drupal_falhou', { err_message: e?.message });
    });

    return NextResponse.json({ aceito: true }, { status: 202 });
  }
  catch (e) {
    logger.error('track_route_erro', e);
    return NextResponse.json({ erro: 'interno' }, { status: 500 });
  }
}
