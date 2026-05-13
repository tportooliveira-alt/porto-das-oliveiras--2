'use client';

import { track } from '@/lib/analytics';

type Props = {
  href: string;
  parcelaId: string;
  className?: string;
  children: React.ReactNode;
};

/**
 * Link para o PDF do boleto que dispara evento de analytics no clique.
 *
 * `download` força o browser a baixar (em vez de abrir inline), o que
 * é mais ergonômico em mobile e evita CORS quando o PDF vem de outra
 * origem (Drupal).
 */
export default function BoletoLink({ href, parcelaId, className, children }: Props) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      download
      onClick={() => track({ tipo: 'parcela_baixada', meta: { parcela_id: parcelaId } })}
      className={className}
    >
      {children}
    </a>
  );
}
