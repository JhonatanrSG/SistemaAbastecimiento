'use client';
import { useEffect, useState } from 'react';

type LowRow = { productId: string; productName: string; qty: number; capacity: number; percent: number };

export default function LowInventoryPage() {
  const [rows, setRows] = useState<LowRow[]>([]);
  const [err, setErr] = useState<string| null>(null);

  useEffect(() => {
    fetch('/api/inventory/low')
      .then(r => r.json())
      .then(setRows)
      .catch(e => setErr(String(e)));
  }, []);

  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-xl font-bold mb-4">Alertas de Inventario (≤ 25%)</h1>
      {err && <p className="text-red-600">{err}</p>}
      {rows.length === 0 ? (
        <p>No hay alertas 🎉</p>
      ) : (
        <div className="space-y-3">
          {rows.map(r => (
            <div key={r.productId} className="border rounded p-3">
              <div className="font-medium">{r.productName}</div>
              <div>{r.qty} / {r.capacity} ({r.percent.toFixed(0)}%)</div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
