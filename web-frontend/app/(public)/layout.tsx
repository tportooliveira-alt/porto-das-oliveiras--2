import Link from 'next/link';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-dvh">
      <header className="border-b-thick border-border bg-canvas">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-field-lg uppercase tracking-tight">
            Porto das Oliveiras
          </Link>
          <nav className="flex gap-6 text-field-sm uppercase">
            <Link href="/lotes">Lotes</Link>
            <Link href="/assistente">Assistente</Link>
            <Link href="/painel">Cliente</Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t-thick border-border py-6 text-center text-field-sm">
        Vitória da Conquista — BA
      </footer>
    </div>
  );
}
