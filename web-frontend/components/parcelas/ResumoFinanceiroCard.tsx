import Link from 'next/link';
import { formatarBRL, formatarData } from '@/lib/utils';
import { statusDaParcela, type ResumoFinanceiro } from '@/lib/drupal/parcelas';
import ParcelaStatusBadge from './ParcelaStatusBadge';

type Props = {
  resumo: ResumoFinanceiro;
};

export default function ResumoFinanceiroCard({ resumo }: Props) {
  const { totalPago, totalAberto, totalVencido, proximaParcela, percentualPago, totalParcelas } = resumo;
  const totalGeral = totalPago + totalAberto + totalVencido;

  return (
    <section className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_3fr]">
      {/* Próxima parcela em destaque */}
      <article className="relative overflow-hidden rounded-card bg-sepia p-8 text-branco">
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-terracota/15 blur-2xl" aria-hidden />
        <p className="kicker mb-2 text-branco/60">☉ Próxima parcela</p>

        {proximaParcela ? (
          <>
            <p className="font-serif text-[48px] font-medium leading-none tracking-tightest">
              {formatarBRL(proximaParcela.valor)}
            </p>
            <div className="mt-4 flex items-center gap-3">
              <ParcelaStatusBadge status={statusDaParcela(proximaParcela)} />
              <span className="text-[13px] text-branco/75">
                Vence {formatarData(proximaParcela.vencimento)}
              </span>
            </div>
            {proximaParcela.boletoUrl ? (
              <a
                href={proximaParcela.boletoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-terracota px-5 py-3 text-[13px] font-medium uppercase tracking-[0.08em] text-branco transition-all hover:bg-terracota-escuro"
              >
                Baixar boleto
              </a>
            ) : (
              <Link
                href="/parcelas"
                className="mt-6 inline-flex items-center gap-2 rounded-full border border-branco/30 px-5 py-3 text-[13px] font-medium uppercase tracking-[0.08em] text-branco transition-all hover:bg-branco hover:text-sepia"
              >
                Ver detalhes
              </Link>
            )}
          </>
        ) : (
          <>
            <p className="font-serif text-[32px] font-medium leading-tight">
              Está tudo em dia.
            </p>
            <p className="mt-3 text-[14px] text-branco/75">
              Nenhuma parcela em aberto no momento.
            </p>
          </>
        )}
      </article>

      {/* Resumo financeiro com barra de progresso */}
      <article className="rounded-card border border-linha bg-branco p-8">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <p className="kicker mb-2 text-oliva">☉ Seu progresso</p>
            <p className="font-serif text-[40px] font-medium leading-none tracking-tightest text-sepia">
              {percentualPago}%
              <span className="ml-2 text-[18px] font-normal text-sepia-soft">quitado</span>
            </p>
          </div>
          <p className="text-[12px] text-sepia-soft">
            {totalParcelas} {totalParcelas === 1 ? 'parcela' : 'parcelas'} no total
          </p>
        </div>

        {/* Barra de progresso */}
        <div className="mb-6 h-2 overflow-hidden rounded-full bg-areia">
          <div
            className="h-full rounded-full bg-oliva transition-all duration-700 ease-out-soft"
            style={{ width: `${percentualPago}%` }}
            role="progressbar"
            aria-valuenow={percentualPago}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>

        {/* Totais */}
        <dl className="grid grid-cols-3 gap-4 border-t border-linha pt-5 text-center">
          <Total label="Pago"     valor={totalPago}    cor="text-oliva" />
          <Total label="Em aberto" valor={totalAberto}  cor="text-sepia" />
          <Total label="Vencido"  valor={totalVencido} cor="text-terracota" />
        </dl>

        <p className="mt-5 border-t border-linha pt-4 text-right text-[12px] text-sepia-soft">
          Total do contrato: <span className="font-medium text-sepia">{formatarBRL(totalGeral)}</span>
        </p>
      </article>
    </section>
  );
}

function Total({ label, valor, cor }: { label: string; valor: number; cor: string }) {
  return (
    <div>
      <p className={`font-serif text-[18px] font-medium leading-none ${cor}`}>
        {formatarBRL(valor)}
      </p>
      <p className="kicker mt-2">{label}</p>
    </div>
  );
}
