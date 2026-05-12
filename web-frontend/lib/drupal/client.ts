import { auth } from '@/auth';

/**
 * Cliente HTTP server-side para a API JSON:API do Drupal.
 *
 * - Anônimo: chamadas sem token (lotes públicos).
 * - Autenticado: lê o JWT da sessão NextAuth e envia Bearer. O módulo
 *   custom porto_auth no Drupal valida o JWT, auto-provisiona o usuário
 *   se necessário e injeta a sessão na requisição.
 *
 * NUNCA chame este módulo a partir de Client Components — o JWT precisa
 * ficar no servidor.
 */

const BASE = process.env.DRUPAL_BASE_URL ?? 'https://porto-das-oliveiras.ddev.site';

type Opcoes = RequestInit & {
  autenticado?: boolean;
  revalidate?: number | false;
};

async function obterDrupalJwt(): Promise<string | null> {
  // `auth()` retorna a sessão. O JWT do Drupal vive no token interno
  // do NextAuth, exposto via `getToken` em ambientes server.
  const sessao = await auth();
  if (!sessao?.user) return null;

  // O JWT propriamente dito está no objeto token (não no objeto session
  // exposto ao cliente). Acessamos via cookie raw.
  const { cookies } = await import('next/headers');
  const { getToken } = await import('next-auth/jwt');
  const token = await getToken({
    req: { headers: { cookie: cookies().toString() } } as never,
    secret: process.env.AUTH_SECRET,
    secureCookie: process.env.NODE_ENV === 'production',
  });

  return (token?.drupalJwt as string | undefined) ?? null;
}

export async function drupalFetch<T>(caminho: string, opcoes: Opcoes = {}): Promise<T> {
  const { autenticado, revalidate, headers, ...resto } = opcoes;

  const cabecalhos: Record<string, string> = {
    Accept: 'application/vnd.api+json',
    'Content-Type': 'application/vnd.api+json',
    ...(headers as Record<string, string> | undefined),
  };

  if (autenticado) {
    const jwt = await obterDrupalJwt();
    if (jwt) cabecalhos.Authorization = `Bearer ${jwt}`;
  }

  const resposta = await fetch(`${BASE}${caminho}`, {
    ...resto,
    headers: cabecalhos,
    next: revalidate === false ? { revalidate: false } : revalidate !== undefined ? { revalidate } : undefined,
  });

  if (!resposta.ok) {
    throw new Error(`Drupal ${resposta.status}: ${await resposta.text()}`);
  }

  return resposta.json() as Promise<T>;
}
