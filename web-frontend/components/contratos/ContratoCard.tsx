import { formatarBRL, formatarData } from '@/lib/utils';
import type { Contrato } from '@/lib/drupal/types';

type Props = {
  contrato: Contrato;
};

const STATUS_ESTILO: Record<Contrato['status'], string> = {
  ativo:        'bg-oliva text-branco',
  quitado:      'bg-sepia text-branco',
  inadimplente: 'bg-terracota text-branco',
  cancelado:    'bg-areia text-sepia-soft border border-linha',
};

const STATUS_LABEL: Record<Contrato['status'], string> = {
  ativo:        'Ativo',
  quitado:      'Quitado',
  inadimplente: 'Inadimplente',
  cancelado:    'Cancelado',
};

export default function ContratoCard({ contrato }: Props) {
  return (
    <article className="rounded-card border border-linha bg-branco p-7 transition-all duration-500 ease-out-soft hover:-translate-y-0.5 hover:shadow-card">
      <header className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="kicker mb-1">Contrato</p>
          <h3 className="font-serif text-[22px] font-medium leading-tight tracking-tightest text-sepia">
            {contrato.loteTitulo}
          </h3>
        </div>
        <span
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em] ${STATUS_ESTILO[contrato.status]}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" aria-hidden />
          {STATUS_LABEL[contrato.status]}
        </span>
      </header>

      <dl className="grid grid-cols-2 gap-y-3 border-t border-linha pt-5 text-[14px]">
        <dt className="kicker">Valor total</dt>
        <dd className="text-right font-medium text-sepia">{formatarBRL(contrato.valorTotal)}</dd>
        <dt className="kicker">Assinatura</dt>
        <dd className="text-right font-medium text-sepia">{formatarData(contrato.dataAssinatura)}</dd>
      </dl>
    </article>
  );
}
