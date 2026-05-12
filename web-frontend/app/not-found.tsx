import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-20 text-center">
      <h1 className="text-field-lg uppercase mb-4">Página não encontrada</h1>
      <p className="text-field mb-8">O endereço acessado não existe.</p>
      <Link href="/" className="inline-block border-thick border-border px-6 py-3 text-field uppercase">
        Voltar para a home
      </Link>
    </main>
  );
}
