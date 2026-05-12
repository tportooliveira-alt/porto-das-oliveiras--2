import type { StatusLote } from '@/components/lotes/StatusBadge';

export type Lote = {
  id: string;
  titulo: string;
  slug: string;
  quadra: string;
  numero: number;
  metragem: number;
  valor: number;
  status: StatusLote;
  descricao?: string;
};

export type Parcela = {
  id: string;
  numero: number;
  valor: number;
  vencimento: string;
  pago: boolean;
  dataPagamento?: string;
  boletoUrl?: string;
};

export type Contrato = {
  id: string;
  loteTitulo: string;
  valorTotal: number;
  dataAssinatura: string;
  status: 'ativo' | 'quitado' | 'inadimplente' | 'cancelado';
};

export type JsonApiResource<TAttrs = unknown> = {
  id: string;
  type: string;
  attributes: TAttrs;
  relationships?: Record<string, { data: { id: string; type: string } | Array<{ id: string; type: string }> | null }>;
};

export type JsonApiCollection<TAttrs = unknown> = {
  data: Array<JsonApiResource<TAttrs>>;
  included?: Array<JsonApiResource>;
  links?: Record<string, { href: string }>;
};
