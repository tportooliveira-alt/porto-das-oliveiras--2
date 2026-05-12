import Link from 'next/link';
import StatusBadge from '@/components/lotes/StatusBadge';
import WhatsappButton from '@/components/shared/WhatsappButton';
import { formatarBRL } from '@/lib/utils';
import type { Lote } from '@/lib/drupal/types';

export default function LoteCard({ lote }: { lote: Lote }) {
  return (
    <article className="border-thick border-border bg-canvas p-5 flex flex-col gap-3">
      <header className="flex items-center justify-between">
        <h2 className="text-field uppercase">{lote.titulo}</h2>
        <StatusBadge status={lote.status} />
      </header>

      <dl className="grid grid-cols-2 gap-2 text-field-sm">
        <dt className="uppercase">Quadra</dt>
        <dd>{lote.quadra}</dd>
        <dt className="uppercase">Lote</dt>
        <dd>{lote.numero}</dd>
        <dt className="uppercase">Metragem</dt>
        <dd>{lote.metragem} m²</dd>
        <dt className="uppercase">Valor</dt>
        <dd>{formatarBRL(lote.valor)}</dd>
      </dl>

      <div className="flex flex-col gap-2 mt-2">
        <Link
          href={`/lotes/${lote.slug}`}
          className="text-center border-thick border-border px-4 py-3 text-field-sm uppercase"
        >
          Ver detalhes
        </Link>
        {lote.status === 'disponivel' && (
          <WhatsappButton
            numero="999999999"
            mensagem={`Olá! Tenho interesse no lote ${lote.titulo} do Porto das Oliveiras.`}
            rotulo="Tenho interesse"
          />
        )}
      </div>
    </article>
  );
}
