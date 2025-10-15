// src/components/DishAdminActions.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

export default function DishAdminActions({
  id,
  priceCents,
}: {
  id: string;
  priceCents: number;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [price, setPrice] = useState(
    priceCents ? (priceCents / 100).toFixed(2) : ''
  );

  const save = () =>
    start(async () => {
      const normalized = price.replace(',', '.');
      const num = Number.parseFloat(normalized);
      const cents = Math.round(num * 100);

      if (!Number.isFinite(num) || cents < 0) {
        alert('Precio inválido');
        return;
      }

      const res = await fetch(`/api/dishes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceCents: cents }),
      });

      if (!res.ok) {
        const t = await res.text();
        alert(t || 'No se pudo guardar el precio');
        return;
      }

      router.refresh();
    });

  const remove = () =>
    start(async () => {
      const ok = confirm(
        '¿Eliminar este plato? Esta acción es permanente y no se puede deshacer.'
      );
      if (!ok) return;

      const res = await fetch(`/api/dishes/${id}`, { method: 'DELETE' });
      const t = await res.text();
      if (!res.ok) {
        alert(t || 'No se pudo eliminar el plato');
        return;
      }

      router.refresh();
    });

  return (
    <div className="mt-3 flex items-center gap-2">
      <label className="text-xs text-neutral-600">Precio</label>
      <input
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        placeholder="0.00"
        inputMode="decimal"
        className="w-24 rounded border px-2 py-1 text-sm"
      />
      <button
        onClick={save}
        disabled={pending}
        className="rounded bg-black px-3 py-1 text-xs font-medium text-white disabled:opacity-50"
      >
        {pending ? 'Guardando…' : 'Guardar'}
      </button>
      <button
        onClick={remove}
        disabled={pending}
        className="rounded border px-3 py-1 text-xs text-red-600 border-red-600 disabled:opacity-50"
      >
        {pending ? 'Eliminando…' : 'Eliminar'}
      </button>
    </div>
  );
}
