import { auth, signOut } from '@/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import BrandMark from '@/components/shared/BrandMark';

const NAV_ITEMS = [
  { href: '/painel',     label: 'Resumo' },
  { href: '/contratos',  label: 'Contratos' },
  { href: '/parcelas',   label: 'Parcelas' },
  { href: '/documentos', label: 'Documentos' },
];

export default async function ClienteLayout({ children }: { children: React.ReactNode }) {
  const sessao = await auth();
  if (!sessao?.user) redirect('/login');

  async function logout() {
    'use server';
    await signOut({ redirectTo: '/' });
  }

  const nomeCurto = sessao.user.name?.split(' ')[0] ?? sessao.user.email?.split('@')[0] ?? 'Cliente';

  return (
    <div className="flex min-h-dvh flex-col bg-branco">
      <a
        href="#conteudo"
        className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:left-4 focus-visible:top-4 focus-visible:z-50 focus-visible:rounded-full focus-visible:bg-sepia focus-visible:px-5 focus-visible:py-3 focus-visible:text-[13px] focus-visible:font-medium focus-visible:uppercase focus-visible:tracking-[0.1em] focus-visible:text-branco"
      >
        Pular para o conteúdo
      </a>
      <header className="border-b border-linha bg-branco/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-5">
          <div className="flex items-center gap-8">
            <BrandMark tone="dark" size="sm" />
            <nav className="hidden gap-7 text-[13px] uppercase tracking-[0.08em] text-sepia-soft lg:flex">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="transition-colors hover:text-sepia"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden text-[12px] text-sepia-soft sm:inline">
              Olá, <span className="text-sepia">{nomeCurto}</span>
            </span>
            <form action={logout}>
              <button
                type="submit"
                className="inline-flex items-center gap-1 rounded-full border border-sepia/20 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.1em] text-sepia transition-colors hover:bg-sepia hover:text-branco"
              >
                Sair
              </button>
            </form>
          </div>
        </div>

        {/* Nav mobile (debaixo do header) */}
        <nav className="mx-auto flex max-w-7xl gap-6 overflow-x-auto px-6 pb-3 text-[12px] uppercase tracking-[0.08em] text-sepia-soft lg:hidden">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="shrink-0 transition-colors hover:text-sepia"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      <main id="conteudo" className="mx-auto w-full max-w-7xl flex-1 px-6 py-12 lg:py-16">{children}</main>

      <footer className="border-t border-linha bg-areia-clara/40">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-6 py-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="kicker">Área do cliente · Porto das Oliveiras</p>
          <p className="kicker text-right">Vitória da Conquista — BA</p>
        </div>
      </footer>
    </div>
  );
}
