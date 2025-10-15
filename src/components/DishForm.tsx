// src/components/DishForm.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';

type Category = { id: string; name: string };
type Product  = { id: string; name: string; category?: { id: string; name: string } | null };

type RecipeItem = {
  productId: string;
  qty: number;
  uom: string;
};

export default function DishForm() {
  const [name, setName] = useState('');
  const [priceCents, setPriceCents] = useState<number>(0);
  const [categoryId, setCategoryId] = useState<string>('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [recipe, setRecipe] = useState<RecipeItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/categories').then(r => r.json()).catch(() => []),
      fetch('/api/products').then(r => r.json()).catch(() => []),
    ]).then(([cats, prods]) => {
      setCategories(Array.isArray(cats) ? cats : []);
      setProducts(Array.isArray(prods) ? prods : []);
    });
  }, []);

  const productsByName = useMemo(
    () => products.slice().sort((a, b) => a.name.localeCompare(b.name)),
    [products]
  );

  const addLine = () => setRecipe((cur) => [...cur, { productId: '', qty: 1, uom: 'Unidad' }]);
  const removeLine = (idx: number) => setRecipe((cur) => cur.filter((_, i) => i !== idx));
  const changeLine = (idx: number, patch: Partial<RecipeItem>) =>
    setRecipe((cur) => cur.map((r, i) => (i === idx ? { ...r, ...patch } : r)));

  const submit = async () => {
    if (!name.trim()) return alert('Nombre requerido');
    if (!categoryId) return alert('Categoría requerida');
    if (recipe.length === 0) return alert('Agrega al menos un ingrediente');

    setLoading(true);
    try {
      const res = await fetch('/api/dishes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          categoryId,
          priceCents: Number(priceCents) || 0,
          recipe: recipe.map(r => ({ productId: r.productId, qty: Number(r.qty), uom: r.uom || 'Unidad' })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Error al crear');

      alert('Plato creado');
      window.location.href = '/dishes';
    } catch (e: any) {
      alert(e.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="space-y-1">
          <span className="text-sm">Nombre</span>
          <input
            className="w-full rounded border p-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre del plato"
          />
        </label>

        <label className="space-y-1">
          <span className="text-sm">Precio (centavos)</span>
          <input
            className="w-full rounded border p-2"
            type="number"
            value={priceCents}
            onChange={(e) => setPriceCents(Number(e.target.value))}
            placeholder="25000"
          />
        </label>

        <label className="space-y-1 md:col-span-2">
          <span className="text-sm">Categoría</span>
          <select
            className="w-full rounded border p-2"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">Seleccione…</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Ingredientes</h2>
          <button onClick={addLine} className="px-3 py-1 rounded border">+ Agregar</button>
        </div>

        {recipe.length === 0 && <p className="text-sm text-gray-500">Sin ingredientes aún.</p>}

        <div className="space-y-2">
          {recipe.map((r, i) => (
            <div key={i} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
              <select
                className="md:col-span-6 rounded border p-2"
                value={r.productId}
                onChange={(e) => changeLine(i, { productId: e.target.value })}
              >
                <option value="">Producto…</option>
                {productsByName.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.category?.name ? `(${p.category.name})` : ''}
                  </option>
                ))}
              </select>

              <input
                className="md:col-span-2 rounded border p-2"
                type="number"
                min={0}
                step="0.01"
                value={r.qty}
                onChange={(e) => changeLine(i, { qty: Number(e.target.value) })}
                placeholder="Cantidad"
              />

              <input
                className="md:col-span-3 rounded border p-2"
                value={r.uom}
                onChange={(e) => changeLine(i, { uom: e.target.value })}
                placeholder="Unidad (Kg, L, Unidad…)"
              />

              <button
                onClick={() => removeLine(i)}
                className="md:col-span-1 px-3 py-2 rounded border"
                title="Quitar"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <button
          onClick={submit}
          disabled={loading}
          className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
        >
          {loading ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </div>
  );
}
