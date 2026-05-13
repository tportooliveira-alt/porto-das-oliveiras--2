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

type ListarOpcoes = {
  limit?: number;
  status?: StatusLote;
};

export async function listarLotes({ limit = 24, status }: ListarOpcoes = {}): Promise<Lote[]> {
  const params = new URLSearchParams();
  params.set('page[limit]', String(limit));
  params.set('sort', '-created');
  params.set(
    'fields[node--lote]',
    'title,field_quadra,field_numero,field_metragem,field_valor,field_status,field_descricao,path'
  );
  if (status) params.set('filter[field_status]', status);

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
