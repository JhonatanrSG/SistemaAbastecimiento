'use client';

import { useEffect, useMemo, useState } from 'react';

type OrderItem = {
  id: string;
  dishName?: string;        // si tu API no lo trae, pinta dishId
  dishId?: string;
  qty: number;
  note?: string | null;
};

type Order = {
  id: string;
  createdAt: string;
  tableNumber: string;
  waiterName: string;
  status: 'PENDIENTE' | 'EN_PREPARACION' | 'LISTO';
  items: OrderItem[];
};

async function fetchOrders(): Promise<Order[]> {
  const res = await fetch('/api/orders', { cache: 'no-store' });
  if (!res.ok) throw new Error('No se pudieron cargar los pedidos');
  const data = await res.json();
  // normaliza (array directo o {rows})
  return Array.isArray(data) ? data : Array.isArray(data?.rows) ? data.rows : [];
}

async function patchStatus(id: string, status: Order['status']) {
  const res = await fetch(`/api/orders/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`PATCH /api/orders/${id} -> ${res.status} ${txt}`);
  }
  return res.json();
}

function timeHHMM(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '-';
  }
}

export default function KitchenPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  // carga inicial + polling cada 6s
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = await fetchOrders();
        if (mounted) {
          setOrders(data);
          setError(null);
        }
      } catch (e: any) {
        if (mounted) setError(e.message ?? 'Error cargando pedidos');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    const t = setInterval(load, 6000);
    return () => {
      mounted = false;
      clearInterval(t);
    };
  }, []);

  // Optimistic update helper
  const updateLocalStatus = (id: string, status: Order['status']) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
  };

  const onAdvance = async (o: Order) => {
    const next =
      o.status === 'PENDIENTE'
        ? 'EN_PREPARACION'
        : o.status === 'EN_PREPARACION'
        ? 'LISTO'
        : 'LISTO';

    const backup = orders;
    try {
      updateLocalStatus(o.id, next);
      await patchStatus(o.id, next);
    } catch (e: any) {
      // revertir si falla
      setOrders(backup);
      alert(e.message ?? 'No se pudo actualizar el estado');
    }
  };

  const onBack = async (o: Order) => {
    const prev =
      o.status === 'LISTO'
        ? 'EN_PREPARACION'
        : o.status === 'EN_PREPARACION'
        ? 'PENDIENTE'
        : 'PENDIENTE';

    const backup = orders;
    try {
      updateLocalStatus(o.id, prev);
      await patchStatus(o.id, prev);
    } catch (e: any) {
      setOrders(backup);
      alert(e.message ?? 'No se pudo actualizar el estado');
    }
  };

  const pendientes   = useMemo(() => orders.filter(o => o.status === 'PENDIENTE'), [orders]);
  const enPrep       = useMemo(() => orders.filter(o => o.status === 'EN_PREPARACION'), [orders]);
  const listos       = useMemo(() => orders.filter(o => o.status === 'LISTO'), [orders]);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Cocina</h1>
        <button
          onClick={async () => {
            setLoading(true);
            try {
              const data = await fetchOrders();
              setOrders(data);
              setError(null);
            } catch (e: any) {
              setError(e.message ?? 'Error recargando');
            } finally {
              setLoading(false);
            }
          }}
          className="px-3 py-1.5 rounded border"
        >
          {loading ? 'Cargando…' : 'Refrescar'}
        </button>
      </div>

      {error && (
        <div className="rounded border border-red-300 bg-red-50 text-red-700 p-3 text-sm">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {/* Columna: Pendientes */}
        <Column
          title="Pendientes"
          badge={pendientes.length}
          color="bg-yellow-100"
          orders={pendientes}
          onAdvance={onAdvance}
          onBack={onBack}
          actionLabel="A preparación"
          backEnabled={false}
        />

        {/* Columna: En preparación */}
        <Column
          title="En preparación"
          badge={enPrep.length}
          color="bg-blue-100"
          orders={enPrep}
          onAdvance={onAdvance}
          onBack={onBack}
          actionLabel="Marcar listo"
          backEnabled
        />

        {/* Columna: Listos */}
        <Column
          title="Listos"
          badge={listos.length}
          color="bg-emerald-100"
          orders={listos}
          onAdvance={() => {}}
          onBack={onBack}
          actionLabel=""
          backEnabled
          disableAdvance
        />
      </div>
    </div>
  );
}

/** Subcomponent: columna con tarjetas de pedidos */
function Column(props: {
  title: string;
  badge: number;
  color: string;
  orders: Order[];
  actionLabel: string;
  onAdvance: (o: Order) => void;
  onBack: (o: Order) => void;
  backEnabled?: boolean;
  disableAdvance?: boolean;
}) {
  const { title, badge, color, orders, onAdvance, onBack, actionLabel, backEnabled, disableAdvance } = props;
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">{title}</h2>
        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100">{badge}</span>
      </div>

      <div className={`rounded-xl border ${color} p-3 min-h-[140px]`}>
        {orders.length === 0 ? (
          <p className="text-sm text-gray-500">Sin pedidos.</p>
        ) : (
          <div className="space-y-3">
            {orders.map((o) => (
              <div key={o.id} className="rounded-lg border bg-white p-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="font-medium">
                    Mesa <span className="font-bold">{o.tableNumber}</span>
                    <span className="text-gray-400 text-xs ml-2">{timeHHMM(o.createdAt)}</span>
                  </div>
                  <div className="text-xs text-gray-500">Mesero: {o.waiterName || '-'}</div>
                </div>

                <ul className="mt-2 text-sm space-y-1">
                  {o.items.map((it) => (
                    <li key={it.id} className="flex justify-between">
                      <span>
                        {it.qty}× {it.dishName ?? it.dishId}
                        {it.note ? <span className="ml-1 text-gray-500 italic">({it.note})</span> : null}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="mt-3 flex gap-2">
                  {backEnabled && (
                    <button
                      onClick={() => onBack(o)}
                      className="text-xs px-2 py-1 rounded border hover:bg-gray-50"
                      title="Volver un estado"
                    >
                      ← Atrás
                    </button>
                  )}
                  {!disableAdvance && (
                    <button
                      onClick={() => onAdvance(o)}
                      className="text-xs px-2 py-1 rounded border bg-black text-white hover:opacity-90"
                    >
                      {actionLabel}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
