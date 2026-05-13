export type StatusLote = 'disponivel' | 'reservado' | 'vendido';

const ESTILOS: Record<StatusLote, string> = {
  disponivel: 'bg-oliva text-branco',
  reservado:  'bg-terracota text-branco',
  vendido:    'bg-sepia text-branco',
};

const ROTULOS: Record<StatusLote, string> = {
  disponivel: 'Disponível',
  reservado:  'Reservado',
  vendido:    'Vendido',
};

export default function StatusBadge({ status }: { status: StatusLote }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em] ${ESTILOS[status]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" aria-hidden />
      {ROTULOS[status]}
    </span>
  );
}
