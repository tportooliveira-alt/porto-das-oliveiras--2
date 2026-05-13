import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { obterLotePorSlug } from '@/lib/drupal/lotes';
import StatusBadge from '@/components/lotes/StatusBadge';
import WhatsappButton from '@/components/shared/WhatsappButton';
import { formatarBRL } from '@/lib/utils';

export const revalidate = 60;

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
const STATUS_LABEL = {
  disponivel: 'Disponível',
  reservado:  'Reservado',
  vendido:    'Vendido',
} as const;

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const lote = await obterLotePorSlug(params.slug);
  if (!lote) return { title: 'Lote não encontrado' };

  const titulo = `Lote ${lote.titulo} — ${STATUS_LABEL[lote.status]} | Porto das Oliveiras`;
  const descricao = `${lote.metragem} m², quadra ${lote.quadra}, ${formatarBRL(lote.valor)}. Lote ${STATUS_LABEL[lote.status].toLowerCase()} no Porto das Oliveiras, Vitória da Conquista — BA.`;
  const url = `${BASE_URL}/lotes/${lote.slug}`;

  return {
    title: titulo,
    description: descricao,
    alternates: { canonical: url },
    openGraph: {
      title: titulo,
      description: descricao,
      url,
      type: 'website',
      locale: 'pt_BR',
      siteName: 'Porto das Oliveiras',
    },
    twitter: {
      card: 'summary_large_image',
      title: titulo,
      description: descricao,
    },
  };
}

export default async function LoteDetalhePage({ params }: { params: { slug: string } }) {
  const lote = await obterLotePorSlug(params.slug);
  if (!lote) notFound();

  // JSON-LD Schema.org — rich snippets no Google
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `Lote ${lote.titulo}`,
    description: `Lote de ${lote.metragem} m² na quadra ${lote.quadra}, número ${lote.numero}, do loteamento Porto das Oliveiras em Vitória da Conquista — BA.`,
    sku: lote.id,
    category: 'Imóveis > Terrenos e Lotes',
    offers: {
      '@type': 'Offer',
      price: lote.valor,
      priceCurrency: 'BRL',
      availability:
        lote.status === 'disponivel'
          ? 'https://schema.org/InStock'
          : lote.status === 'reservado'
            ? 'https://schema.org/PreOrder'
            : 'https://schema.org/OutOfStock',
      url: `${BASE_URL}/lotes/${lote.slug}`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article className="mx-auto max-w-4xl px-6 py-16 lg:py-24">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="kicker mb-8 flex items-center gap-2">
          <a href="/" className="hover:text-sepia">Início</a>
          <span aria-hidden>·</span>
          <a href="/lotes" className="hover:text-sepia">Lotes</a>
          <span aria-hidden>·</span>
          <span className="text-sepia">{lote.titulo}</span>
        </nav>

        <header className="mb-10 flex items-start justify-between gap-6">
          <div>
            <p className="kicker mb-2">Quadra {lote.quadra} · Lote {lote.numero}</p>
            <h1 className="font-serif text-display-md tracking-tighter2 text-sepia">
              {lote.titulo}
            </h1>
          </div>
          <StatusBadge status={lote.status} />
        </header>

        <dl className="mb-10 grid grid-cols-2 gap-6 rounded-card border border-linha bg-areia-clara/40 p-7 sm:grid-cols-4">
          <Dado label="Quadra" valor={lote.quadra} />
          <Dado label="Lote"   valor={String(lote.numero)} />
          <Dado label="Metragem" valor={`${lote.metragem} m²`} />
          <Dado label="Valor"  valor={formatarBRL(lote.valor)} />
        </dl>

        {lote.descricao && (
          <div
            className="prose-editorial mb-10 max-w-none text-[16px] leading-relaxed text-sepia"
            dangerouslySetInnerHTML={{ __html: lote.descricao }}
          />
        )}

        {lote.status === 'disponivel' && (
          <div className="mt-8 flex flex-col items-start gap-4 rounded-card border border-linha bg-branco p-7 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-serif text-[20px] font-medium text-sepia">
                Interessado nesse lote?
              </p>
              <p className="mt-1 text-[14px] text-sepia-soft">
                Fale com a equipe pelo WhatsApp — resposta em até 30 minutos no horário comercial.
              </p>
            </div>
            <WhatsappButton
              numero="5577999999999"
              mensagem={`Olá! Tenho interesse no lote ${lote.titulo} do Porto das Oliveiras.`}
              rotulo="Quero esse lote"
            />
          </div>
        )}
      </article>
    </>
  );
}

function Dado({ label, valor }: { label: string; valor: string }) {
  return (
    <div>
      <dt className="kicker mb-2">{label}</dt>
      <dd className="font-serif text-[22px] font-medium leading-none tracking-tightest text-sepia">
        {valor}
      </dd>
    </div>
  );
}
