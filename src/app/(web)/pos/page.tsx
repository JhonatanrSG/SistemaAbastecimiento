// src/app/(web)/pos/page.tsx
import Link from 'next/link';
import { getJSONServer } from '@/lib/api-server';

// Ajusta el tipo según tu API real
type PurchaseOrder = {
  id: string;
  supplierId?: string;
  supplierName?: string;
  status: 'BORRADOR' | 'ENVIADA' | 'APROBADA' | 'RECHAZADA' | 'RECIBIDA' | string;
  totalCents?: number | null;
  currency?: string | null;
  createdAt: string;
};

function money(cents?: number | null, currency = 'USD') {
  if (cents == null) return '-';
  return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(cents / 100);
}

export default async function PurchaseOrdersPage() {
  // ⚠️ Si tu API usa /api/pos en lugar de /api/purchase-orders, cambia esta ruta:
  const orders = await getJSONServer<PurchaseOrder[]>('/api/purchase-orders');

  return (
    <main className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Órdenes de Compra</h1>
        <Link href="/home" className="underline">← Volver</Link>
      </div>

      <div className="overflow-x-auto rounded-xl border">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left">ID</th>
              <th className="px-4 py-2 text-left">Proveedor</th>
              <th className="px-4 py-2 text-left">Estado</th>
              <th className="px-4 py-2 text-left">Total</th>
              <th className="px-4 py-2 text-left">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-t">
                <td className="px-4 py-2 font-mono">{o.id.slice(0, 8)}…</td>
                <td className="px-4 py-2">{o.supplierName ?? o.supplierId ?? '-'}</td>
                <td className="px-4 py-2">
                  <span className="inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs">
                    {o.status}
                  </span>
                </td>
                <td className="px-4 py-2">{money(o.totalCents, o.currency ?? 'USD')}</td>
                <td className="px-4 py-2">{new Date(o.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
