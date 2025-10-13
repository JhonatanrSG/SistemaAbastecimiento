"use client";

import { useEffect, useMemo, useState } from "react";
import { patchJSON } from "@/lib/api";

type OrderItem = {
  dishName: string;
  qty: number;
  notes?: string | null;
};

type KitchenOrder = {
  id: string;
  table: string;              // mesa
  status: "PENDIENTE" | "EN_PREPARACION" | "LISTO";
  createdAt: string;
  items: OrderItem[];
};

// helper para agrupar
function groupByStatus(list: KitchenOrder[]) {
  return {
    PENDIENTE: list.filter(o => o.status === "PENDIENTE"),
    EN_PREPARACION: list.filter(o => o.status === "EN_PREPARACION"),
    LISTO: list.filter(o => o.status === "LISTO"),
  };
}

export default function KitchenBoard() {
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  // Polling ligero cada 5s
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const r = await fetch("/api/orders", { cache: "no-store" });
        if (!r.ok) throw new Error(await r.text());
        const data: KitchenOrder[] = await r.json();
        if (mounted) setOrders(data);
      } catch (e) {
        console.error(e);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();

    const id = setInterval(() => setTick(t => t + 1), 5000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [tick]);

  const groups = useMemo(() => groupByStatus(orders), [orders]);

  async function avanzar(id: string, next: KitchenOrder["status"]) {
    try {
      await patchJSON(`/api/orders/${id}`, { status: next });
      // refrescar localmente sin esperar a la próxima vuelta de polling
      setOrders(prev =>
        prev.map(o => (o.id === id ? { ...o, status: next } : o)),
      );
    } catch (e: any) {
      alert(e?.message ?? "No se pudo actualizar el estado");
    }
  }

  function siguienteEstado(status: KitchenOrder["status"]): KitchenOrder["status"] | null {
    if (status === "PENDIENTE") return "EN_PREPARACION";
    if (status === "EN_PREPARACION") return "LISTO";
    return null;
  }

  if (loading) return <p className="text-gray-500">Cargando pedidos…</p>;

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {(["PENDIENTE", "EN_PREPARACION", "LISTO"] as const).map(col => (
        <section key={col} className="rounded-xl border p-4">
          <h2 className="font-semibold mb-2">{col.replace("_", " ")}</h2>

          {groups[col].length === 0 ? (
            <p className="text-sm text-gray-500">Sin pedidos.</p>
          ) : (
            <ul className="space-y-3">
              {groups[col].map(o => {
                const next = siguienteEstado(o.status);
                return (
                  <li key={o.id} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">
                        Mesa {o.table} ·{" "}
                        <span className="text-xs text-gray-500">
                          {new Date(o.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                      {next ? (
                        <button
                          onClick={() => avanzar(o.id, next)}
                          className="text-xs px-3 py-1 rounded-lg bg-black text-white"
                          title={`Marcar como ${next}`}
                        >
                          {next}
                        </button>
                      ) : (
                        <span className="text-xs text-green-700 font-medium">✓ Entregado</span>
                      )}
                    </div>

                    <ul className="mt-2 text-sm list-disc pl-5">
                      {o.items.map((it, idx) => (
                        <li key={idx}>
                          <span className="font-medium">{it.qty}× {it.dishName}</span>
                          {it.notes ? <span className="text-gray-500"> — {it.notes}</span> : null}
                        </li>
                      ))}
                    </ul>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
