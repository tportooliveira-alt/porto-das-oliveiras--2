import { drupalFetch } from '@/lib/drupal/client';
import type { JsonApiCollection, Lote } from '@/lib/drupal/types';
import type { StatusLote } from '@/components/lotes/StatusBadge';

type LoteAttrs = {
  title: string;
  field_quadra: string;
  field_numero: number;
  field_metragem: string; // Drupal serializa decimais como string
  field_valor: string;
  field_status: StatusLote;
  field_descricao?: { processed?: string; value?: string } | null;
  path?: { alias?: string };
};

function mapearLote(id: string, attrs: LoteAttrs): Lote {
  return {
    id,
    titulo: attrs.title,
    slug: attrs.path?.alias?.replace(/^\//, '') ?? id,
    quadra: attrs.field_quadra,
    numero: Number(attrs.field_numero),
    metragem: Number(attrs.field_metragem),
    valor: Number(attrs.field_valor),
    status: attrs.field_status,
    descricao: attrs.field_descricao?.processed,
  };
}

export type OrdenacaoLote =
  | 'recente'
  | 'preco-asc'
  | 'preco-desc'
  | 'metragem-asc'
  | 'metragem-desc';

const SORT_MAP: Record<OrdenacaoLote, string> = {
  'recente':        '-created',
  'preco-asc':       'field_valor',
  'preco-desc':     '-field_valor',
  'metragem-asc':    'field_metragem',
  'metragem-desc':  '-field_metragem',
};

export type FiltrosLote = {
  limit?: number;
  status?: StatusLote;
  quadra?: string;
  precoMin?: number;
  precoMax?: number;
  metragemMin?: number;
  metragemMax?: number;
  sort?: OrdenacaoLote;
};

/**
 * Constrói filtros condition-group do JSON:API para campos numéricos.
 * Drupal aceita operadores como >=, <=, BETWEEN via condition groups.
 */
function addRangeFilter(
  params: URLSearchParams,
  groupId: string,
  fieldPath: string,
  value: number,
  operator: '>=' | '<=' | '=' | 'BETWEEN'
): void {
  params.set(`filter[${groupId}][condition][path]`, fieldPath);
  params.set(`filter[${groupId}][condition][operator]`, operator);
  params.set(`filter[${groupId}][condition][value]`, String(value));
}

export async function listarLotes(filtros: FiltrosLote = {}): Promise<Lote[]> {
  const {
    limit = 24,
    status,
    quadra,
    precoMin,
    precoMax,
    metragemMin,
    metragemMax,
    sort = 'recente',
  } = filtros;

  const params = new URLSearchParams();
  params.set('page[limit]', String(limit));
  params.set('sort', SORT_MAP[sort]);
  params.set(
    'fields[node--lote]',
    'title,field_quadra,field_numero,field_metragem,field_valor,field_status,field_descricao,path'
  );

  if (status) params.set('filter[field_status]', status);
  if (quadra) params.set('filter[field_quadra]', quadra);
  if (precoMin !== undefined)    addRangeFilter(params, 'pmin', 'field_valor',    precoMin,    '>=');
  if (precoMax !== undefined)    addRangeFilter(params, 'pmax', 'field_valor',    precoMax,    '<=');
  if (metragemMin !== undefined) addRangeFilter(params, 'mmin', 'field_metragem', metragemMin, '>=');
  if (metragemMax !== undefined) addRangeFilter(params, 'mmax', 'field_metragem', metragemMax, '<=');

  const resposta = await drupalFetch<JsonApiCollection<LoteAttrs>>(
    `/jsonapi/node/lote?${params.toString()}`,
    { revalidate: 60 }
  );

  return resposta.data.map((node) => mapearLote(node.id, node.attributes));
}

export async function obterLotePorSlug(slug: string): Promise<Lote | null> {
  // UUIDs do Drupal são o slug canônico. O JSON:API expõe `/jsonapi/node/lote/<uuid>`
  // diretamente, evitando o filtro `path.alias` (que exige expor o pseudo-campo `path`).
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidPattern.test(slug)) {
    return null;
  }

  const params = new URLSearchParams();
  params.set(
    'fields[node--lote]',
    'title,field_quadra,field_numero,field_metragem,field_valor,field_status,field_descricao'
  );

  try {
    const resposta = await drupalFetch<{ data: { id: string; attributes: LoteAttrs } }>(
      `/jsonapi/node/lote/${slug}?${params.toString()}`,
      { revalidate: 60 }
    );
    return mapearLote(resposta.data.id, resposta.data.attributes);
  }
  catch {
    return null;
  }
}

/**
 * Retorna a lista de quadras existentes (para popular o filtro Quadra).
 * Cache curto — atualiza a cada 5 min.
 */
export async function listarQuadras(): Promise<string[]> {
  const params = new URLSearchParams();
  params.set('page[limit]', '200');
  params.set('fields[node--lote]', 'field_quadra');

  try {
    const resposta = await drupalFetch<JsonApiCollection<Pick<LoteAttrs, 'field_quadra'>>>(
      `/jsonapi/node/lote?${params.toString()}`,
      { revalidate: 300 }
    );
    const quadras = new Set(resposta.data.map((n) => n.attributes.field_quadra));
    return Array.from(quadras).sort();
  }
  catch {
    return [];
  }
}
