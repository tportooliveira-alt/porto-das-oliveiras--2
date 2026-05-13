'use client';

import { montarLinkWhatsapp } from '@/lib/whatsapp/format';
import { track } from '@/lib/analytics';

type Props = {
  numero: string;
  mensagem: string;
  rotulo?: string;
  loteId?: string;
  origem?: 'card' | 'detalhe' | 'hero' | 'cta';
};

const WhatsIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden>
    <path
      fill="currentColor"
      d="M19.05 4.91A10.05 10.05 0 0 0 12 2C6.48 2 2 6.48 2 12c0 1.76.46 3.47 1.34 4.98L2 22l5.16-1.32A9.99 9.99 0 0 0 12 22c5.52 0 10-4.48 10-10 0-2.65-1.03-5.16-2.95-7.09Zm-7.05 15.4a8.32 8.32 0 0 1-4.24-1.16l-.3-.18-3.06.78.82-2.98-.2-.31a8.34 8.34 0 1 1 6.98 3.86Zm4.55-6.24c-.25-.13-1.47-.72-1.7-.8-.23-.08-.4-.13-.56.13-.17.25-.65.8-.8.97-.15.17-.3.18-.55.06-.25-.13-1.05-.39-2-1.24a7.5 7.5 0 0 1-1.39-1.72c-.14-.25-.02-.38.11-.5.11-.11.25-.3.37-.45.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.43-.06-.13-.55-1.33-.76-1.83-.2-.48-.4-.42-.55-.42h-.47c-.16 0-.43.06-.66.31-.23.25-.86.84-.86 2.05 0 1.21.88 2.38 1 2.55.13.17 1.74 2.67 4.21 3.74.59.25 1.05.4 1.41.51.59.19 1.13.16 1.55.1.47-.07 1.47-.6 1.67-1.18.21-.58.21-1.08.15-1.18-.06-.1-.23-.16-.48-.29Z"
    />
  </svg>
);

export default function WhatsappButton({
  numero,
  mensagem,
  rotulo = 'Falar pelo WhatsApp',
  loteId,
  origem = 'cta',
}: Props) {
  const href = montarLinkWhatsapp(numero, mensagem);

  const handleClick = () => {
    track({
      tipo: 'whatsapp_clicado',
      lote_id: loteId,
      meta: { origem },
    });
  };

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className="inline-flex items-center justify-center gap-2 rounded-full bg-terracota px-5 py-3 text-[13px] font-medium uppercase tracking-[0.08em] text-branco shadow-[0_8px_24px_-8px_rgba(200,112,79,0.45)] transition-all duration-300 ease-out-soft hover:-translate-y-0.5 hover:bg-terracota-escuro hover:shadow-[0_14px_32px_-10px_rgba(200,112,79,0.55)]"
    >
      <WhatsIcon />
      {rotulo}
    </a>
  );
}
