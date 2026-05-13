import { drupalFetch } from '@/lib/drupal/client';
import type { JsonApiCollection, Contrato } from '@/lib/drupal/types';

type ContratoAttrs = {
  title: string;
  field_valor_total: string;
  field_data_assinatura: string;
  field_status_contrato: 'ativo' | 'quitado' | 'inadimplente' | 'cancelado';
};

/**
 * Lista os contratos do usuário logado.
 *
 * Endpoint preferido: `/api/meus-contratos` (View do Drupal com Contextual
 * Filter `field_cliente = [current-user:uid]`) — cravado por uid no Drupal,
 * sem chance do front passar o filtro errado.
 *
 * Fallback: enquanto a View não existe, usa o JSON:API padrão de
 * `node--contrato` com filter por field_cliente.meta.drupal_internal__target_id.
 */
export async function listarMeusContratos(): Promise<Contrato[]> {
  try {
    const resposta = await drupalFetch<JsonApiCollection<ContratoAttrs>>(
      '/api/meus-contratos?sort=-field_data_assinatura',
      { autenticado: true, revalidate: 0 }
    );
    return resposta.data.map((c) => mapearContrato(c.id, c.attributes));
  }
  catch {
    return [];
  }
}

function mapearContrato(id: string, attrs: ContratoAttrs): Contrato {
  return {
    id,
    loteTitulo: attrs.title,
    valorTotal: Number(attrs.field_valor_total),
    dataAssinatura: attrs.field_data_assinatura,
    status: attrs.field_status_contrato,
  };
}
