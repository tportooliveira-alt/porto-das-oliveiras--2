import Link from 'next/link';
import { auth } from '@/auth';
import { listarMinhasParcelas, resumoFinanceiro } from '@/lib/drupal/parcelas';
import { listarMeusContratos } from '@/lib/drupal/contratos';
import ResumoFinanceiroCard from '@/components/parcelas/ResumoFinanceiroCard';
import ContratoCard from '@/components/contratos/ContratoCard';
import EmptyState from '@/components/shared/EmptyState';

export const dynamic = 'force-dynamic';

export default async function PainelPage() {
  const sessao = await auth();
  const [parcelas, contratos] = await Promise.all([
    listarMinhasParcelas(),
    listarMeusContratos(),
  ]);
  const resumo = resumoFinanceiro(parcelas);
  const nome = sessao?.user?.name?.split(' ')[0] ?? 'Cliente';

  return (
    <div className="flex flex-col gap-12">
      {/* Saudação */}
      <header>
        <p className="kicker mb-3 text-oliva">☉ Painel do cliente</p>
        <h1 className="font-serif text-display-md tracking-tighter2 text-sepia">
          Bem-vindo, {nome}.
        </h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-sepia-soft">
          Acompanhe seus contratos, parcelas e documentos do loteamento.
        </p>
      </header>

      {/* Resumo financeiro + próxima parcela */}
      {parcelas.length > 0 ? (
        <ResumoFinanceiroCard resumo={resumo} />
      ) : (
        <EmptyState
          titulo="Sem parcelas registradas."
          descricao="Quando o financeiro liberar suas parcelas, elas aparecerão aqui. Em caso de dúvida, fale com a equipe."
          acaoLabel="Falar com o financeiro"
          acaoHref="https://wa.me/5577999999999"
        />
      )}

      {/* Meus contratos */}
      <section aria-labelledby="contratos-titulo">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <p className="kicker mb-2 text-oliva">☉ Contratos</p>
            <h2 id="contratos-titulo" className="font-serif text-display-sm tracking-tighter2 text-sepia">
              Seus contratos
            </h2>
          </div>
          {contratos.length > 0 && (
            <Link
              href="/contratos"
              className="hidden text-[12px] uppercase tracking-[0.1em] text-sepia-soft hover:text-sepia sm:inline"
            >
              Ver todos →
            </Link>
          )}
        </div>

        {contratos.length === 0 ? (
          <EmptyState
            titulo="Nenhum contrato encontrado."
            descricao="Após a assinatura, seu contrato aparece aqui com status e parcelas vinculadas."
          />
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {contratos.slice(0, 3).map((c) => (
              <li key={c.id}>
                <ContratoCard contrato={c} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Atalhos rápidos */}
      <section aria-labelledby="atalhos-titulo">
        <p className="kicker mb-2 text-oliva">☉ Atalhos</p>
        <h2 id="atalhos-titulo" className="sr-only">Atalhos</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Atalho href="/parcelas"   titulo="Parcelas"   descricao="Tabela completa + boletos" />
          <Atalho href="/contratos"  titulo="Contratos"  descricao="Histórico e status" />
          <Atalho href="/documentos" titulo="Documentos" descricao="Escrituras e comprovantes" />
        </div>
      </section>
    </div>
  );
}

function Atalho({ href, titulo, descricao }: { href: string; titulo: string; descricao: string }) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between gap-4 rounded-card border border-linha bg-branco p-5 transition-all duration-300 ease-out-soft hover:-translate-y-0.5 hover:border-oliva/40 hover:shadow-card"
    >
      <div>
        <p className="font-serif text-[18px] font-medium tracking-tightest text-sepia">{titulo}</p>
        <p className="mt-1 text-[12px] text-sepia-soft">{descricao}</p>
      </div>
      <span className="text-sepia-soft transition-transform group-hover:translate-x-1" aria-hidden>→</span>
    </Link>
  );
}
