'use client';

import { useState } from 'react';
import { useCart } from '@/lib/cart';

export default function AddToCartButton(props: { id: string; name: string; unit?: string | null }) {
  const { add } = useCart();
  const [qty, setQty] = useState(1);

  return (
    <div className="flex items-center gap-2 mt-2">
      <input
        type="number"
        min={1}
        value={qty}
        onChange={(e) => setQty(Math.max(1, Number(e.target.value || 1)))}
        className="w-20 border rounded px-2 py-1"
      />
      <button
        onClick={() => add({ productId: props.id, name: props.name, unit: props.unit }, qty)}
        className="px-3 py-1 rounded bg-black text-white hover:opacity-90"
      >
        Agregar
      </button>
    </div>
  );
}
