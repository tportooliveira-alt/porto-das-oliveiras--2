import type { Metadata } from 'next';
import { fontSerif, fontSans, fontMono } from './fonts';
import './globals.css';

export const metadata: Metadata = {
  title: 'Porto das Oliveiras — Loteamento em Vitória da Conquista',
  description:
    'Lotes de 300 m² a 30 minutos do centro de Vitória da Conquista. Infraestrutura completa, escritura registrada, parcelamento direto.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${fontSerif.variable} ${fontSans.variable} ${fontMono.variable}`}>
      <body className="min-h-dvh bg-branco text-sepia font-sans">{children}</body>
    </html>
  );
}
