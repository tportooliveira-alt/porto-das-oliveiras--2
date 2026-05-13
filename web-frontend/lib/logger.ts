/**
 * Logger estruturado (JSON em prod, pretty em dev).
 *
 * Sem dependências externas — não precisamos de pino/winston ainda.
 * Quando integrar Sentry/DataDog, basta plugar o transport aqui.
 *
 * Uso:
 *
 *   import { logger } from '@/lib/logger';
 *
 *   logger.info('drupal_fetch', { path: '/jsonapi/...', status: 200, latency_ms: 123 });
 *   logger.warn('jwt_quase_expirando', { exp: 1234 });
 *   logger.error('drupal_5xx', err, { path: '/jsonapi/...' });
 *
 * Correlation ID: o middleware injeta x-request-id em todas as requests.
 * Em Server Components, recupere via `headers().get('x-request-id')`.
 */

type Level = 'debug' | 'info' | 'warn' | 'error';

type Campos = Record<string, unknown>;

const ehDev = process.env.NODE_ENV !== 'production';

const NIVEL_PRIORIDADE: Record<Level, number> = {
  debug: 10, info: 20, warn: 30, error: 40,
};

const NIVEL_MINIMO: Level = (process.env.LOG_LEVEL as Level) ?? (ehDev ? 'debug' : 'info');

function devePassar(nivel: Level): boolean {
  return NIVEL_PRIORIDADE[nivel] >= NIVEL_PRIORIDADE[NIVEL_MINIMO];
}

function serializarErro(err: unknown): Campos {
  if (err instanceof Error) {
    return {
      err_name: err.name,
      err_message: err.message,
      err_stack: ehDev ? err.stack : undefined,
      ...((err as { status?: number }).status !== undefined && { err_status: (err as { status: number }).status }),
    };
  }
  return { err: String(err) };
}

function emitir(nivel: Level, mensagem: string, campos: Campos = {}): void {
  if (!devePassar(nivel)) return;

  const registro = {
    timestamp: new Date().toISOString(),
    level: nivel,
    msg: mensagem,
    ...campos,
  };

  if (ehDev) {
    // Em dev, pretty-print compacto pra debug rápido no terminal do Next.
    const cor = nivel === 'error' ? '\x1b[31m' : nivel === 'warn' ? '\x1b[33m' : nivel === 'info' ? '\x1b[36m' : '\x1b[90m';
    const reset = '\x1b[0m';
    const extras = Object.entries(campos).map(([k, v]) => `${k}=${formatarValor(v)}`).join(' ');
    const out = `${cor}${nivel.toUpperCase().padEnd(5)}${reset} ${mensagem}${extras ? ' ' + extras : ''}`;
    if (nivel === 'error') console.error(out);
    else if (nivel === 'warn') console.warn(out);
    else console.log(out);
  } else {
    // Em prod, JSON estruturado por linha — pronto pra Datadog/CloudWatch/Vercel logs.
    console.log(JSON.stringify(registro));
  }
}

function formatarValor(v: unknown): string {
  if (v === null) return 'null';
  if (v === undefined) return 'undefined';
  if (typeof v === 'string') return v.length > 80 ? `"${v.slice(0, 77)}..."` : `"${v}"`;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  try { return JSON.stringify(v); } catch { return '[unserializable]'; }
}

export const logger = {
  debug(mensagem: string, campos?: Campos) { emitir('debug', mensagem, campos); },
  info(mensagem: string, campos?: Campos)  { emitir('info',  mensagem, campos); },
  warn(mensagem: string, campos?: Campos)  { emitir('warn',  mensagem, campos); },

  error(mensagem: string, errOrCampos?: unknown, campos?: Campos) {
    if (errOrCampos instanceof Error || (errOrCampos && typeof errOrCampos === 'object' && 'message' in errOrCampos)) {
      emitir('error', mensagem, { ...serializarErro(errOrCampos), ...(campos ?? {}) });
    } else {
      emitir('error', mensagem, (errOrCampos as Campos) ?? {});
    }
  },
};
