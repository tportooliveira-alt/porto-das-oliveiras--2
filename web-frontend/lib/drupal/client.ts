import { cookies } from 'next/headers';
import { decode } from 'next-auth/jwt';

/**
 * Cliente HTTP server-side para a API JSON:API do Drupal.
 *
 * - Anônimo: chamadas sem token (lotes públicos).
 * - Autenticado: descriptografa o cookie de sessão do NextAuth, extrai o
 *   `drupalJwt` que foi atrelado no callback `jwt()` e envia como Bearer.
 *
 * NÃO importar este módulo a partir de Client Components — o segredo
 * `AUTH_SECRET` é usado para descriptografar o cookie e precisa ficar
 * exclusivamente no servidor.
 */

const BASE = process.env.DRUPAL_BASE_URL ?? 'https://porto-das-oliveiras.ddev.site';

const COOKIE_NAME = process.env.NODE_ENV === 'production'
  ? '__Secure-authjs.session-token'
  : 'authjs.session-token';

type Opcoes = RequestInit & {
  autenticado?: boolean;
  revalidate?: number | false;
};

async function obterDrupalJwt(): Promise<string | null> {
  const secret = process.env.AUTH_SECRET;
  if (!secret) return null;

  const sessionToken = cookies().get(COOKIE_NAME)?.value;
  if (!sessionToken) return null;

  try {
    const payload = await decode({ token: sessionToken, secret, salt: COOKIE_NAME });
    const jwt = payload?.drupalJwt;
    return typeof jwt === 'string' ? jwt : null;
  } catch {
    return null;
  }
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
    next:
      revalidate === false
        ? { revalidate: false }
        : revalidate !== undefined
          ? { revalidate }
          : undefined,
  });

  if (!resposta.ok) {
    throw new Error(`Drupal ${resposta.status}: ${await resposta.text()}`);
  }

  return resposta.json() as Promise<T>;
}
