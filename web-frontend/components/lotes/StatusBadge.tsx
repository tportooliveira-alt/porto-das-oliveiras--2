export type StatusLote = 'disponivel' | 'reservado' | 'vendido';

const ESTILOS: Record<StatusLote, string> = {
  disponivel: 'bg-disponivel text-canvas',
  reservado:  'bg-reservado text-canvas',
  vendido:    'bg-vendido text-canvas',
};

const ROTULOS: Record<StatusLote, string> = {
  disponivel: 'Disponível',
  reservado:  'Reservado',
  vendido:    'Vendido',
};

export default function StatusBadge({ status }: { status: StatusLote }) {
  return (
    <span className={`inline-block px-3 py-1 border-thick border-border uppercase text-field-sm ${ESTILOS[status]}`}>
      {ROTULOS[status]}
    </span>
  );
}
