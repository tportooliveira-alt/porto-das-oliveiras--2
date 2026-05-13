import { drupalFetch } from '@/lib/drupal/client';

export type KpisAdmin = {
  parcelas: {
    pagas:         number;
    abertas:       number;
    vencidas:      number;
    valor_pago:    number;
    valor_aberto:  number;
    valor_vencido: number;
  };
  contratos: Record<string, number>;
};

export type AnalyticsAdmin = {
  por_tipo:     { tipo: string; total: number }[];
  top_lotes:    { lote_id: string; total: number }[];
  periodo_dias: number;
};

export type LotesKpis = {
  disponivel: number;
  reservado:  number;
  vendido:    number;
  total:      number;
};

export async function buscarKpisAdmin(): Promise<KpisAdmin | null> {
  try {
    return await drupalFetch<KpisAdmin>('/api/admin/kpis', {
      autenticado: true,
      revalidate:  0,
    });
  } catch {
    return null;
  }
}

export async function buscarAnalyticsAdmin(dias = 30): Promise<AnalyticsAdmin | null> {
  try {
    return await drupalFetch<AnalyticsAdmin>(`/api/admin/analytics?dias=${dias}`, {
      autenticado: true,
      revalidate:  0,
    });
  } catch {
    return null;
  }
}

export async function contarLotesPorStatus(): Promise<LotesKpis> {
  const contar = async (status: string): Promise<number> => {
    try {
      const resp = await drupalFetch<{ meta?: { count?: number } }>(
        `/jsonapi/node/lote?filter[field_status]=${status}&page[limit]=0`,
        { revalidate: 60 },
      );
      return resp.meta?.count ?? 0;
    } catch {
      return 0;
    }
  };

  const [disponivel, reservado, vendido] = await Promise.all([
    contar('disponivel'),
    contar('reservado'),
    contar('vendido'),
  ]);

  return { disponivel, reservado, vendido, total: disponivel + reservado + vendido };
}
