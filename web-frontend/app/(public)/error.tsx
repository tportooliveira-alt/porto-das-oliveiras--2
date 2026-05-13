'use client';

import { useEffect } from 'react';

/**
 * Error boundary da área pública. Renderiza quando uma rota dispara
 * Error não capturado durante o render do server component.
 *
 * Drupal offline, JSON inválido, fetch timeout caem aqui.
 */
export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Em produção, esse log alimenta o Sentry quando configurarmos.
    console.error('[public:error]', error);
  }, [error]);

  return (
    <div className="paper flex min-h-[70vh] flex-col">
      <main className="flex flex-1 items-center justify-center px-6 py-20">
        <div className="max-w-xl text-center">
          <p className="kicker mb-4 text-terracota">☉ Algo deu errado</p>
          <h1 className="font-serif text-display-md tracking-tighter2 text-sepia">
            Não consegui carregar essa página agora.
          </h1>
          <p className="mt-5 text-[16px] leading-relaxed text-sepia-soft">
            Pode ser uma instabilidade momentânea na conexão com o servidor.
            Tente novamente em alguns segundos — se persistir, fale com a equipe pelo WhatsApp.
          </p>
          {error.digest && (
            <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.14em] text-sepia-soft">
              ref: {error.digest}
            </p>
          )}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-terracota px-7 py-4 text-[14px] font-medium uppercase tracking-[0.06em] text-branco transition-all duration-300 ease-out-soft hover:-translate-y-0.5 hover:bg-terracota-escuro"
            >
              Tentar novamente
            </button>
            <a
              href="https://wa.me/5577999999999?text=Ol%C3%A1!%20O%20site%20deu%20erro%20pra%20mim."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-sepia/30 px-7 py-4 text-[14px] font-medium uppercase tracking-[0.06em] text-sepia transition-all duration-300 ease-out-soft hover:-translate-y-0.5 hover:bg-sepia hover:text-branco"
            >
              Falar com a equipe
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
