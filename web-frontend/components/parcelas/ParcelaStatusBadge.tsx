import type { StatusParcela } from '@/lib/drupal/parcelas';

const ESTILOS: Record<StatusParcela, string> = {
  paga:    'bg-oliva text-branco',
  aberta:  'bg-areia text-sepia border border-linha',
  vencida: 'bg-terracota text-branco',
};

const ROTULOS: Record<StatusParcela, string> = {
  paga:    'Paga',
  aberta:  'Em aberto',
  vencida: 'Vencida',
};

export default function ParcelaStatusBadge({ status }: { status: StatusParcela }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em] ${ESTILOS[status]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" aria-hidden />
      {ROTULOS[status]}
    </span>
  );
}
