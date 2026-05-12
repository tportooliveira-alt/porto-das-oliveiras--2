'use client';

import { useState } from 'react';

type Resposta = { lote_id: string | null; justificativa: string };

export default function AssistentePage() {
  const [consulta, setConsulta] = useState('');
  const [resposta, setResposta] = useState<Resposta | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setCarregando(true);
    try {
      const r = await fetch('/api/gemini/busca', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consulta }),
      });
      setResposta(await r.json());
    } finally {
      setCarregando(false);
    }
  }

  return (
    <section className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-field-lg uppercase mb-4">Assistente de busca</h1>
      <p className="text-field mb-6">
        Descreva o que você procura (ex.: &quot;lote acima de 400m² com vista&quot;).
      </p>

      <form onSubmit={enviar} className="flex flex-col gap-3 mb-8">
        <textarea
          value={consulta}
          onChange={(e) => setConsulta(e.target.value)}
          rows={4}
          className="border-thick border-border p-3 text-field"
          placeholder="Quero um lote..."
        />
        <button
          type="submit"
          disabled={carregando || consulta.length < 3}
          className="bg-action text-canvas border-thick border-border px-6 py-4 text-field uppercase disabled:opacity-50"
        >
          {carregando ? 'Pensando...' : 'Buscar'}
        </button>
      </form>

      {resposta && (
        <div className="border-thick border-border p-4">
          <p className="text-field mb-2">
            <strong>Recomendação:</strong> {resposta.lote_id ?? 'Nenhum lote ideal'}
          </p>
          <p className="text-field-sm">{resposta.justificativa}</p>
        </div>
      )}
    </section>
  );
}
