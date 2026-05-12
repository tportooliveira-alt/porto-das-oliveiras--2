import { NextResponse } from 'next/server';
import { z } from 'zod';
import { obterGemini, MODELO_PADRAO } from '@/lib/gemini/client';
import { obterLotePorSlug } from '@/lib/drupal/lotes';

const Body = z.object({ slug: z.string().min(1) });

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ erro: 'Slug inválido' }, { status: 400 });

  const lote = await obterLotePorSlug(parsed.data.slug);
  if (!lote) return NextResponse.json({ erro: 'Lote não encontrado' }, { status: 404 });

  const prompt = `
Gere um pitch de venda curto (máx. 4 frases, tom honesto, sem hype) para o lote a seguir
do loteamento Porto das Oliveiras em Vitória da Conquista (BA). Foque em valor de investimento.

Lote: ${JSON.stringify(lote)}
  `.trim();

  const modelo = obterGemini().getGenerativeModel({ model: MODELO_PADRAO });
  const resposta = await modelo.generateContent(prompt);
  return NextResponse.json({ pitch: resposta.response.text() });
}
