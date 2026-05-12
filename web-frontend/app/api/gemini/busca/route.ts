import { NextResponse } from 'next/server';
import { z } from 'zod';
import { obterGemini, MODELO_PADRAO } from '@/lib/gemini/client';
import { listarLotes } from '@/lib/drupal/lotes';

const Body = z.object({ consulta: z.string().min(3).max(500) });

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ erro: 'Consulta inválida' }, { status: 400 });

  const lotes = await listarLotes({ limit: 100, status: 'disponivel' });

  const prompt = `
Você é um assistente do loteamento Porto das Oliveiras em Vitória da Conquista (BA).
A pergunta do cliente: "${parsed.data.consulta}"

Lotes disponíveis (JSON):
${JSON.stringify(lotes, null, 2)}

Responda APENAS com um objeto JSON neste formato:
{ "lote_id": "<id>" | null, "justificativa": "<texto curto em português>" }
Escolha o lote que melhor atende a pergunta, ou null se nenhum servir.
  `.trim();

  const modelo = obterGemini().getGenerativeModel({
    model: MODELO_PADRAO,
    generationConfig: { responseMimeType: 'application/json' },
  });

  const resposta = await modelo.generateContent(prompt);
  const texto = resposta.response.text();

  try {
    return NextResponse.json(JSON.parse(texto));
  } catch {
    return NextResponse.json({ erro: 'Resposta inválida do modelo', bruto: texto }, { status: 502 });
  }
}
