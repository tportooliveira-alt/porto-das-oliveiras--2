import Link from 'next/link';
import BrandMark from '@/components/shared/BrandMark';

export default function NotFound() {
  return (
    <div className="paper flex min-h-dvh flex-col">
      <header className="mx-auto w-full max-w-7xl px-6 py-6">
        <BrandMark tone="dark" />
      </header>

      <main className="flex flex-1 items-center justify-center px-6 py-20">
        <div className="max-w-xl text-center">
          <p className="kicker mb-4 text-oliva">☉ 404</p>
          <h1 className="font-serif text-display-md tracking-tighter2 text-sepia">
            Essa página se perdeu no caminho.
          </h1>
          <p className="mt-5 text-[16px] leading-relaxed text-sepia-soft">
            O endereço que você seguiu não existe — pode ter sido renomeado ou removido. Volte para a página inicial e a gente te orienta.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-terracota px-7 py-4 text-[14px] font-medium uppercase tracking-[0.06em] text-branco transition-all duration-300 ease-out-soft hover:-translate-y-0.5 hover:bg-terracota-escuro"
            >
              Ir para a home
            </Link>
            <Link
              href="/lotes"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-sepia/30 px-7 py-4 text-[14px] font-medium uppercase tracking-[0.06em] text-sepia transition-all duration-300 ease-out-soft hover:-translate-y-0.5 hover:bg-sepia hover:text-branco"
            >
              Ver lotes
            </Link>
          </div>
        </div>
      </main>

      <footer className="mx-auto w-full max-w-7xl px-6 py-6">
        <p className="kicker text-center">Vitória da Conquista — BA</p>
      </footer>
    </div>
  );
}
