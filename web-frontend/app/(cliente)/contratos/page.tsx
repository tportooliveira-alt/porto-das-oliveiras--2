import { listarMeusContratos } from '@/lib/drupal/contratos';
import ContratoCard from '@/components/contratos/ContratoCard';
import EmptyState from '@/components/shared/EmptyState';

export const dynamic = 'force-dynamic';

export default async function ContratosPage() {
  const contratos = await listarMeusContratos();

  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="kicker mb-3 text-oliva">☉ Documentação</p>
        <h1 className="font-serif text-display-md tracking-tighter2 text-sepia">
          Meus contratos
        </h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-sepia-soft">
          Histórico completo dos seus contratos no loteamento, com status atualizado e detalhes financeiros.
        </p>
      </header>

      {contratos.length === 0 ? (
        <EmptyState
          titulo="Nenhum contrato encontrado."
          descricao="Quando você assinar um contrato, ele aparece aqui com todos os detalhes. Em caso de dúvida sobre seu cadastro, fale com a equipe."
          acaoLabel="Falar com a equipe"
          acaoHref="https://wa.me/5577999999999"
        />
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {contratos.map((c) => (
            <li key={c.id}>
              <ContratoCard contrato={c} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
