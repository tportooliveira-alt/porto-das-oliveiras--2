import { auth, signOut } from '@/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function ClienteLayout({ children }: { children: React.ReactNode }) {
  const sessao = await auth();
  if (!sessao?.user) redirect('/login');

  async function logout() {
    'use server';
    await signOut({ redirectTo: '/' });
  }

  return (
    <div className="flex flex-col min-h-dvh">
      <header className="border-b-thick border-border bg-canvas">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between flex-wrap gap-3">
          <Link href="/painel" className="text-field-lg uppercase">Painel do cliente</Link>
          <nav className="flex gap-4 text-field-sm uppercase">
            <Link href="/painel">Resumo</Link>
            <Link href="/contratos">Contratos</Link>
            <Link href="/parcelas">Parcelas</Link>
            <Link href="/documentos">Documentos</Link>
          </nav>
          <form action={logout}>
            <button className="border-thick border-border px-4 py-2 text-field-sm uppercase">
              Sair
            </button>
          </form>
        </div>
      </header>
      <main className="flex-1 mx-auto max-w-6xl w-full px-4 py-8">{children}</main>
    </div>
  );
}
