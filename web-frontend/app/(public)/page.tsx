import Hero from '@/components/hero/Hero';
import LoteCard from '@/components/lotes/LoteCard';
import { listarLotes } from '@/lib/drupal/lotes';

export const revalidate = 60;

export default async function HomePage() {
  const lotes = await listarLotes({ limit: 12 });

  return (
    <>
      {/* Vídeo gerado no Veo 3.1 (Google Vids/Flow):
          frame inicial = foto real do canteiro hoje (estrada de terra vermelha)
          transição → bairro entregue + Aeroporto Glauber Rocha + porto seco */}
      <Hero videoSrc="/video/sobrevoo.mp4" />

      <section className="mx-auto max-w-7xl px-6 py-20 lg:py-28" aria-labelledby="lotes-titulo">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <p className="kicker mb-4 text-oliva">☉ 03 · Lotes disponíveis</p>
            <h2 id="lotes-titulo" className="font-serif text-display-md text-sepia tracking-tighter2">
              Escolha o seu pedaço.
            </h2>
          </div>
          <p className="hidden max-w-sm text-[15px] leading-relaxed text-sepia-soft lg:block">
            Cada lote tem escritura registrada e infraestrutura entregue. Você projeta a casa; a gente entrega rua, água, energia e fibra até a porteira.
          </p>
        </div>

        {lotes.length === 0 ? (
          <p className="text-[15px] text-sepia-soft">Nenhum lote cadastrado ainda.</p>
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {lotes.map((lote) => (
              <li key={lote.id}>
                <LoteCard lote={lote} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
