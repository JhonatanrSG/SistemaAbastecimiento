// src/app/catalog/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { getJSON, postJSON } from '@/lib/api';
import AddToCartButton from '@/components/AddToCartButton';
import { CartProvider, useCart } from '@/lib/cart';
import { useRouter } from 'next/navigation';
import NavBackHome from '@/components/NavBackHome';

type UOM = 'Kg' | 'Lb' | 'L' | 'Unidad';

type Product = {
  id: string;
  name: string;
  unit?: UOM | null;   // algunos endpoints lo exponen como "unit"
  uom?: UOM | null;    // por si llega como "uom"
};

function CatalogInner() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { items, setQty, remove, clear, totalItems } = useCart();
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const data = await getJSON<Product[]>('/api/products');
        setProducts(data);
      } catch (e) {
        console.error(e);
        alert('Error cargando productos');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function enviarSolicitud() {
  try {
    // Construye el payload a partir del carrito
    const payloadItems = items
      .map((it) => ({
        productId: it.productId,
        qty: it.qty,
        // Si el producto no trae unidad, usa "Unidad"
        uom: (it.unit as 'Kg' | 'Lb' | 'L' | 'Unidad') ?? 'Unidad',
      }))
      .filter((it) => it.qty > 0);

    if (payloadItems.length === 0) {
      alert('El carrito está vacío.');
      return;
    }

    // Usa valores por defecto si aún no tienes sesión ligada aquí
    const requester = 'admin@demo.com';
    const branch = 'Principal';

    await postJSON('/api/requests', {
      branch,
      requester,
      items: payloadItems,
    });

    alert('Solicitud creada ✅');
    clear();               // limpia el carrito si quieres
    router.push('/requests');
  } catch (err) {
    console.error('Error creando solicitud:', err);
    // ✅ CORRECCIÓN: parentizamos para no mezclar ?? con ||
    const msg =
      ((err as any)?.message ?? (typeof err === 'string' ? err : '')) ||
      'No se pudo crear la solicitud';
    alert(msg);
  }
}

  return (
    <div className="p-8">
      <NavBackHome />
      <div className="flex items-start gap-8">
        {/* Catálogo */}
        <div className="flex-1">
          <h1 className="text-2xl font-bold mb-4">Catálogo</h1>
          {loading ? (
            <p className="text-gray-500">Cargando...</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((p) => {
                const unit = p.unit ?? p.uom ?? undefined;
                return (
                  <div key={p.id} className="border rounded-2xl p-4 shadow-sm">
                    <div className="font-semibold">{p.name}</div>
                    {unit ? (
                      <div className="text-sm text-gray-500">Unidad: {unit}</div>
                    ) : null}
                    <AddToCartButton id={p.id} name={p.name} unit={unit} />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Carrito */}
        <aside className="w-full max-w-sm sticky top-6 border rounded-2xl p-4 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold">Carrito</h2>
            <button onClick={clear} className="text-xs text-red-600 hover:underline">
              Vaciar
            </button>
          </div>

          {items.length === 0 ? (
            <p className="text-gray-500">Sin productos.</p>
          ) : (
            <ul className="space-y-3">
              {items.map((it) => (
                <li key={it.productId} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{it.name}</div>
                    {it.unit ? (
                      <div className="text-xs text-gray-500">{it.unit}</div>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      className="w-16 border rounded px-2 py-1"
                      min={1}
                      value={it.qty}
                      onChange={(e) =>
                        setQty(it.productId, Math.max(1, Number(e.target.value || 1)))
                      }
                    />
                    <button
                      onClick={() => remove(it.productId)}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Quitar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <button
            onClick={enviarSolicitud}
            disabled={items.length === 0}
            className="mt-4 w-full px-4 py-2 rounded-xl bg-black text-white disabled:opacity-40"
          >
            Enviar solicitud {totalItems > 0 ? `(${totalItems})` : ''}
          </button>
        </aside>
      </div>
    </div>
  );
}

export default function CatalogPage() {
  return (
    <CartProvider>
      <CatalogInner />
    </CartProvider>
  );
}
