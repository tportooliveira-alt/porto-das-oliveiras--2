import { auth } from '@/auth';

export default async function PainelPage() {
  const sessao = await auth();
  return (
    <section>
      <h1 className="text-field-lg uppercase mb-4">Olá, {sessao?.user?.name ?? sessao?.user?.email}</h1>
      <p className="text-field">
        Use o menu acima para acessar seus contratos, parcelas e documentos.
      </p>
    </section>
  );
}
