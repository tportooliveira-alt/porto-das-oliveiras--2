'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useCallback, useTransition } from 'react';
import type { StatusLote } from '@/components/lotes/StatusBadge';
import type { OrdenacaoLote } from '@/lib/drupal/lotes';

type Props = {
  quadras: string[];
  /** Quantos lotes correspondem aos filtros atuais — exibido no header */
  total: number;
};

const STATUS_OPCOES: { value: StatusLote; label: string; cor: string }[] = [
  { value: 'disponivel', label: 'Disponível', cor: 'bg-oliva' },
  { value: 'reservado',  label: 'Reservado',  cor: 'bg-terracota' },
  { value: 'vendido',    label: 'Vendido',    cor: 'bg-sepia' },
];

const ORDENACAO_OPCOES: { value: OrdenacaoLote; label: string }[] = [
  { value: 'recente',       label: 'Mais recentes' },
  { value: 'preco-asc',     label: 'Menor preço' },
  { value: 'preco-desc',    label: 'Maior preço' },
  { value: 'metragem-asc',  label: 'Menor metragem' },
  { value: 'metragem-desc', label: 'Maior metragem' },
];

export default function LoteFilters({ quadras, total }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const status     = params.get('status') as StatusLote | null;
  const quadra     = params.get('quadra') ?? '';
  const precoMin   = params.get('precoMin') ?? '';
  const precoMax   = params.get('precoMax') ?? '';
  const metMin     = params.get('metMin') ?? '';
  const metMax     = params.get('metMax') ?? '';
  const sort       = (params.get('sort') ?? 'recente') as OrdenacaoLote;

  const setParam = useCallback((key: string, value: string | null) => {
    const next = new URLSearchParams(params);
    if (value === null || value === '') next.delete(key);
    else next.set(key, value);
    startTransition(() => {
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    });
  }, [params, pathname, router]);

  const limpar = () => {
    startTransition(() => {
      router.replace(pathname, { scroll: false });
    });
  };

  const algumFiltroAtivo = !!(status || quadra || precoMin || precoMax || metMin || metMax);

  return (
    <aside className="sticky top-28 self-start rounded-card border border-linha bg-areia-clara/40 p-6">
      <div className="mb-5 flex items-baseline justify-between">
        <h2 className="font-serif text-[22px] font-medium tracking-tightest text-sepia">Filtros</h2>
        {algumFiltroAtivo && (
          <button
            type="button"
            onClick={limpar}
            className="text-[11px] font-medium uppercase tracking-[0.14em] text-terracota hover:text-terracota-escuro"
          >
            Limpar
          </button>
        )}
      </div>

      <p className="kicker mb-6 text-oliva">
        {pending ? 'Atualizando…' : `${total} ${total === 1 ? 'lote' : 'lotes'}`}
      </p>

      {/* Status */}
      <fieldset className="mb-7">
        <legend className="kicker mb-3 text-sepia-soft">Status</legend>
        <div className="flex flex-col gap-2">
          {STATUS_OPCOES.map((opt) => {
            const ativo = status === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setParam('status', ativo ? null : opt.value)}
                className={`inline-flex items-center gap-3 rounded-full border px-4 py-2 text-left text-[13px] font-medium transition-all duration-200 ease-out-soft ${
                  ativo
                    ? 'border-sepia bg-sepia text-branco'
                    : 'border-linha bg-branco text-sepia hover:border-sepia/40'
                }`}
              >
                <span className={`h-2.5 w-2.5 rounded-full ${opt.cor}`} aria-hidden />
                {opt.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* Quadra */}
      {quadras.length > 0 && (
        <fieldset className="mb-7">
          <legend className="kicker mb-3 text-sepia-soft">Quadra</legend>
          <select
            value={quadra}
            onChange={(e) => setParam('quadra', e.target.value || null)}
            className="w-full rounded-full border border-linha bg-branco px-4 py-2 text-[14px] text-sepia outline-none focus:border-sepia"
          >
            <option value="">Todas</option>
            {quadras.map((q) => (
              <option key={q} value={q}>Quadra {q}</option>
            ))}
          </select>
        </fieldset>
      )}

      {/* Preço */}
      <fieldset className="mb-7">
        <legend className="kicker mb-3 text-sepia-soft">Preço (R$)</legend>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            min={0}
            placeholder="Min"
            defaultValue={precoMin}
            onBlur={(e) => setParam('precoMin', e.target.value || null)}
            className="rounded-full border border-linha bg-branco px-3 py-2 text-[13px] text-sepia outline-none focus:border-sepia"
          />
          <input
            type="number"
            min={0}
            placeholder="Max"
            defaultValue={precoMax}
            onBlur={(e) => setParam('precoMax', e.target.value || null)}
            className="rounded-full border border-linha bg-branco px-3 py-2 text-[13px] text-sepia outline-none focus:border-sepia"
          />
        </div>
      </fieldset>

      {/* Metragem */}
      <fieldset className="mb-7">
        <legend className="kicker mb-3 text-sepia-soft">Metragem (m²)</legend>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            min={0}
            placeholder="Min"
            defaultValue={metMin}
            onBlur={(e) => setParam('metMin', e.target.value || null)}
            className="rounded-full border border-linha bg-branco px-3 py-2 text-[13px] text-sepia outline-none focus:border-sepia"
          />
          <input
            type="number"
            min={0}
            placeholder="Max"
            defaultValue={metMax}
            onBlur={(e) => setParam('metMax', e.target.value || null)}
            className="rounded-full border border-linha bg-branco px-3 py-2 text-[13px] text-sepia outline-none focus:border-sepia"
          />
        </div>
      </fieldset>

      {/* Ordenação */}
      <fieldset>
        <legend className="kicker mb-3 text-sepia-soft">Ordenar por</legend>
        <select
          value={sort}
          onChange={(e) => setParam('sort', e.target.value === 'recente' ? null : e.target.value)}
          className="w-full rounded-full border border-linha bg-branco px-4 py-2 text-[14px] text-sepia outline-none focus:border-sepia"
        >
          {ORDENACAO_OPCOES.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </fieldset>
    </aside>
  );
}
