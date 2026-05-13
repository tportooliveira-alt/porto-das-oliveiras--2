/**
 * Skeleton compartilhado da área pública — aparece durante navegação SSR.
 * Mantém a paleta editorial e o ritmo visual da home para não dar "flash".
 */
export default function Loading() {
  return (
    <div className="paper" aria-busy="true" aria-label="Carregando">
      <div className="mx-auto max-w-7xl px-6 pb-24 pt-16">
        {/* Hero skeleton */}
        <div className="mb-10 flex items-center justify-center gap-4">
          <span className="h-px w-8 bg-linha" aria-hidden />
          <div className="h-3 w-64 animate-pulse rounded-full bg-areia" />
          <span className="h-px w-8 bg-linha" aria-hidden />
        </div>
        <div className="mx-auto aspect-video w-full max-w-[1280px] animate-pulse rounded-card bg-areia" />

        {/* Headline skeleton */}
        <div className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-6">
            <div className="h-4 w-48 animate-pulse rounded-full bg-areia" />
            <div className="h-16 w-full animate-pulse rounded bg-areia" />
            <div className="h-16 w-3/4 animate-pulse rounded bg-areia" />
          </div>
          <div className="space-y-3 lg:col-span-5 lg:col-start-8">
            <div className="h-3 w-full animate-pulse rounded-full bg-areia" />
            <div className="h-3 w-full animate-pulse rounded-full bg-areia" />
            <div className="h-3 w-2/3 animate-pulse rounded-full bg-areia" />
            <div className="mt-4 flex gap-3">
              <div className="h-12 w-40 animate-pulse rounded-full bg-areia" />
              <div className="h-12 w-32 animate-pulse rounded-full bg-areia" />
            </div>
          </div>
        </div>
      </div>

      {/* Cards skeleton */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-10 space-y-3">
          <div className="h-3 w-32 animate-pulse rounded-full bg-areia" />
          <div className="h-12 w-72 animate-pulse rounded bg-areia" />
        </div>
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <li
              key={i}
              className="h-80 animate-pulse rounded-card border border-linha bg-areia-clara/60"
            />
          ))}
        </ul>
      </section>
    </div>
  );
}
