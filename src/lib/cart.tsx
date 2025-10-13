'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type CartItem = {
  productId: string;
  name: string;
  unit?: string | null;
  qty: number;
};

type CartCtx = {
  items: CartItem[];
  totalItems: number;
  add: (p: { productId: string; name: string; unit?: string | null }, qty?: number) => void;
  setQty: (productId: string, qty: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartCtx | null>(null);
const LS_KEY = 'cart-v1';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  // cargar de localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
  }, []);
  // persistir
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(items));
    } catch {}
  }, [items]);

  const api = useMemo<CartCtx>(() => ({
    items,
    totalItems: items.reduce((acc, it) => acc + it.qty, 0),
    add: (p, qty = 1) => {
      setItems(prev => {
        const i = prev.findIndex(x => x.productId === p.productId);
        if (i >= 0) {
          const next = [...prev];
          next[i] = { ...next[i], qty: next[i].qty + qty };
          return next;
        }
        return [...prev, { productId: p.productId, name: p.name, unit: p.unit, qty }];
      });
    },
    setQty: (productId, qty) => {
      setItems(prev => prev.map(it => it.productId === productId ? { ...it, qty } : it));
    },
    remove: (productId) => {
      setItems(prev => prev.filter(it => it.productId !== productId));
    },
    clear: () => setItems([]),
  }), [items]);

  return <CartContext.Provider value={api}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart debe usarse dentro de <CartProvider>');
  return ctx;
}
