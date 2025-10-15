'use client';

import { useState } from 'react';

export default function DishActionsClient({
  id,
  currentPriceCents,
}: {
  id: string;
  currentPriceCents: number;
}) {
  const [price, setPrice] = useState(
    (currentPriceCents / 100).toFixed(2)
  );
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const actionCls =
    'inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs hover:bg-neutral-50';

  async function save() {
    const cents = Math.round((parseFloat(price) || 0) * 100);
    setSaving(true);
    try {
      const res = await fetch(`/api/dishes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceCents: cents }),
      });
      if (!res.ok) throw new Error();
      location.reload();
    } catch {
      alert('No se pudo actualizar el precio');
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!confirm('¿Eliminar este plato?')) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/dishes/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      location.reload();
    } catch {
      alert('No se pudo eliminar');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="mt-auto flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <label className="text-xs text-neutral-600">Precio:</label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-24 rounded-md border px-2 py-1 text-sm"
        />
        <button
          type="button"
          className={actionCls}
          onClick={save}
          disabled={saving}
        >
          {saving ? 'Guardando…' : 'Guardar'}
        </button>
      </div>

      <button
        type="button"
        className={`${actionCls} text-red-600 border-red-300`}
        onClick={remove}
        disabled={deleting}
      >
        {deleting ? 'Eliminando…' : 'Eliminar'}
      </button>
    </div>
  );
}
