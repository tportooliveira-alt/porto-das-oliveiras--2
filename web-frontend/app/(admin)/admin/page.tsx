import { auth } from '@/auth';
import {
  buscarKpisAdmin,
  buscarAnalyticsAdmin,
  contarLotesPorStatus,
} from '@/lib/drupal/admin';
import { formatarBRL } from '@/lib/utils';

export const dynamic = 'force-dynamic';

// ── Helpers de apresentação ───────────────────────────────────────────────

const LABEL_EVENTO: Record<string, string> = {
  lote_visualizado:     'Lotes vistos',
  lote_listado:         'Listagens',
  whatsapp_clicado:     'WhatsApp',
  busca_executada:      'Buscas',
  login_iniciado:       'Logins iniciados',
  login_concluido:      'Logins concluídos',
  parcela_baixada:      'Boletos baixados',
  contrato_visualizado: 'Contratos vistos',
};

const LABEL_STATUS_CONTRATO: Record<string, string> = {
  ativo:       'Ativos',
  quitado:     'Quitados',
  inadimplente:'Inadimplentes',
  cancelado:   'Cancelados',
};

// ── Componentes de UI ────────────────────────────────────────────────────

function KpiCard({
  titulo,
  valor,
  subtitulo,
  destaque = false,
  cor = 'neutro',
}: {
  titulo: string;
  valor: string | number;
  subtitulo?: string;
  destaque?: boolean;
  cor?: 'verde' | 'amarelo' | 'vermelho' | 'neutro';
}) {
  const corMap = {
    verde:    'border-t-2 border-t-oliva',
    amarelo:  'border-t-2 border-t-dourado',
    vermelho: 'border-t-2 border-t-terracota',
    neutro:   '',
  };

  return (
    <div
      className={`flex flex-col gap-3 rounded-card border border-linha bg-branco p-6 ${destaque ? 'shadow-card' : ''} ${corMap[cor]}`}
    >
      <p className="kicker text-sepia/50">{titulo}</p>
      <p className="font-serif text-[28px] font-medium leading-none tracking-tightest text-sepia">
        {valor}
      </p>
      {subtitulo && (
        <p className="text-[12px] text-sepia-soft">{subtitulo}</p>
      )}
    </div>
  );
}

function SecaoTitulo({ kicker, titulo }: { kicker: string; titulo: string }) {
  return (
    <div className="mb-6">
      <p className="kicker mb-2 text-oliva">{kicker}</p>
      <h2 className="font-serif text-display-sm tracking-tighter2 text-sepia">{titulo}</h2>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────

export default async function AdminDashboardPage() {
  const sessao = await auth();
  const nome   = sessao?.user?.name?.split(' ')[0] ?? 'Admin';

  const [lotes, kpis, analytics] = await Promise.all([
    contarLotesPorStatus(),
    buscarKpisAdmin(),
    buscarAnalyticsAdmin(30),
  ]);

  const totalReceita =
    (kpis?.parcelas.valor_pago    ?? 0) +
    (kpis?.parcelas.valor_aberto  ?? 0) +
    (kpis?.parcelas.valor_vencido ?? 0);

  return (
    <div className="flex flex-col gap-14">

      {/* ── Cabeçalho ─────────────────────────────────────────────────── */}
      <header>
        <p className="kicker mb-3 text-oliva">☉ Painel administrativo</p>
        <h1 className="font-serif text-display-md tracking-tighter2 text-sepia">
          Bom dia, {nome}.
        </h1>
        <p className="mt-3 text-[14px] text-sepia-soft">
          Visão geral do loteamento · últimos 30 dias
        </p>
      </header>

      {/* ── KPIs — Lotes ──────────────────────────────────────────────── */}
      <section aria-labelledby="kpi-lotes">
        <SecaoTitulo kicker="☉ Lotes" titulo="Situação do estoque" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard titulo="Total" valor={lotes.total} cor="neutro" />
          <KpiCard
            titulo="Disponíveis"
            valor={lotes.disponivel}
            subtitulo="prontos para venda"
            cor="verde"
            destaque
          />
          <KpiCard
            titulo="Reservados"
            valor={lotes.reservado}
            subtitulo="aguardando contrato"
            cor="amarelo"
          />
          <KpiCard
            titulo="Vendidos"
            valor={lotes.vendido}
            subtitulo="contratos assinados"
            cor="neutro"
          />
        </div>
      </section>

      {/* ── KPIs — Financeiro ─────────────────────────────────────────── */}
      {kpis && (
        <section aria-labelledby="kpi-financeiro">
          <SecaoTitulo kicker="☉ Financeiro" titulo="Parcelas e receita" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <KpiCard
              titulo="Receita total (carteira)"
              valor={formatarBRL(totalReceita)}
              subtitulo="soma de todas as parcelas"
              cor="neutro"
            />
            <KpiCard
              titulo="Arrecadado"
              valor={formatarBRL(kpis.parcelas.valor_pago)}
              subtitulo={`${kpis.parcelas.pagas} parcelas pagas`}
              cor="verde"
              destaque
            />
            <KpiCard
              titulo="Em aberto"
              valor={formatarBRL(kpis.parcelas.valor_aberto)}
              subtitulo={`${kpis.parcelas.abertas} parcelas a vencer`}
              cor="neutro"
            />
            {kpis.parcelas.vencidas > 0 && (
              <KpiCard
                titulo="Vencido (inadimplência)"
                valor={formatarBRL(kpis.parcelas.valor_vencido)}
                subtitulo={`${kpis.parcelas.vencidas} parcelas vencidas`}
                cor="vermelho"
                destaque
              />
            )}
            {Object.entries(kpis.contratos).map(([status, qtd]) => (
              <KpiCard
                key={status}
                titulo={`Contratos — ${LABEL_STATUS_CONTRATO[status] ?? status}`}
                valor={qtd}
                cor={status === 'inadimplente' ? 'vermelho' : status === 'ativo' ? 'verde' : 'neutro'}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── Analytics ─────────────────────────────────────────────────── */}
      {analytics && (
        <section aria-labelledby="kpi-analytics">
          <SecaoTitulo kicker="☉ Analytics" titulo="Engajamento (30 dias)" />
          <div className="grid gap-6 lg:grid-cols-2">

            {/* Eventos por tipo */}
            <div className="rounded-card border border-linha bg-branco p-6">
              <p className="mb-5 text-[13px] font-medium uppercase tracking-[0.08em] text-sepia/60">
                Eventos por tipo
              </p>
              {analytics.por_tipo.length === 0 ? (
                <p className="text-[13px] text-sepia-soft">Sem eventos no período.</p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {[...analytics.por_tipo]
                    .sort((a, b) => b.total - a.total)
                    .map(({ tipo, total }) => {
                      const max = Math.max(...analytics.por_tipo.map((e) => e.total));
                      const pct = max > 0 ? Math.round((total / max) * 100) : 0;
                      return (
                        <li key={tipo} className="flex flex-col gap-1">
                          <div className="flex justify-between text-[12px]">
                            <span className="text-sepia">{LABEL_EVENTO[tipo] ?? tipo}</span>
                            <span className="font-medium tabular-nums text-sepia">{total}</span>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-sepia/10">
                            <div
                              className="h-full rounded-full bg-oliva"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </li>
                      );
                    })}
                </ul>
              )}
            </div>

            {/* Top lotes visualizados */}
            <div className="rounded-card border border-linha bg-branco p-6">
              <p className="mb-5 text-[13px] font-medium uppercase tracking-[0.08em] text-sepia/60">
                Lotes mais visualizados
              </p>
              {analytics.top_lotes.length === 0 ? (
                <p className="text-[13px] text-sepia-soft">Sem dados no período.</p>
              ) : (
                <ol className="flex flex-col gap-3">
                  {analytics.top_lotes.map(({ lote_id, total }, idx) => (
                    <li key={lote_id} className="flex items-center gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sepia/10 text-[11px] font-medium text-sepia">
                        {idx + 1}
                      </span>
                      <span className="flex-1 truncate font-mono text-[11px] text-sepia/60">
                        {lote_id.slice(0, 18)}…
                      </span>
                      <span className="text-[13px] font-medium tabular-nums text-sepia">
                        {total}×
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </div>

          </div>
        </section>
      )}

    </div>
  );
}
