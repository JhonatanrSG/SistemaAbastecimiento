// src/app/(web)/layout.tsx
import Link from 'next/link';
import React from 'react';
import { getSession, type Role } from '@/lib/auth';

type MenuItem = { href: string; label: string };

// Menú por rol (nota: Catálogo → /dishes; Registrar plato → /dishes/new)
const MENU_WEB: Record<Role, MenuItem[]> = {
  ADMIN: [
    { href: '/dishes', label: 'Catálogo' },
    { href: '/dishes/new', label: 'Registrar plato' },
    { href: '/pos', label: 'POS' },
    { href: '/orders', label: 'Pedidos' },
    { href: '/kitchen', label: 'Cocina' },
    { href: '/suppliers', label: 'Proveedores' },
  ],
  CHEF: [
    { href: '/kitchen', label: 'Cocina' },
    { href: '/dishes', label: 'Catálogo' },
    { href: '/dishes/new', label: 'Registrar plato' },
    { href: '/orders', label: 'Pedidos' },
  ],
  INVENTORY: [
    { href: '/dishes', label: 'Catálogo' },
    { href: '/goods-receipts', label: 'Recepciones' },
  ],
  PROC: [
    { href: '/requests', label: 'Solicitudes' },
    { href: '/rfqs', label: 'RFQs' },
    { href: '/purchase-orders', label: 'Ordenes de Compra' },
  ],
  WAITER: [
    { href: '/pos', label: 'POS' },
    { href: '/orders', label: 'Pedidos' },
    { href: '/dishes', label: 'Catálogo' },
  ],
};

export default async function WebLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  const role: Role | null = session?.role ?? null;
  const items: MenuItem[] = role ? MENU_WEB[role] : [];

  return (
    <div className="min-h-dvh">
      <header className="border-b px-6 py-3 flex items-center justify-between">
        <Link href="/home" className="font-semibold">Admin Web</Link>
        <nav className="flex gap-4 text-sm">
          {items.map((i) => (
            <Link key={i.href} href={i.href} className="hover:underline">
              {i.label}
            </Link>
          ))}
        </nav>
        <div className="text-sm text-gray-600">{role ?? 'Invitado'}</div>
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}
