import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const ehAreaCliente = req.nextUrl.pathname.startsWith('/painel')
    || req.nextUrl.pathname.startsWith('/parcelas')
    || req.nextUrl.pathname.startsWith('/contratos')
    || req.nextUrl.pathname.startsWith('/documentos');

  if (ehAreaCliente && !req.auth) {
    const url = new URL('/login', req.url);
    url.searchParams.set('callbackUrl', req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Aplica em tudo, exceto assets estáticos e a própria API de auth.
    '/((?!_next/static|_next/image|favicon.ico|api/auth).*)',
  ],
};
