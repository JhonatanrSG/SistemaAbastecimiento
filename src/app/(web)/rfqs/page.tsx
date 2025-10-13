import Link from 'next/link';
import { getJSONServer } from '@/lib/api-server';

type Rfq = {
  id: string;
  supplierId: string;
  requestId: string;
  status: string;
  createdAt: string;
};

export default async function RfqsPage() {
  const rows = await getJSONServer<Rfq[]>('/api/rfqs');

  return (
    <main className="p-8 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">RFQs</h1>
        <Link href="/home" className="underline">← Volver</Link>
      </div>

      <div className="overflow-x-auto rounded-xl border">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left">ID</th>
              <th className="px-4 py-2 text-left">Proveedor</th>
              <th className="px-4 py-2 text-left">Solicitud</th>
              <th className="px-4 py-2 text-left">Estado</th>
              <th className="px-4 py-2 text-left">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="px-4 py-2 font-mono">{r.id.slice(0,8)}…</td>
                <td className="px-4 py-2">{r.supplierId}</td>
                <td className="px-4 py-2">{r.requestId}</td>
                <td className="px-4 py-2">{r.status}</td>
                <td className="px-4 py-2">{new Date(r.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
