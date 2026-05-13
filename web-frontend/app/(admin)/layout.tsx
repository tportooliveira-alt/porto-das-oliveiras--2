import { auth, signOut } from '@/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import BrandMark from '@/components/shared/BrandMark';

const ROLES_ADMIN = ['vendedor', 'financeiro', 'administrator'];

const NAV_ITEMS = [
  { href: '/admin',            label: 'Dashboard' },
  { href: '/admin/financeiro', label: 'Financeiro' },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const sessao = await auth();
  if (!sessao?.user) redirect('/login?callbackUrl=/admin');

  const roles = (sessao.user as { drupalRoles?: string[] }).drupalRoles ?? [];
  const temAcesso = roles.some((r) => ROLES_ADMIN.includes(r));
  if (!temAcesso) redirect('/painel');

  async function logout() {
    'use server';
    await signOut({ redirectTo: '/' });
  }

  const nomeCurto = sessao.user.name?.split(' ')[0] ?? sessao.user.email?.split('@')[0] ?? 'Admin';

  return (
    <div className="flex min-h-dvh flex-col" style={{ background: 'var(--areia-clara, #f5f0e8)' }}>
      <a
        href="#conteudo"
        className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:left-4 focus-visible:top-4 focus-visible:z-50 focus-visible:rounded-full focus-visible:bg-sepia focus-visible:px-5 focus-visible:py-3 focus-visible:text-[13px] focus-visible:font-medium focus-visible:uppercase focus-visible:tracking-[0.1em] focus-visible:text-branco"
      >
        Pular para o conteúdo
      </a>

      <header className="border-b border-sepia/20 bg-sepia text-branco">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-8">
            <BrandMark size="sm" />
            <span className="hidden text-[11px] font-medium uppercase tracking-[0.15em] text-branco/50 lg:inline">
              Admin
            </span>
            <nav className="hidden gap-7 text-[13px] uppercase tracking-[0.08em] text-branco/60 lg:flex">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="transition-colors hover:text-branco"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-5">
            <Link
              href="/painel"
              className="hidden text-[11px] uppercase tracking-[0.1em] text-branco/50 transition-colors hover:text-branco sm:inline"
            >
              ← Área cliente
            </Link>
            <span className="hidden text-[12px] text-branco/50 sm:inline">
              {nomeCurto}
            </span>
            <form action={logout}>
              <button
                type="submit"
                className="inline-flex items-center gap-1 rounded-full border border-branco/20 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.1em] text-branco/70 transition-colors hover:bg-branco hover:text-sepia"
              >
                Sair
              </button>
            </form>
          </div>
        </div>

        {/* Nav mobile */}
        <nav className="mx-auto flex max-w-7xl gap-6 overflow-x-auto px-6 pb-3 text-[12px] uppercase tracking-[0.08em] text-branco/60 lg:hidden">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="shrink-0 transition-colors hover:text-branco"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      <main id="conteudo" className="mx-auto w-full max-w-7xl flex-1 px-6 py-12 lg:py-16">
        {children}
      </main>

      <footer className="border-t border-sepia/10">
        <div className="mx-auto flex max-w-7xl px-6 py-6">
          <p className="kicker text-sepia/40">Porto das Oliveiras · Painel Admin</p>
        </div>
      </footer>
    </div>
  );
}
