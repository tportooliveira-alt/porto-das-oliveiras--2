/**
 * Skeleton da área autenticada — aparece durante navegação para
 * /painel, /parcelas, /contratos, /documentos.
 */
export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Carregando" className="flex flex-col gap-10">
      <div className="space-y-3">
        <div className="h-3 w-32 animate-pulse rounded-full bg-areia" />
        <div className="h-12 w-72 animate-pulse rounded bg-areia" />
        <div className="h-4 w-1/2 animate-pulse rounded-full bg-areia" />
      </div>

      {/* Resumo financeiro */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_3fr]">
        <div className="h-72 animate-pulse rounded-card bg-areia" />
        <div className="h-72 animate-pulse rounded-card bg-areia/70" />
      </div>

      {/* Lista de cards */}
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <li
            key={i}
            className="h-60 animate-pulse rounded-card border border-linha bg-areia-clara/60"
          />
        ))}
      </ul>
    </div>
  );
}
