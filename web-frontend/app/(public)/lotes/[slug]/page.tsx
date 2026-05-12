import { notFound } from 'next/navigation';
import { obterLotePorSlug } from '@/lib/drupal/lotes';
import StatusBadge from '@/components/lotes/StatusBadge';
import WhatsappButton from '@/components/shared/WhatsappButton';
import { formatarBRL } from '@/lib/utils';

export const revalidate = 60;

export default async function LoteDetalhePage({ params }: { params: { slug: string } }) {
  const lote = await obterLotePorSlug(params.slug);
  if (!lote) notFound();

  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-field-lg uppercase">{lote.titulo}</h1>
        <StatusBadge status={lote.status} />
      </header>

      <dl className="grid grid-cols-2 gap-3 mb-6">
        <dt className="uppercase">Quadra</dt><dd>{lote.quadra}</dd>
        <dt className="uppercase">Lote</dt><dd>{lote.numero}</dd>
        <dt className="uppercase">Metragem</dt><dd>{lote.metragem} m²</dd>
        <dt className="uppercase">Valor</dt><dd>{formatarBRL(lote.valor)}</dd>
      </dl>

      {lote.descricao && (
        <div className="prose mb-8" dangerouslySetInnerHTML={{ __html: lote.descricao }} />
      )}

      {lote.status === 'disponivel' && (
        <WhatsappButton
          numero="999999999"
          mensagem={`Olá! Tenho interesse no lote ${lote.titulo}.`}
          rotulo="Quero esse lote"
        />
      )}
    </article>
  );
}
