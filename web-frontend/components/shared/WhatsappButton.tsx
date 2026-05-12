import { montarLinkWhatsapp } from '@/lib/whatsapp/format';

type Props = {
  numero: string;
  mensagem: string;
  rotulo?: string;
};

export default function WhatsappButton({ numero, mensagem, rotulo = 'Falar pelo WhatsApp' }: Props) {
  const href = montarLinkWhatsapp(numero, mensagem);
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-block w-full text-center bg-action text-canvas border-thick border-border px-6 py-4 text-field uppercase tracking-wide"
    >
      {rotulo}
    </a>
  );
}
