'use client';

import { useEffect } from 'react';

export default function ClienteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[cliente:error]', error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="kicker mb-3 text-terracota">☉ Erro</p>
      <h1 className="font-serif text-display-sm tracking-tighter2 text-sepia">
        Não consegui carregar seus dados.
      </h1>
      <p className="mt-4 max-w-md text-[15px] leading-relaxed text-sepia-soft">
        Pode ser uma instabilidade entre o site e o backend. Tente recarregar — se persistir, faça login de novo.
      </p>
      {error.digest && (
        <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.14em] text-sepia-soft">
          ref: {error.digest}
        </p>
      )}
      <div className="mt-7 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-terracota px-6 py-3 text-[13px] font-medium uppercase tracking-[0.08em] text-branco transition-all hover:bg-terracota-escuro"
        >
          Recarregar
        </button>
        <a
          href="/login"
          className="inline-flex items-center justify-center gap-2 rounded-full border border-sepia/30 px-6 py-3 text-[13px] font-medium uppercase tracking-[0.08em] text-sepia transition-colors hover:bg-sepia hover:text-branco"
        >
          Fazer login
        </a>
      </div>
    </div>
  );
}
