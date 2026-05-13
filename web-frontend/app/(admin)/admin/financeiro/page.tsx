import { buscarKpisAdmin } from '@/lib/drupal/admin';
import { formatarBRL, formatarData } from '@/lib/utils';
import { drupalFetch } from '@/lib/drupal/client';
import type { JsonApiCollection } from '@/lib/drupal/types';

export const dynamic = 'force-dynamic';

type ParcelaVencidaAttrs = {
  field_numero:        number;
  field_valor:         string;
  field_vencimento:    string;
  field_pago:          boolean;
  drupal_internal__nid?: number;
};

async function buscarParcelasVencidas() {
  const hoje = new Date().toISOString().slice(0, 10);
  try {
    const resp = await drupalFetch<JsonApiCollection<ParcelaVencidaAttrs>>(
      `/jsonapi/node/parcela?filter[field_pago]=0&filter[field_vencimento][operator]=<&filter[field_vencimento][value]=${hoje}&sort=field_vencimento&page[limit]=50`,
      { autenticado: true, revalidate: 0 },
    );
    return resp.data.map((p) => ({
      id:          p.id,
      numero:      p.attributes.field_numero,
      valor:       Number(p.attributes.field_valor),
      vencimento:  p.attributes.field_vencimento,
      nid:         p.attributes.drupal_internal__nid,
    }));
  } catch {
    return [];
  }
}

function diasAtraso(vencimento: string): number {
  const diff = Date.now() - new Date(vencimento).getTime();
  return Math.max(0, Math.floor(diff / 86_400_000));
}

export default async function AdminFinanceiroPage() {
  const [kpis, vencidas] = await Promise.all([
    buscarKpisAdmin(),
    buscarParcelasVencidas(),
  ]);

  const totalCarteira =
    (kpis?.parcelas.valor_pago    ?? 0) +
    (kpis?.parcelas.valor_aberto  ?? 0) +
    (kpis?.parcelas.valor_vencido ?? 0);

  const pctArrecadado =
    totalCarteira > 0
      ? Math.round(((kpis?.parcelas.valor_pago ?? 0) / totalCarteira) * 100)
      : 0;

  return (
    <div className="flex flex-col gap-14">
      <header>
        <p className="kicker mb-3 text-oliva">☉ Financeiro</p>
        <h1 className="font-serif text-display-md tracking-tighter2 text-sepia">
          Parcelas e recebimentos
        </h1>
      </header>

      {/* ── Barra de progresso da carteira ─────────────────────────── */}
      {kpis && (
        <section aria-label="Progresso da carteira">
          <div className="rounded-card border border-linha bg-branco p-8">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="kicker mb-1 text-oliva">Carteira total</p>
                <p className="font-serif text-[36px] font-medium leading-none tracking-tightest text-sepia">
                  {formatarBRL(totalCarteira)}
                </p>
              </div>
              <p className="text-[13px] text-sepia-soft">{pctArrecadado}% arrecadado</p>
            </div>

            {/* Barra tripartida: pago / aberto / vencido */}
            <div className="flex h-3 w-full overflow-hidden rounded-full bg-sepia/10">
              {kpis.parcelas.valor_pago > 0 && (
                <div
                  className="h-full bg-oliva"
                  style={{ width: `${(kpis.parcelas.valor_pago / totalCarteira) * 100}%` }}
                />
              )}
              {kpis.parcelas.valor_aberto > 0 && (
                <div
                  className="h-full bg-dourado"
                  style={{ width: `${(kpis.parcelas.valor_aberto / totalCarteira) * 100}%` }}
                />
              )}
              {kpis.parcelas.valor_vencido > 0 && (
                <div
                  className="h-full bg-terracota"
                  style={{ width: `${(kpis.parcelas.valor_vencido / totalCarteira) * 100}%` }}
                />
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-6 text-[12px]">
              <Legenda cor="bg-oliva"     label="Pago"    valor={formatarBRL(kpis.parcelas.valor_pago)} />
              <Legenda cor="bg-dourado"   label="A vencer" valor={formatarBRL(kpis.parcelas.valor_aberto)} />
              {kpis.parcelas.vencidas > 0 && (
                <Legenda cor="bg-terracota" label="Vencido" valor={formatarBRL(kpis.parcelas.valor_vencido)} />
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── Tabela de parcelas vencidas ─────────────────────────────── */}
      <section aria-labelledby="vencidas-titulo">
        <div className="mb-6">
          <p className="kicker mb-2 text-terracota">☉ Atenção</p>
          <h2
            id="vencidas-titulo"
            className="font-serif text-display-sm tracking-tighter2 text-sepia"
          >
            Parcelas vencidas
            {vencidas.length > 0 && (
              <span className="ml-3 inline-flex h-7 items-center rounded-full bg-terracota/10 px-3 font-sans text-[13px] font-medium text-terracota">
                {vencidas.length}
              </span>
            )}
          </h2>
        </div>

        {vencidas.length === 0 ? (
          <div className="rounded-card border border-linha bg-branco p-10 text-center">
            <p className="text-[14px] text-sepia-soft">
              Nenhuma parcela vencida. ✓
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-card border border-linha bg-branco">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-linha text-left">
                  <th className="px-5 py-4 font-medium uppercase tracking-[0.06em] text-sepia/50">Parcela</th>
                  <th className="px-5 py-4 font-medium uppercase tracking-[0.06em] text-sepia/50">Vencimento</th>
                  <th className="px-5 py-4 font-medium uppercase tracking-[0.06em] text-sepia/50">Atraso</th>
                  <th className="px-5 py-4 text-right font-medium uppercase tracking-[0.06em] text-sepia/50">Valor</th>
                </tr>
              </thead>
              <tbody>
                {vencidas.map((p, idx) => {
                  const atraso = diasAtraso(p.vencimento);
                  return (
                    <tr
                      key={p.id}
                      className={`border-b border-linha last:border-0 ${idx % 2 === 0 ? '' : 'bg-sepia/[0.02]'}`}
                    >
                      <td className="px-5 py-4 font-medium text-sepia">
                        #{String(p.numero).padStart(3, '0')}
                      </td>
                      <td className="px-5 py-4 text-sepia-soft">
                        {formatarData(p.vencimento)}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                            atraso > 30
                              ? 'bg-terracota/15 text-terracota'
                              : 'bg-dourado/20 text-sepia'
                          }`}
                        >
                          {atraso}d
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right font-medium tabular-nums text-sepia">
                        {formatarBRL(p.valor)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-linha">
                  <td colSpan={3} className="px-5 py-4 text-[12px] uppercase tracking-[0.06em] text-sepia/50">
                    Total vencido
                  </td>
                  <td className="px-5 py-4 text-right font-medium text-terracota tabular-nums">
                    {formatarBRL(vencidas.reduce((s, p) => s + p.valor, 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>

    </div>
  );
}

function Legenda({ cor, label, valor }: { cor: string; label: string; valor: string }) {
  return (
    <div className="flex items-center gap-2 text-sepia-soft">
      <span className={`inline-block h-2.5 w-2.5 rounded-full ${cor}`} />
      <span>{label}</span>
      <span className="font-medium text-sepia">{valor}</span>
    </div>
  );
}
