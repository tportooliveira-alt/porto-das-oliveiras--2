import { listarLotes } from '@/lib/drupal/lotes';
import LoteCard from '@/components/lotes/LoteCard';

export const revalidate = 60;

export default async function HomePage() {
  const lotes = await listarLotes({ limit: 12 });

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-field-lg uppercase mb-6">Lotes disponíveis</h1>

      {lotes.length === 0 ? (
        <p className="text-field">Nenhum lote cadastrado ainda.</p>
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
  );
}
