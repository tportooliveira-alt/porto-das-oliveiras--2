import Link from 'next/link';
import StatusBadge from '@/components/lotes/StatusBadge';
import WhatsappButton from '@/components/shared/WhatsappButton';
import { formatarBRL } from '@/lib/utils';
import type { Lote } from '@/lib/drupal/types';

export default function LoteCard({ lote }: { lote: Lote }) {
  return (
    <article className="group relative flex h-full flex-col gap-5 rounded-card border border-linha bg-branco p-7 transition-all duration-500 ease-out-soft hover:-translate-y-1 hover:border-oliva/30 hover:shadow-card">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="kicker mb-1">Quadra {lote.quadra} · Lote {lote.numero}</p>
          <h3 className="font-serif text-[26px] font-medium leading-none text-sepia tracking-tightest">
            {lote.titulo}
          </h3>
        </div>
        <StatusBadge status={lote.status} />
      </header>

      <dl className="grid grid-cols-2 gap-y-3 border-t border-linha pt-5 text-[14px]">
        <dt className="kicker">Metragem</dt>
        <dd className="text-right font-medium text-sepia">{lote.metragem} m²</dd>
        <dt className="kicker">Valor</dt>
        <dd className="text-right font-medium text-sepia">{formatarBRL(lote.valor)}</dd>
      </dl>

      <div className="mt-auto flex flex-col gap-2">
        <Link
          href={`/lotes/${lote.slug}`}
          className="inline-flex items-center justify-center rounded-full border border-sepia/20 px-5 py-3 text-[13px] font-medium uppercase tracking-[0.08em] text-sepia transition-colors hover:bg-sepia hover:text-branco"
        >
          Ver detalhes
        </Link>
        {lote.status === 'disponivel' && (
          <WhatsappButton
            numero="5577999999999"
            mensagem={`Olá! Tenho interesse no lote ${lote.titulo} do Porto das Oliveiras.`}
            rotulo="Tenho interesse"
          />
        )}
      </div>
    </article>
  );
}
