import { drupalFetch } from '@/lib/drupal/client';
import type { JsonApiCollection, Parcela } from '@/lib/drupal/types';

type ParcelaAttrs = {
  field_numero: number;
  field_valor: string;
  field_vencimento: string;
  field_pago: boolean;
  field_data_pagamento?: string | null;
};

/**
 * Busca as parcelas do usuário logado.
 *
 * Endpoint preferido: `/api/minhas-parcelas` (View do Drupal com
 * Contextual Filter `field_cliente = [current-user:uid]`). O Drupal
 * crava o filtro no servidor — não tem como o front passar uid alheio.
 *
 * Fallback (enquanto a View não foi criada): silenciosamente retorna [].
 * A View deve ser criada via drush — ver web-backend/scripts/bootstrap-views.php.
 */
export async function listarMinhasParcelas(): Promise<Parcela[]> {
  try {
    const resposta = await drupalFetch<JsonApiCollection<ParcelaAttrs>>(
      '/api/minhas-parcelas?sort=field_vencimento',
      { autenticado: true, revalidate: 0 }
    );
    return resposta.data.map((p) => mapearParcela(p.id, p.attributes));
  }
  catch {
    return [];
  }
}

function mapearParcela(id: string, attrs: ParcelaAttrs): Parcela {
  return {
    id,
    numero: Number(attrs.field_numero),
    valor: Number(attrs.field_valor),
    vencimento: attrs.field_vencimento,
    pago: !!attrs.field_pago,
    dataPagamento: attrs.field_data_pagamento ?? undefined,
  };
}

/* ---------------------- Lógica de status derivado ---------------------- */

export type StatusParcela = 'paga' | 'aberta' | 'vencida';

export function statusDaParcela(p: Parcela, hoje: Date = new Date()): StatusParcela {
  if (p.pago) return 'paga';
  const venc = new Date(p.vencimento);
  return venc < startOfDay(hoje) ? 'vencida' : 'aberta';
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/* ---------------------- Agregação financeira -------------------------- */

export type ResumoFinanceiro = {
  totalParcelas: number;
  totalPago: number;
  totalAberto: number;
  totalVencido: number;
  proximaParcela?: Parcela;
  percentualPago: number;
};

export function resumoFinanceiro(parcelas: Parcela[]): ResumoFinanceiro {
  const hoje = new Date();
  let totalPago = 0, totalAberto = 0, totalVencido = 0;
  let proximaParcela: Parcela | undefined;

  for (const p of parcelas) {
    const status = statusDaParcela(p, hoje);
    if (status === 'paga')         totalPago    += p.valor;
    else if (status === 'aberta')  totalAberto  += p.valor;
    else                            totalVencido += p.valor;

    if (status !== 'paga') {
      const venc = new Date(p.vencimento);
      if (!proximaParcela || venc < new Date(proximaParcela.vencimento)) {
        proximaParcela = p;
      }
    }
  }

  const total = totalPago + totalAberto + totalVencido;
  return {
    totalParcelas: parcelas.length,
    totalPago,
    totalAberto,
    totalVencido,
    proximaParcela,
    percentualPago: total > 0 ? Math.round((totalPago / total) * 100) : 0,
  };
}
