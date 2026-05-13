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

const DEFAULT_TIMEOUT_MS = 8000;
const MAX_RETRIES = 1; // 1 retry curto pra 5xx; 4xx nunca repete.

type Opcoes = RequestInit & {
  autenticado?: boolean;
  revalidate?: number | false;
  timeoutMs?: number;
};

/**
 * Erro estruturado do Drupal — permite que páginas distingam 401/403/404/5xx
 * e tratem cada um adequadamente (ex.: 404 → notFound(), 401 → redirect login).
 */
export class DrupalError extends Error {
  readonly status: number;
  readonly path: string;
  readonly body: string;

  constructor(path: string, status: number, body: string) {
    super(`Drupal ${status} em ${path}`);
    this.name = 'DrupalError';
    this.status = status;
    this.path = path;
    this.body = body;
  }

  get isAuthError() { return this.status === 401 || this.status === 403; }
  get isNotFound() { return this.status === 404; }
  get isServerError() { return this.status >= 500; }
}

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

async function tentativa<T>(
  caminho: string,
  opcoes: Opcoes,
  cabecalhos: Record<string, string>,
): Promise<T> {
  const { revalidate, timeoutMs = DEFAULT_TIMEOUT_MS, ...resto } = opcoes;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);

  try {
    const resposta = await fetch(`${BASE}${caminho}`, {
      ...resto,
      headers: cabecalhos,
      signal: ctrl.signal,
      next:
        revalidate === false
          ? { revalidate: false }
          : revalidate !== undefined
            ? { revalidate }
            : undefined,
    });

    if (!resposta.ok) {
      const body = await resposta.text();
      throw new DrupalError(caminho, resposta.status, body);
    }

    return resposta.json() as Promise<T>;
  }
  finally {
    clearTimeout(timer);
  }
}

export async function drupalFetch<T>(caminho: string, opcoes: Opcoes = {}): Promise<T> {
  const { autenticado, headers, ...resto } = opcoes;

  const cabecalhos: Record<string, string> = {
    Accept: 'application/vnd.api+json',
    'Content-Type': 'application/vnd.api+json',
    ...(headers as Record<string, string> | undefined),
  };

  if (autenticado) {
    const jwt = await obterDrupalJwt();
    if (jwt) cabecalhos.Authorization = `Bearer ${jwt}`;
  }

  // Retry curto pra erros 5xx e timeouts. 4xx nunca repete (vai falhar igual).
  let ultimoErro: unknown;
  for (let i = 0; i <= MAX_RETRIES; i++) {
    try {
      return await tentativa<T>(caminho, resto, cabecalhos);
    }
    catch (e) {
      ultimoErro = e;
      if (e instanceof DrupalError && e.status < 500) {
        // Erro definitivo do cliente — não adianta repetir.
        throw e;
      }
      if (i < MAX_RETRIES) {
        // Backoff curto: 250ms. Não queremos atrasar muito o SSR.
        await new Promise((r) => setTimeout(r, 250));
        continue;
      }
    }
  }
  throw ultimoErro;
}
