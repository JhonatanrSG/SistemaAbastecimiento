// src/app/(web)/inventory/page.tsx
import Link from 'next/link';
import { getJSONServer } from '@/lib/api-server';

type StockItem = {
  id: string;
  productId: string;
  productName?: string;
  uom?: string | null;
  qty: number;
  minQty?: number | null;
  location?: string | null;
  updatedAt?: string;
};

export default async function InventoryPage() {
  // Ajusta el path si tu API expone otro endpoint (p.ej. /api/inventory/low)
  const rows = await getJSONServer<StockItem[]>('/api/inventory');

  return (
    <main className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Inventario</h1>
        <Link href="/home" className="underline">← Volver</Link>
      </div>

      <div className="overflow-x-auto rounded-xl border">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left">Producto</th>
              <th className="px-4 py-2 text-left">Cant.</th>
              <th className="px-4 py-2 text-left">UOM</th>
              <th className="px-4 py-2 text-left">Mín.</th>
              <th className="px-4 py-2 text-left">Ubicación</th>
              <th className="px-4 py-2 text-left">Actualizado</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const low = r.minQty != null && r.qty <= r.minQty;
              return (
                <tr key={r.id} className="border-t">
                  <td className="px-4 py-2">{r.productName ?? r.productId}</td>
                  <td className={`px-4 py-2 ${low ? 'text-red-600 font-medium' : ''}`}>{r.qty}</td>
                  <td className="px-4 py-2">{r.uom ?? '-'}</td>
                  <td className="px-4 py-2">{r.minQty ?? '-'}</td>
                  <td className="px-4 py-2">{r.location ?? '-'}</td>
                  <td className="px-4 py-2">
                    {r.updatedAt ? new Date(r.updatedAt).toLocaleString() : '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </main>
  );
}
