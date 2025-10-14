'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { getJSON, postJSON } from '@/lib/api';

type Dish = { id: string; name: string; priceCents: number };

type CartLine = {
  dishId: string;
  name: string;
  qty: number;
  note?: string;
};

export default function PosPage() {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableNumber, setTableNumber] = useState('');
  const [waiterName, setWaiterName] = useState('');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [log, setLog] = useState<string[]>([]);

  const addLog = (m: string) => setLog((l) => [m, ...l]);

  useEffect(() => {
    (async () => {
      try {
        const data = await getJSON<Dish[]>('/api/dishes');
        setDishes(data);
      } catch (e: any) {
        addLog(`Error cargando platos: ${e.message}`);
        alert('No se pudo cargar el catálogo de platos');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function addDish(d: Dish) {
    setCart((old) => {
      const found = old.find((x) => x.dishId === d.id);
      if (found) {
        return old.map((x) =>
          x.dishId === d.id ? { ...x, qty: x.qty + 1 } : x
        );
      }
      return [...old, { dishId: d.id, name: d.name, qty: 1 }];
    });
  }

  function setQty(dishId: string, q: number) {
    setCart((old) =>
      old
        .map((x) => (x.dishId === dishId ? { ...x, qty: Math.max(1, q) } : x))
        .filter((x) => x.qty > 0)
    );
  }

  function setNote(dishId: string, note: string) {
    setCart((old) => old.map((x) => (x.dishId === dishId ? { ...x, note } : x)));
  }

  function removeLine(dishId: string) {
    setCart((old) => old.filter((x) => x.dishId !== dishId));
  }

  const totalItems = useMemo(
    () => cart.reduce((acc, it) => acc + it.qty, 0),
    [cart]
  );

  async function submitOrder() {
    try {
      if (!tableNumber.trim() || !waiterName.trim()) {
        alert('Mesa y nombre del mesero son obligatorios');
        return;
      }
      if (cart.length === 0) {
        alert('Agrega al menos un plato');
        return;
      }

      const payload = {
        tableNumber,
        waiterName,
        items: cart.map((it) => ({
          dishId: it.dishId,
          qty: it.qty,
          note: it.note || undefined,
        })),
      };

      const resp = await postJSON<{ ok: boolean; id: string }>('/api/orders', payload);
      addLog(`Pedido creado: ${resp.id}`);
      alert('Pedido enviado ✅');
      // Limpia carrito
      setCart([]);
      setTableNumber('');
      // Mantener waiterName, por comodidad; quítalo si no quieres:
      // setWaiterName('');
    } catch (e: any) {
      addLog(`Error creando pedido: ${e.message}`);
      alert('No se pudo crear el pedido');
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/home" className="text-sm underline">← Volver al inicio</Link>
        <h1 className="text-2xl font-bold">POS — Tomar pedido</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {/* Catálogo */}
        <section className="md:col-span-3 space-y-4">
          <div className="flex gap-4">
            <div>
              <label className="text-sm">Mesa</label>
              <input
                className="border rounded px-2 py-1 block"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                placeholder="Ej: A12"
              />
            </div>
            <div>
              <label className="text-sm">Mesero</label>
              <input
                className="border rounded px-2 py-1 block"
                value={waiterName}
                onChange={(e) => setWaiterName(e.target.value)}
                placeholder="Tu nombre"
              />
            </div>
          </div>

          <h2 className="font-semibold mt-2">Platos</h2>
          {loading ? (
            <p className="text-gray-500">Cargando...</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {dishes.map((d) => (
                <div key={d.id} className="border rounded-xl p-4 shadow-sm">
                  <div className="font-medium">{d.name}</div>
                  <div className="text-xs text-gray-500">
                    ${(d.priceCents / 100).toFixed(2)}
                  </div>
                  <button
                    onClick={() => addDish(d)}
                    className="mt-2 text-sm px-3 py-1 rounded bg-black text-white"
                  >
                    Agregar
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Carrito */}
        <aside className="md:col-span-2 border rounded-xl p-4 space-y-3 h-max shadow">
          <h2 className="font-semibold">Pedido</h2>
          {cart.length === 0 ? (
            <p className="text-gray-500">Sin platos.</p>
          ) : (
            <ul className="space-y-3">
              {cart.map((it) => (
                <li key={it.dishId} className="border rounded p-3">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{it.name}</div>
                    <button
                      className="text-xs text-red-600 underline"
                      onClick={() => removeLine(it.dishId)}
                    >
                      Quitar
                    </button>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-sm">Cantidad:</span>
                    <input
                      type="number"
                      min={1}
                      className="w-20 border rounded px-2 py-1"
                      value={it.qty}
                      onChange={(e) => setQty(it.dishId, Number(e.target.value || 1))}
                    />
                  </div>
                  <div className="mt-2">
                    <input
                      className="w-full border rounded px-2 py-1 text-sm"
                      placeholder="Nota (opcional)"
                      value={it.note || ''}
                      onChange={(e) => setNote(it.dishId, e.target.value)}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}

          <button
            disabled={cart.length === 0 || !tableNumber.trim() || !waiterName.trim()}
            onClick={submitOrder}
            className="w-full mt-2 px-4 py-2 rounded-xl bg-black text-white disabled:opacity-40"
          >
            Enviar pedido {totalItems ? `(${totalItems})` : ''}
          </button>
        </aside>
      </div>

      <div>
        <h3 className="font-semibold">Log</h3>
        <pre className="bg-black text-green-300 p-3 rounded max-h-48 overflow-auto">
{log.join('\n')}
        </pre>
      </div>
    </div>
  );
}
