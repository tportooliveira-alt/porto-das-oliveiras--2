import Link from 'next/link';
import BrandMark from '@/components/shared/BrandMark';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-branco">
      {/* Skip link — primeiro elemento focável, oculto até receber foco */}
      <a
        href="#conteudo"
        className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:left-4 focus-visible:top-4 focus-visible:z-50 focus-visible:rounded-full focus-visible:bg-sepia focus-visible:px-5 focus-visible:py-3 focus-visible:text-[13px] focus-visible:font-medium focus-visible:uppercase focus-visible:tracking-[0.1em] focus-visible:text-branco"
      >
        Pular para o conteúdo
      </a>

      <header className="absolute inset-x-0 top-0 z-20">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
          <BrandMark tone="dark" />
          <nav className="flex items-center gap-7 text-[13px] uppercase tracking-[0.08em] text-sepia-soft" aria-label="Navegação principal">
            <Link href="/lotes" className="transition-colors hover:text-sepia">Lotes</Link>
            <Link href="/assistente" className="transition-colors hover:text-sepia">Assistente</Link>
            <Link href="/painel" className="transition-colors hover:text-sepia">Cliente</Link>
          </nav>
        </div>
      </header>

      <main id="conteudo" className="flex-1 pt-24">{children}</main>

      <footer className="border-t border-linha bg-areia-clara/40">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
          <BrandMark tone="dark" size="sm" />
          <p className="kicker text-right">Vitória da Conquista — BA · © 2026</p>
        </div>
      </footer>
    </div>
  );
}
