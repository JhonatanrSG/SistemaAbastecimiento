// src/app/(web)/pos/pos.client.tsx
'use client';

import { useMemo, useState } from 'react';

type Dish = {
  id: string;
  name: string;
  priceCents: number;
  category: string | null;
};

type CartItem = { dishId: string; name: string; priceCents: number; qty: number; note?: string };

export default function PosClient({ dishes }: { dishes: Dish[] }) {
  const [tableNumber, setTableNumber] = useState('');
  const [waiterName, setWaiterName] = useState('');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string | 'ALL'>('ALL');
  const [items, setItems] = useState<CartItem[]>([]);
  const [sending, setSending] = useState(false);

  const categories = useMemo(() => {
    const set = new Set(dishes.map(d => d.category ?? 'Sin categoría'));
    return ['ALL', ...Array.from(set)];
  }, [dishes]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return dishes.filter(d =>
      (category === 'ALL' || (d.category ?? 'Sin categoría') === category) &&
      (q === '' || d.name.toLowerCase().includes(q))
    );
  }, [dishes, query, category]);

  function addDish(d: Dish) {
    setItems(curr => {
      const idx = curr.findIndex(x => x.dishId === d.id);
      if (idx >= 0) {
        const copy = [...curr];
        copy[idx] = { ...copy[idx], qty: copy[idx].qty + 1 };
        return copy;
      }
      return [...curr, { dishId: d.id, name: d.name, priceCents: d.priceCents, qty: 1 }];
    });
  }

  function decQty(id: string) {
    setItems(curr =>
      curr
        .map(it => (it.dishId === id ? { ...it, qty: Math.max(0, it.qty - 1) } : it))
        .filter(it => it.qty > 0)
    );
  }

  function incQty(id: string) {
    setItems(curr => curr.map(it => (it.dishId === id ? { ...it, qty: it.qty + 1 } : it)));
  }

  function removeItem(id: string) {
    setItems(curr => curr.filter(it => it.dishId !== id));
  }

  const totalCents = useMemo(
    () => items.reduce((acc, it) => acc + it.qty * (it.priceCents ?? 0), 0),
    [items]
  );

  async function submit() {
    try {
      if (!tableNumber) return alert('Ingresa la mesa.');
      if (items.length === 0) return alert('Agrega al menos un plato.');
      setSending(true);

      // Construimos payload para /api/orders
      const payload = {
        tableNumber,
        waiterName,
        items: items.map(it => ({ dishId: it.dishId, qty: it.qty, note: it.note ?? undefined })),
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'No se pudo crear el pedido');

      alert('¡Pedido creado!');
      // limpiar
      setItems([]);
      setTableNumber('');
      // Tip: si quieres mantener el mesero por conveniencia, no lo limpies
      // setWaiterName('');
    } catch (e: any) {
      alert(e.message || 'Error');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Columna izquierda: filtros + platos */}
      <div className="lg:col-span-2 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <label className="space-y-1 md:col-span-1">
            <span className="text-sm text-gray-600">Mesa</span>
            <input
              className="w-full border rounded px-3 py-2"
              value={tableNumber}
              onChange={e => setTableNumber(e.target.value)}
              placeholder="Ej: 12"
            />
          </label>

          <label className="space-y-1 md:col-span-2">
            <span className="text-sm text-gray-600">Mesero (opcional)</span>
            <input
              className="w-full border rounded px-3 py-2"
              value={waiterName}
              onChange={e => setWaiterName(e.target.value)}
              placeholder="Ej: Daniel"
            />
          </label>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <input
            className="border rounded px-3 py-2 flex-1 min-w-[240px]"
            placeholder="Buscar plato…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <select
            className="border rounded px-3 py-2"
            value={category}
            onChange={e => setCategory(e.target.value as any)}
          >
            {categories.map(c => (
              <option key={c} value={c}>
                {c === 'ALL' ? 'Todas las categorías' : c}
              </option>
            ))}
          </select>
        </div>

        {/* Grid de platos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(d => (
            <button
              key={d.id}
              onClick={() => addDish(d)}
              className="border rounded-lg p-4 text-left hover:bg-gray-50"
              title="Agregar al pedido"
            >
              <div className="font-semibold">{d.name}</div>
              <div className="text-xs text-gray-500">{d.category ?? 'Sin categoría'}</div>
              <div className="mt-2 text-sm">
                {(d.priceCents / 100).toLocaleString(undefined, { style: 'currency', currency: 'USD' })}
              </div>
              <div className="mt-3 inline-block text-xs px-2 py-1 border rounded">Agregar</div>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="text-sm text-gray-500">No hay platos que coincidan.</div>
          )}
        </div>
      </div>

      {/* Columna derecha: carrito */}
      <div className="space-y-4">
        <div className="text-lg font-semibold">Pedido actual</div>

        <div className="border rounded-lg divide-y">
          {items.length === 0 ? (
            <div className="p-4 text-sm text-gray-500">Aún no has agregado platos.</div>
          ) : (
            items.map(it => (
              <div key={it.dishId} className="p-3 flex items-start gap-3">
                <div className="flex-1">
                  <div className="font-medium">{it.name}</div>
                  <div className="text-xs text-gray-500">
                    {(it.priceCents / 100).toLocaleString(undefined, { style: 'currency', currency: 'USD' })}
                  </div>
                  <textarea
                    placeholder="Nota (opcional)"
                    className="mt-2 w-full border rounded px-2 py-1 text-sm"
                    value={it.note ?? ''}
                    onChange={e =>
                      setItems(curr =>
                        curr.map(x => (x.dishId === it.dishId ? { ...x, note: e.target.value } : x))
                      )
                    }
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button className="px-2 py-1 border rounded" onClick={() => decQty(it.dishId)}>-</button>
                  <div className="w-8 text-center">{it.qty}</div>
                  <button className="px-2 py-1 border rounded" onClick={() => incQty(it.dishId)}>+</button>
                </div>

                <button className="text-xs text-red-600" onClick={() => removeItem(it.dishId)}>
                  Quitar
                </button>
              </div>
            ))
          )}
        </div>

        <div className="flex justify-between text-sm">
          <div>Total</div>
          <div className="font-semibold">
            {(totalCents / 100).toLocaleString(undefined, { style: 'currency', currency: 'USD' })}
          </div>
        </div>

        <button
          onClick={submit}
          disabled={sending || !tableNumber || items.length === 0}
          className="w-full px-4 py-2 rounded bg-black text-white disabled:opacity-50"
        >
          {sending ? 'Enviando…' : 'Crear pedido'}
        </button>
      </div>
    </div>
  );
}
