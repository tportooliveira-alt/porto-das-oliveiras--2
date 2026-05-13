/**
 * Rate limit em memória (fixed window).
 *
 * Funciona em dev e em produção single-instance (Vercel Edge é stateless
 * por requisição, então cada região tem seu próprio Map). Para
 * multi-instância real, migrar para Upstash Redis ou Vercel KV.
 *
 * Janela fixa: contador zera a cada `windowMs`. Não tem deslizamento
 * sofisticado — para o uso atual (anti-abuse leve, não cripto-financeiro)
 * é suficiente.
 */

type Bucket = {
  count: number;
  resetAt: number;
};

const stores = new Map<string, Map<string, Bucket>>();

export type LimiteRota = {
  /** Nome da rota (chave do store). Limites de rotas diferentes não competem. */
  rota: string;
  /** Janela em ms. */
  windowMs: number;
  /** Máximo de requisições por chave dentro da janela. */
  max: number;
};

export type ResultadoLimite = {
  ok: boolean;
  remaining: number;
  resetAt: number;
};

export function aplicarLimite(chave: string, config: LimiteRota): ResultadoLimite {
  const agora = Date.now();
  let store = stores.get(config.rota);
  if (!store) {
    store = new Map();
    stores.set(config.rota, store);
  }

  // GC leve: remove buckets já expirados (evita Map crescendo infinito).
  if (store.size > 1000) {
    for (const [k, b] of store) {
      if (b.resetAt < agora) store.delete(k);
    }
  }

  let bucket = store.get(chave);
  if (!bucket || bucket.resetAt < agora) {
    bucket = { count: 0, resetAt: agora + config.windowMs };
    store.set(chave, bucket);
  }

  bucket.count += 1;
  const remaining = Math.max(0, config.max - bucket.count);

  return {
    ok: bucket.count <= config.max,
    remaining,
    resetAt: bucket.resetAt,
  };
}

/**
 * Extrai um identificador de cliente. Em prod atrás de proxy/CDN, usa
 * `x-forwarded-for`; senão, cai no socket remoto via Next request.
 *
 * Nota: trusted proxies podem mudar. Em produção, configurar a CDN para
 * enviar apenas o cabeçalho que confiamos.
 */
export function identificarCliente(headers: Headers): string {
  const fwd = headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  const realIp = headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  return 'anon';
}

export const LIMITES = {
  /** Rotas /api/* genéricas — proteção leve contra abuse. */
  apiGeral: {
    rota:     'api-geral',
    windowMs: 60_000,
    max:      60,
  } satisfies LimiteRota,

  /** /api/gemini/* — Gemini cobra por chamada, limite agressivo. */
  gemini: {
    rota:     'gemini',
    windowMs: 60_000,
    max:      10,
  } satisfies LimiteRota,

  /** /api/auth/* — anti brute-force no fluxo OAuth. */
  auth: {
    rota:     'auth',
    windowMs: 60_000,
    max:      20,
  } satisfies LimiteRota,
} as const;

/** Headers padrão de rate limit pra incluir em respostas. */
export function headersDeLimite(resultado: ResultadoLimite, limite: LimiteRota): Record<string, string> {
  return {
    'X-RateLimit-Limit':     String(limite.max),
    'X-RateLimit-Remaining': String(resultado.remaining),
    'X-RateLimit-Reset':     String(Math.ceil(resultado.resetAt / 1000)),
    ...(resultado.ok ? {} : { 'Retry-After': String(Math.ceil((resultado.resetAt - Date.now()) / 1000)) }),
  };
}
