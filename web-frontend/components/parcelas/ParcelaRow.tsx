import { formatarBRL, formatarData } from '@/lib/utils';
import { statusDaParcela } from '@/lib/drupal/parcelas';
import type { Parcela } from '@/lib/drupal/types';
import ParcelaStatusBadge from './ParcelaStatusBadge';

type Props = {
  parcela: Parcela;
};

/**
 * Linha de parcela — render desktop (table row) e mobile (card).
 * Use dentro de `<ul role="list">` para mobile e `<tbody>` para desktop.
 */
export default function ParcelaRow({ parcela }: Props) {
  const status = statusDaParcela(parcela);

  return (
    <>
      {/* Desktop: row em tabela */}
      <tr className="hidden border-b border-linha last:border-b-0 hover:bg-areia-clara/40 sm:table-row">
        <td className="px-4 py-4 font-mono text-[13px] text-sepia-soft">
          {String(parcela.numero).padStart(3, '0')}
        </td>
        <td className="px-4 py-4 text-[14px] text-sepia">
          {formatarData(parcela.vencimento)}
        </td>
        <td className="px-4 py-4 text-right font-medium text-sepia">
          {formatarBRL(parcela.valor)}
        </td>
        <td className="px-4 py-4">
          <ParcelaStatusBadge status={status} />
        </td>
        <td className="px-4 py-4 text-right">
          {status !== 'paga' && parcela.boletoUrl && (
            <a
              href={parcela.boletoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-full border border-sepia/20 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.1em] text-sepia transition-colors hover:bg-sepia hover:text-branco"
            >
              Boleto
            </a>
          )}
          {status === 'paga' && parcela.dataPagamento && (
            <span className="text-[12px] text-sepia-soft">
              Pago em {formatarData(parcela.dataPagamento)}
            </span>
          )}
        </td>
      </tr>

      {/* Mobile: card empilhado */}
      <li className="rounded-card border border-linha bg-branco p-5 sm:hidden">
        <div className="mb-3 flex items-start justify-between">
          <div>
            <p className="kicker mb-1">Parcela {String(parcela.numero).padStart(3, '0')}</p>
            <p className="font-serif text-[20px] font-medium tracking-tightest text-sepia">
              {formatarBRL(parcela.valor)}
            </p>
          </div>
          <ParcelaStatusBadge status={status} />
        </div>
        <div className="flex items-center justify-between text-[13px]">
          <span className="text-sepia-soft">
            Vence {formatarData(parcela.vencimento)}
          </span>
          {status !== 'paga' && parcela.boletoUrl && (
            <a
              href={parcela.boletoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-full border border-sepia/20 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.1em] text-sepia transition-colors hover:bg-sepia hover:text-branco"
            >
              Baixar boleto
            </a>
          )}
          {status === 'paga' && parcela.dataPagamento && (
            <span className="text-sepia-soft">
              Pago em {formatarData(parcela.dataPagamento)}
            </span>
          )}
        </div>
      </li>
    </>
  );
}
