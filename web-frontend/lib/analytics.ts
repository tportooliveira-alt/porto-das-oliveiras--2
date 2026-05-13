/**
 * Cliente leve de analytics — server-side via /api/track.
 *
 * - Sem cookies de tracking.
 * - Usa `navigator.sendBeacon` quando disponível (sobrevive a unload).
 * - Falha silenciosa: analytics nunca pode quebrar UX.
 */

export type TipoEvento =
  | 'lote_visualizado'
  | 'lote_listado'
  | 'whatsapp_clicado'
  | 'busca_executada'
  | 'login_iniciado'
  | 'login_concluido'
  | 'parcela_baixada'
  | 'contrato_visualizado';

type Payload = {
  tipo: TipoEvento;
  lote_id?: string;
  meta?: Record<string, unknown>;
};

/**
 * Dispara um evento. Use em onClick handlers ou em useEffect.
 *
 * @example
 *   track({ tipo: 'whatsapp_clicado', lote_id: lote.id, meta: { onde: 'card' } });
 */
export function track(payload: Payload): void {
  if (typeof window === 'undefined') return; // SSR guard

  const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });

  // sendBeacon é o ideal — funciona durante unload sem bloquear.
  if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
    try {
      if (navigator.sendBeacon('/api/track', blob)) return;
    }
    catch {
      // cai pro fetch
    }
  }

  // Fallback fetch keepalive
  try {
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => { /* silencioso */ });
  }
  catch {
    /* silencioso */
  }
}
