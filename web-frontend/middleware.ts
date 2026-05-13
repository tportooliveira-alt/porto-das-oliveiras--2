import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import { LIMITES, aplicarLimite, identificarCliente, headersDeLimite } from '@/lib/rateLimit';

const ROTAS_PROTEGIDAS = ['/painel', '/parcelas', '/contratos', '/documentos'];
const ROTAS_ADMIN      = ['/admin'];

function gerarRequestId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `req_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

export default auth((req) => {
  const path      = req.nextUrl.pathname;
  const requestId = req.headers.get('x-request-id') ?? gerarRequestId();

  // ── Rate limit em /api/* ──────────────────────────────────────────────
  if (path.startsWith('/api/')) {
    const limite =
      path.startsWith('/api/gemini') ? LIMITES.gemini
      : path.startsWith('/api/auth') ? LIMITES.auth
      : LIMITES.apiGeral;

    const cliente   = identificarCliente(req.headers);
    const resultado = aplicarLimite(cliente, limite);

    if (!resultado.ok) {
      return new NextResponse('Too Many Requests', {
        status: 429,
        headers: {
          ...headersDeLimite(resultado, limite),
          'x-request-id':  requestId,
          'Content-Type':  'text/plain; charset=utf-8',
        },
      });
    }

    const resposta = NextResponse.next({
      request: { headers: addRequestId(req.headers, requestId) },
    });
    for (const [k, v] of Object.entries(headersDeLimite(resultado, limite))) {
      resposta.headers.set(k, v);
    }
    resposta.headers.set('x-request-id', requestId);
    return resposta;
  }

  // ── Auth guard — área cliente ─────────────────────────────────────────
  const ehAreaCliente = ROTAS_PROTEGIDAS.some(
    (r) => path === r || path.startsWith(`${r}/`),
  );
  if (ehAreaCliente && !req.auth) {
    const url = new URL('/login', req.url);
    url.searchParams.set('callbackUrl', path);
    return NextResponse.redirect(url);
  }

  // ── Auth guard — área admin ───────────────────────────────────────────
  // Apenas verifica autenticação; a checagem de role fica no layout (Server
  // Component), onde conseguimos ler a sessão completa com drupalRoles.
  const ehAdmin = ROTAS_ADMIN.some((r) => path === r || path.startsWith(`${r}/`));
  if (ehAdmin && !req.auth) {
    const url = new URL('/login', req.url);
    url.searchParams.set('callbackUrl', path);
    return NextResponse.redirect(url);
  }

  const resposta = NextResponse.next({
    request: { headers: addRequestId(req.headers, requestId) },
  });
  resposta.headers.set('x-request-id', requestId);
  return resposta;
});

function addRequestId(headers: Headers, id: string): Headers {
  const next = new Headers(headers);
  next.set('x-request-id', id);
  return next;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|video/|api/auth/callback).*)',
  ],
};
