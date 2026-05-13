'use client';

import { useEffect, useRef } from 'react';
import { track, type TipoEvento } from '@/lib/analytics';

type Props = {
  tipo: TipoEvento;
  loteId?: string;
  meta?: Record<string, unknown>;
};

/**
 * Dispara um evento de visualização ao montar. Componente "fire-once":
 * usa um ref pra garantir que mesmo em StrictMode com remontagem
 * só envia um evento por mount real.
 *
 * @example
 *   <TrackView tipo="lote_visualizado" loteId={lote.id} />
 */
export default function TrackView({ tipo, loteId, meta }: Props) {
  const enviado = useRef(false);

  useEffect(() => {
    if (enviado.current) return;
    enviado.current = true;
    track({ tipo, lote_id: loteId, meta });
  }, [tipo, loteId, meta]);

  return null;
}
