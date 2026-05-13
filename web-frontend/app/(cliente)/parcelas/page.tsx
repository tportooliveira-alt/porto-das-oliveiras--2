import { listarMinhasParcelas, statusDaParcela, type StatusParcela } from '@/lib/drupal/parcelas';
import type { Parcela } from '@/lib/drupal/types';
import ParcelaRow from '@/components/parcelas/ParcelaRow';
import EmptyState from '@/components/shared/EmptyState';

export const dynamic = 'force-dynamic';

type SearchParams = { filtro?: string };

const FILTROS_VALIDOS: ReadonlyArray<StatusParcela | 'todas'> = ['todas', 'paga', 'aberta', 'vencida'];

const FILTRO_LABEL: Record<StatusParcela | 'todas', string> = {
  todas:   'Todas',
  aberta:  'Em aberto',
  vencida: 'Vencidas',
  paga:    'Pagas',
};

export default async function ParcelasPage({ searchParams }: { searchParams: SearchParams }) {
  const filtroAtivo = (FILTROS_VALIDOS.includes(searchParams.filtro as StatusParcela) ? searchParams.filtro : 'todas') as StatusParcela | 'todas';
  const todas = await listarMinhasParcelas();

  // Conta por status
  const contagem = todas.reduce(
    (acc, p) => {
      acc[statusDaParcela(p)]++;
      return acc;
    },
    { paga: 0, aberta: 0, vencida: 0 } as Record<StatusParcela, number>
  );

  // Aplica filtro
  const parcelas = filtroAtivo === 'todas'
    ? todas
    : todas.filter((p) => statusDaParcela(p) === filtroAtivo);

  // Ordena: vencidas primeiro, depois abertas, depois pagas; dentro do grupo por vencimento
  const ordenadas = [...parcelas].sort((a: Parcela, b: Parcela) => {
    const ordem: Record<StatusParcela, number> = { vencida: 0, aberta: 1, paga: 2 };
    const sa = ordem[statusDaParcela(a)];
    const sb = ordem[statusDaParcela(b)];
    if (sa !== sb) return sa - sb;
    return new Date(a.vencimento).getTime() - new Date(b.vencimento).getTime();
  });

  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="kicker mb-3 text-oliva">☉ Financeiro</p>
        <h1 className="font-serif text-display-md tracking-tighter2 text-sepia">
          Minhas parcelas
        </h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-sepia-soft">
          Acompanhe vencimentos e baixe os boletos das parcelas em aberto.
        </p>
      </header>

      {/* Filtros pill */}
      <nav aria-label="Filtrar parcelas" className="flex flex-wrap gap-2">
        {FILTROS_VALIDOS.map((f) => {
          const ativo = f === filtroAtivo;
          const total = f === 'todas' ? todas.length : contagem[f as StatusParcela];
          return (
            <a
              key={f}
              href={f === 'todas' ? '/parcelas' : `/parcelas?filtro=${f}`}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[13px] font-medium transition-all duration-200 ease-out-soft ${
                ativo
                  ? 'border-sepia bg-sepia text-branco'
                  : 'border-linha bg-branco text-sepia hover:border-sepia/40'
              }`}
            >
              {FILTRO_LABEL[f as StatusParcela | 'todas']}
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-mono ${ativo ? 'bg-branco/15' : 'bg-areia text-sepia-soft'}`}>
                {total}
              </span>
            </a>
          );
        })}
      </nav>

      {ordenadas.length === 0 ? (
        <EmptyState
          titulo={
            filtroAtivo === 'todas'
              ? 'Nenhuma parcela registrada.'
              : `Nenhuma parcela ${FILTRO_LABEL[filtroAtivo].toLowerCase()}.`
          }
          descricao={
            filtroAtivo === 'todas'
              ? 'Após o início do contrato, suas parcelas aparecem aqui.'
              : 'Tente outro filtro para ver mais parcelas.'
          }
          acaoLabel={filtroAtivo !== 'todas' ? 'Ver todas' : undefined}
          acaoHref={filtroAtivo !== 'todas' ? '/parcelas' : undefined}
        />
      ) : (
        <>
          {/* Desktop: table */}
          <div className="hidden overflow-hidden rounded-card border border-linha bg-branco sm:block">
            <table className="w-full">
              <thead className="bg-areia-clara/60">
                <tr className="border-b border-linha">
                  <th className="px-4 py-3 text-left text-[11px] uppercase tracking-[0.14em] text-sepia-soft">Nº</th>
                  <th className="px-4 py-3 text-left text-[11px] uppercase tracking-[0.14em] text-sepia-soft">Vencimento</th>
                  <th className="px-4 py-3 text-right text-[11px] uppercase tracking-[0.14em] text-sepia-soft">Valor</th>
                  <th className="px-4 py-3 text-left text-[11px] uppercase tracking-[0.14em] text-sepia-soft">Status</th>
                  <th className="px-4 py-3 text-right text-[11px] uppercase tracking-[0.14em] text-sepia-soft">Ação</th>
                </tr>
              </thead>
              <tbody>
                {ordenadas.map((p) => (
                  <ParcelaRow key={p.id} parcela={p} />
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile: cards */}
          <ul role="list" className="flex flex-col gap-3 sm:hidden">
            {ordenadas.map((p) => (
              <ParcelaRow key={p.id} parcela={p} />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
