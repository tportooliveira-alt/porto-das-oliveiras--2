import { listarMinhasParcelas } from '@/lib/drupal/parcelas';
import { formatarBRL, formatarData } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function ParcelasPage() {
  const parcelas = await listarMinhasParcelas();

  return (
    <section>
      <h1 className="text-field-lg uppercase mb-6">Minhas parcelas</h1>

      {parcelas.length === 0 ? (
        <p className="text-field">Nenhuma parcela encontrada.</p>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b-thick border-border text-left">
              <th className="py-2 px-2 text-field-sm uppercase">Nº</th>
              <th className="py-2 px-2 text-field-sm uppercase">Vencimento</th>
              <th className="py-2 px-2 text-field-sm uppercase">Valor</th>
              <th className="py-2 px-2 text-field-sm uppercase">Status</th>
            </tr>
          </thead>
          <tbody>
            {parcelas.map((p) => (
              <tr key={p.id} className="border-b border-border">
                <td className="py-2 px-2">{p.numero}</td>
                <td className="py-2 px-2">{formatarData(p.vencimento)}</td>
                <td className="py-2 px-2">{formatarBRL(p.valor)}</td>
                <td className="py-2 px-2 uppercase text-field-sm">
                  {p.pago ? `Pago em ${formatarData(p.dataPagamento!)}` : 'Em aberto'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
