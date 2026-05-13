import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import { LIMITES, aplicarLimite, identificarCliente, headersDeLimite } from '@/lib/rateLimit';

const ROTAS_PROTEGIDAS = ['/painel', '/parcelas', '/contratos', '/documentos'];

/** UUID v4 leve para correlation id — sem dependência externa. */
function gerarRequestId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `req_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

export default auth((req) => {
  const path = req.nextUrl.pathname;
  const requestId = req.headers.get('x-request-id') ?? gerarRequestId();

  // 1) Rate limit nas APIs públicas
  if (path.startsWith('/api/')) {
    const limite =
      path.startsWith('/api/gemini') ? LIMITES.gemini
      : path.startsWith('/api/auth') ? LIMITES.auth
      : LIMITES.apiGeral;

    const cliente = identificarCliente(req.headers);
    const resultado = aplicarLimite(cliente, limite);

    if (!resultado.ok) {
      return new NextResponse('Too Many Requests', {
        status: 429,
        headers: {
          ...headersDeLimite(resultado, limite),
          'x-request-id': requestId,
          'Content-Type': 'text/plain; charset=utf-8',
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

  // 2) Auth guard nas rotas autenticadas
  const ehAreaCliente = ROTAS_PROTEGIDAS.some((r) => path === r || path.startsWith(`${r}/`));
  if (ehAreaCliente && !req.auth) {
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
    // Aplica em tudo, exceto assets estáticos e os handlers do NextAuth
    // (esses precisam fluxo OAuth livre de rate-limit no middleware).
    '/((?!_next/static|_next/image|favicon.ico|video/|api/auth/callback).*)',
  ],
};
