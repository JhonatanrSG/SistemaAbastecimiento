'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

type PoItem = {
  productId: string;
  qty: number;
  qtyReceived: number;
  uom: 'Kg' | 'Lb' | 'L' | 'Unidad';
};

type PurchaseOrder = {
  id: string;
  supplierId: string;
  status: string;
  createdAt: string;
  items: PoItem[];
};

async function fetchPO(id: string): Promise<PurchaseOrder> {
  const res = await fetch(`/api/purchase-orders/${id}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`No se pudo cargar la OC (${res.status})`);
  return res.json();
}

async function receivePO(id: string, items: Array<{ productId: string; qty: number; uom: PoItem['uom'] }>) {
  const res = await fetch(`/api/purchase-orders/${id}/receive`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items }),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(txt || `Error al registrar recepción (${res.status})`);
  }
  return res.json();
}

export default function ReceivePage() {
  const params = useParams();
  // id podría venir como string | string[]
  const poId = useMemo(() => {
    const v = (params as any)?.id;
    return Array.isArray(v) ? v[0] : (v as string);
  }, [params]);

  const [po, setPo] = useState<PurchaseOrder | null>(null);
  const [recv, setRecv] = useState<Record<string, number>>({});
  const [log, setLog] = useState<string[]>([]);
  const add = (m: string) => setLog((l) => [m, ...l]);

  useEffect(() => {
    if (!poId) return;
    fetchPO(poId)
      .then((data) => {
        setPo(data);
        // inicializa cantidades a 0
        const init: Record<string, number> = {};
        data.items.forEach((it) => (init[it.productId] = 0));
        setRecv(init);
      })
      .catch((e) => add(`Error cargar OC: ${e.message}`));
  }, [poId]);

  function setQty(prodId: string, v: string) {
    const n = Math.max(0, Number(v || 0));
    setRecv((prev) => ({ ...prev, [prodId]: n }));
  }

  async function submit() {
    if (!po) return;
    try {
      const items = po.items
        .filter((it) => (recv[it.productId] ?? 0) > 0)
        .map((it) => ({
          productId: it.productId,
          qty: recv[it.productId],
          uom: it.uom,
        }));

      if (items.length === 0) {
        add('Nada para recibir');
        return;
      }

      const r = await receivePO(po.id, items);
      add(`Recepción registrada: ${JSON.stringify(r)}`);
      // Opcional: refrescar PO para ver cantidades actualizadas
      const updated = await fetchPO(po.id);
      setPo(updated);
    } catch (e: any) {
      add(`Error GRN: ${e?.message ?? e}`);
    }
  }

  if (!po) return <div className="p-6">Cargando…</div>;

  return (
    <main className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Recepción OC {poId}</h1>
        <div className="flex gap-3">
          <Link href="/pos" className="underline">
            ← Volver a Órdenes
          </Link>
          <Link href="/home" className="underline">
            ← Volver al inicio
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2 border text-left">Producto</th>
              <th className="p-2 border text-left">Ordenado</th>
              <th className="p-2 border text-left">Recibido</th>
              <th className="p-2 border text-left">Pendiente</th>
              <th className="p-2 border text-left">Recibir ahora</th>
            </tr>
          </thead>
          <tbody>
            {po.items.map((it) => {
              const pend = Math.max(0, it.qty - it.qtyReceived);
              return (
                <tr key={it.productId} className="border-t">
                  <td className="p-2 border font-mono">{it.productId}</td>
                  <td className="p-2 border">{it.qty} {it.uom}</td>
                  <td className="p-2 border">{it.qtyReceived} {it.uom}</td>
                  <td className="p-2 border">{pend} {it.uom}</td>
                  <td className="p-2 border">
                    <input
                      type="number"
                      className="border rounded px-2 py-1 w-28"
                      min={0}
                      max={pend}
                      value={recv[it.productId] ?? 0}
                      onChange={(e) => setQty(it.productId, e.target.value)}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <button
        className="inline-flex items-center px-4 py-2 rounded-xl bg-black text-white hover:opacity-90"
        onClick={submit}
      >
        Confirmar recepción
      </button>

      <section>
        <h2 className="font-semibold mb-2">Log</h2>
        <pre className="bg-black text-green-300 p-3 h-48 overflow-auto rounded">
{log.join('\n')}
        </pre>
      </section>
    </main>
  );
}
