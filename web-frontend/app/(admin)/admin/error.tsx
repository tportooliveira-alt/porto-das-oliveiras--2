'use client';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-6 py-24 text-center">
      <p className="kicker text-terracota">Erro no painel</p>
      <h1 className="font-serif text-display-sm tracking-tighter2 text-sepia">
        Algo deu errado.
      </h1>
      <p className="max-w-sm text-[14px] text-sepia-soft">{error.message}</p>
      <button
        onClick={reset}
        className="rounded-full bg-sepia px-6 py-3 text-[12px] font-medium uppercase tracking-[0.1em] text-branco transition-opacity hover:opacity-80"
      >
        Tentar novamente
      </button>
    </div>
  );
}
