import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Porto das Oliveiras — Loteamento',
  description: 'Lotes disponíveis em Vitória da Conquista (BA).',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-dvh bg-canvas text-ink">{children}</body>
    </html>
  );
}
