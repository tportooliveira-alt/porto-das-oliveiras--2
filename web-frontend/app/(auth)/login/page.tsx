import { signIn } from '@/auth';

type Props = { searchParams: { callbackUrl?: string } };

export default function LoginPage({ searchParams }: Props) {
  const callbackUrl = searchParams.callbackUrl ?? '/painel';

  async function loginGoogle() {
    'use server';
    await signIn('google', { redirectTo: callbackUrl });
  }

  async function loginMicrosoft() {
    'use server';
    await signIn('microsoft-entra-id', { redirectTo: callbackUrl });
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-field-lg uppercase mb-2">Acesso do cliente</h1>
      <p className="text-field-sm">Use sua conta Google ou Microsoft para entrar.</p>

      <form action={loginGoogle}>
        <button
          type="submit"
          className="w-full border-thick border-border px-6 py-4 text-field uppercase tracking-wide"
        >
          Entrar com Google
        </button>
      </form>

      <form action={loginMicrosoft}>
        <button
          type="submit"
          className="w-full border-thick border-border px-6 py-4 text-field uppercase tracking-wide"
        >
          Entrar com Microsoft
        </button>
      </form>
    </div>
  );
}
