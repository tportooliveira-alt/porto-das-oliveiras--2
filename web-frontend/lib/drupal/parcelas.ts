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
 * Endpoint: /api/minhas-parcelas (View do Drupal com Contextual Filter
 * field_cliente = [current-user:uid]). O Drupal garante que só vêm
 * as parcelas do usuário cujo JWT foi enviado — nada vaza por mudar
 * parâmetros aqui no front.
 */
export async function listarMinhasParcelas(): Promise<Parcela[]> {
  const resposta = await drupalFetch<JsonApiCollection<ParcelaAttrs>>(
    '/api/minhas-parcelas?sort=field_numero',
    { autenticado: true, revalidate: 0 }
  );

  return resposta.data.map((p) => ({
    id: p.id,
    numero: Number(p.attributes.field_numero),
    valor: Number(p.attributes.field_valor),
    vencimento: p.attributes.field_vencimento,
    pago: p.attributes.field_pago,
    dataPagamento: p.attributes.field_data_pagamento ?? undefined,
  }));
}
