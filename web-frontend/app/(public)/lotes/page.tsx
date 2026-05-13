import { listarLotes, listarQuadras, type FiltrosLote, type OrdenacaoLote } from '@/lib/drupal/lotes';
import type { StatusLote } from '@/components/lotes/StatusBadge';
import LoteCard from '@/components/lotes/LoteCard';
import LoteFilters from '@/components/lotes/LoteFilters';
import EmptyState from '@/components/shared/EmptyState';

export const revalidate = 60;

type SearchParams = {
  status?: string;
  quadra?: string;
  precoMin?: string;
  precoMax?: string;
  metMin?: string;
  metMax?: string;
  sort?: string;
};

const STATUS_VALIDOS: ReadonlyArray<StatusLote> = ['disponivel', 'reservado', 'vendido'];
const SORT_VALIDOS: ReadonlyArray<OrdenacaoLote> = [
  'recente', 'preco-asc', 'preco-desc', 'metragem-asc', 'metragem-desc',
];

function parseFiltros(sp: SearchParams): FiltrosLote {
  const status = STATUS_VALIDOS.includes(sp.status as StatusLote)
    ? (sp.status as StatusLote)
    : undefined;
  const sort = SORT_VALIDOS.includes(sp.sort as OrdenacaoLote)
    ? (sp.sort as OrdenacaoLote)
    : undefined;
  const num = (v?: string) => {
    if (v === undefined || v === '') return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  };
  return {
    limit: 60,
    status,
    quadra: sp.quadra || undefined,
    precoMin:    num(sp.precoMin),
    precoMax:    num(sp.precoMax),
    metragemMin: num(sp.metMin),
    metragemMax: num(sp.metMax),
    sort,
  };
}

export default async function LotesPage({ searchParams }: { searchParams: SearchParams }) {
  const filtros = parseFiltros(searchParams);
  const [lotes, quadras] = await Promise.all([
    listarLotes(filtros),
    listarQuadras(),
  ]);

  return (
    <section className="mx-auto max-w-7xl px-6 py-16 lg:py-24" aria-labelledby="lotes-titulo">
      <header className="mb-12 flex items-end justify-between">
        <div>
          <p className="kicker mb-3 text-oliva">☉ Catálogo</p>
          <h1
            id="lotes-titulo"
            className="font-serif text-display-md tracking-tighter2 text-sepia"
          >
            Todos os lotes
          </h1>
        </div>
        <p className="hidden max-w-sm text-[15px] leading-relaxed text-sepia-soft lg:block">
          Filtre por status, faixa de preço, metragem ou quadra. Cada lote é regularizado em cartório com escritura registrada.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[280px_1fr]">
        <LoteFilters quadras={quadras} total={lotes.length} />

        <div>
          {lotes.length === 0 ? (
            <EmptyState
              titulo="Nenhum lote bate com esses filtros."
              descricao="Tente ajustar a faixa de preço, mudar a quadra ou remover o filtro de status para ver mais opções."
              acaoLabel="Limpar filtros"
              acaoHref="/lotes"
            />
          ) : (
            <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {lotes.map((lote) => (
                <li key={lote.id}>
                  <LoteCard lote={lote} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
