import { GoogleGenerativeAI } from '@google/generative-ai';

let cliente: GoogleGenerativeAI | null = null;

export function obterGemini(): GoogleGenerativeAI {
  if (!cliente) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY não configurada');
    cliente = new GoogleGenerativeAI(apiKey);
  }
  return cliente;
}

export const MODELO_PADRAO = 'gemini-1.5-flash';
