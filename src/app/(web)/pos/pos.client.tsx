// src/app/(web)/pos/pos.client.tsx
'use client';

import { useMemo, useState } from 'react';

type DishDto = {
  id: string;
  name: string;
  priceCents: number;
  categoryId?: string | null;
  category?: { id: string; name: string } | null;
};

type CategoryDto = { id: string; name: string };

type CartItem = {
  dishId: string;
  name: string;
  priceCents: number;
  qty: number;
  note?: string;
};

export default function PosClient({
  dishes,
  categories,
}: {
  dishes: DishDto[];
  categories: CategoryDto[];
}) {
  // --- Estado “cabecera” del pedido ---
  const [tableNumber, setTableNumber] = useState<string>('');
  const [waiterName, setWaiterName] = useState<string>('');

  // --- Filtros catálogo ---
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState<string>('ALL');

  // --- Carrito ---
  const [cart, setCart] = useState<CartItem[]>([]);
  const totalCents = useMemo(
    () => cart.reduce((acc, it) => acc + it.qty * it.priceCents, 0),
    [cart]
  );

  // --- Catálogo filtrado ---
  const filtered = useMemo(() => {
    let list = Array.isArray(dishes) ? dishes : [];
    if (selectedCat !== 'ALL') {
      list = list.filter((d) => (d.categoryId ?? d.category?.id) === selectedCat);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((d) => d.name.toLowerCase().includes(q));
    }
    return list;
  }, [dishes, search, selectedCat]);

  // --- Helpers carrito ---
  function addDish(d: DishDto) {
    setCart((prev) => {
      const idx = prev.findIndex((x) => x.dishId === d.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], qty: copy[idx].qty + 1 };
        return copy;
      }
      return [
        ...prev,
        {
          dishId: d.id,
          name: d.name,
          priceCents: d.priceCents,
          qty: 1,
          note: '',
        },
      ];
    });
  }

  function inc(dishId: string) {
    setCart((prev) =>
      prev.map((x) => (x.dishId === dishId ? { ...x, qty: x.qty + 1 } : x))
    );
  }
  function dec(dishId: string) {
    setCart((prev) =>
      prev
        .map((x) => (x.dishId === dishId ? { ...x, qty: Math.max(1, x.qty - 1) } : x))
        .filter((x) => x.qty > 0)
    );
  }
  function removeItem(dishId: string) {
    setCart((prev) => prev.filter((x) => x.dishId !== dishId));
  }
  function setNote(dishId: string, note: string) {
    setCart((prev) => prev.map((x) => (x.dishId === dishId ? { ...x, note } : x)));
  }

  // --- Enviar pedido ---
  const [submitting, setSubmitting] = useState(false);
  async function submit() {
    if (!tableNumber.trim()) {
      alert('Debes ingresar la mesa');
      return;
    }
    if (cart.length === 0) {
      alert('Agrega al menos un plato');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        tableNumber: tableNumber.trim(),
        waiterName: waiterName.trim() || undefined,
        items: cart.map((c) => ({
          dishId: c.dishId,
          qty: c.qty,
          note: c.note?.trim() || undefined,
        })),
      };
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(`Error creando pedido: ${res.status} ${txt}`);
      }
      const data = await res.json();
      // Éxito → limpiar carrito / mantener cabecera si quieres
      setCart([]);
      alert('✅ Pedido creado');
      // Opcional: navegar a /orders o refrescar
      // window.location.href = '/orders';
    } catch (e: any) {
      alert(e?.message ?? 'Error creando pedido');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_380px] gap-6">
      {/* Columna izquierda: catálogo */}
      <div className="space-y-4">
        {/* Cabecera Pedido */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-gray-600">Mesa</label>
            <input
              className="w-full mt-1 rounded border px-3 py-2"
              placeholder="Número de mesa"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm text-gray-600">Mesero (opcional)</label>
            <input
              className="w-full mt-1 rounded border px-3 py-2"
              placeholder="Nombre"
              value={waiterName}
              onChange={(e) => setWaiterName(e.target.value)}
            />
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            className="flex-1 rounded border px-3 py-2"
            placeholder="Buscar plato…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="w-full sm:w-60 rounded border px-3 py-2"
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value)}
          >
            <option value="ALL">Todas las categorías</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Tarjetas de platos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {filtered.map((d) => (
            <div key={d.id} className="rounded-lg border p-4 flex flex-col justify-between">
              <div>
                <div className="font-semibold">{d.name}</div>
                <div className="text-sm text-gray-500">
                  {d.category?.name ?? '—'}
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div className="font-medium">
                  {(d.priceCents / 100).toLocaleString('es-CO', {
                    style: 'currency',
                    currency: 'COP',
                    maximumFractionDigits: 0,
                  })}
                </div>
                <button
                  className="rounded bg-black text-white px-3 py-1"
                  onClick={() => addDish(d)}
                >
                  Agregar
                </button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full text-center text-gray-500">
              No hay platos para mostrar.
            </div>
          )}
        </div>
      </div>

      {/* Columna derecha: carrito */}
      <div className="rounded-lg border p-4 space-y-4 h-max sticky top-6">
        <h2 className="font-semibold text-lg">Pedido actual</h2>

        {cart.length === 0 && (
          <div className="text-gray-500">Aún no has agregado platos.</div>
        )}

        {cart.map((it) => (
          <div key={it.dishId} className="rounded border p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="font-medium">{it.name}</div>
              <button
                className="text-sm text-red-600"
                onClick={() => removeItem(it.dishId)}
              >
                Quitar
              </button>
            </div>

            <div className="text-sm text-gray-600">
              {(it.priceCents / 100).toLocaleString('es-CO', {
                style: 'currency',
                currency: 'COP',
                maximumFractionDigits: 0,
              })}
            </div>

            <div className="flex items-center gap-2">
              <button
                className="rounded border px-2"
                onClick={() => dec(it.dishId)}
              >
                −
              </button>
              <div className="w-8 text-center">{it.qty}</div>
              <button
                className="rounded border px-2"
                onClick={() => inc(it.dishId)}
              >
                +
              </button>
            </div>

            <textarea
              placeholder="Nota (opcional)"
              className="w-full rounded border px-2 py-1 text-sm"
              value={it.note ?? ''}
              onChange={(e) => setNote(it.dishId, e.target.value)}
            />
          </div>
        ))}

        <div className="flex items-center justify-between border-t pt-3">
          <div className="text-gray-600">Total</div>
          <div className="font-semibold">
            {(totalCents / 100).toLocaleString('es-CO', {
              style: 'currency',
              currency: 'COP',
              maximumFractionDigits: 0,
            })}
          </div>
        </div>

        <button
          className="w-full rounded bg-black text-white py-3 disabled:opacity-60"
          onClick={submit}
          disabled={submitting || cart.length === 0}
        >
          {submitting ? 'Enviando…' : 'Crear pedido'}
        </button>
      </div>
    </div>
  );
}
