// src/app/(web)/orders/page.tsx
import Link from 'next/link';
import { getJSONServer } from '@/lib/api-server';

type UiOrderRow = {
  id: string;
  createdAt: string;
  tableNumber: string;
  waiterName: string;
  status: string;
  items: { id: string; dishName: string; qty: number; note?: string | null }[];
};

async function fetchOrders(): Promise<UiOrderRow[]> {
  const data = await getJSONServer<any>('/api/orders');
  // Acepta tanto {rows: [...] } como un array directo
  const rows: UiOrderRow[] = Array.isArray(data)
    ? data
    : Array.isArray(data?.rows)
    ? data.rows
    : [];
  return rows;
}

export default async function OrdersPage() {
  const orders = await fetchOrders();

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/home" className="text-sm underline">&lt; Volver al inicio</Link>
        <h1 className="text-2xl font-bold">Pedidos</h1>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-2">Hora</th>
              <th className="px-4 py-2">Mesa</th>
              <th className="px-4 py-2">Mesero</th>
              <th className="px-4 py-2">Estado</th>
              <th className="px-4 py-2">ID</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                  Sin pedidos aún.
                </td>
              </tr>
            ) : (
              orders.map((o) => (
                <tr key={o.id} className="border-t">
                  <td className="px-4 py-2">{new Date(o.createdAt).toLocaleTimeString()}</td>
                  <td className="px-4 py-2">{o.tableNumber}</td>
                  <td className="px-4 py-2">{o.waiterName || '-'}</td>
                  <td className="px-4 py-2">{o.status}</td>
                  <td className="px-4 py-2 font-mono">{o.id.slice(0, 8)}…</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
