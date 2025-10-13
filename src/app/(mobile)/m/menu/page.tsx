'use client';
import { useEffect, useState } from 'react';
import { getJSON, postJSON } from '@/lib/api';

type Dish = { id:string; name:string; priceCents:number };

export default function MenuPage() {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [cart, setCart] = useState<Record<string, number>>({});

  useEffect(() => { getJSON<Dish[]>('/api/dishes').then(setDishes); }, []);
  const add = (id: string) => setCart(c => ({...c, [id]: (c[id] ?? 0)+1 }));
  const remove = (id: string) => setCart(c => { const n={...c}; delete n[id]; return n; });

  async function placeOrder() {
    const items = Object.entries(cart).map(([dishId, qty]) => ({ dishId, qty }));
    if (items.length === 0) return alert('Carrito vacío');
    try {
      await postJSON('/api/orders', { table:'12', items });
      setCart({});
      alert('Pedido enviado');
    } catch (e:any) {
      alert(e?.message ?? 'No se pudo enviar el pedido');
    }
  }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-3">Menú</h1>
      <ul className="space-y-2 mb-8">
        {dishes.map(d => (
          <li key={d.id} className="border rounded-xl p-3 flex items-center justify-between">
            <div>
              <div className="font-medium">{d.name}</div>
              <div className="text-xs text-gray-500">${(d.priceCents/100).toFixed(2)}</div>
            </div>
            <button className="px-3 py-1 rounded-lg bg-black text-white" onClick={() => add(d.id)}>Agregar</button>
          </li>
        ))}
      </ul>

      <div className="border rounded-xl p-3">
        <div className="font-semibold mb-2">Carrito</div>
        {Object.keys(cart).length === 0 ? <p className="text-sm text-gray-500">Vacío</p> : (
          <ul className="space-y-2">
            {Object.entries(cart).map(([dishId, qty]) => (
              <li key={dishId} className="flex items-center justify-between">
                <span>{dishId}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm">x{qty}</span>
                  <button className="text-xs text-red-600" onClick={() => remove(dishId)}>Quitar</button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <button className="mt-3 w-full px-4 py-2 rounded-lg bg-black text-white disabled:opacity-40"
          disabled={Object.keys(cart).length === 0}
          onClick={placeOrder}>
          Enviar pedido
        </button>
      </div>
    </div>
  );
}
