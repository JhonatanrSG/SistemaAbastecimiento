// src/app/(web)/layout.tsx
import React from 'react';
import Link from 'next/link';
import { getSession, type Role } from '@/lib/auth';

type MenuItem = { href: string; label: string };

const MENU_WEB: Record<Role, MenuItem[]> = {
  ADMIN: [
    { href: '/catalog', label: 'Catálogo' },
    { href: '/suppliers', label: 'Proveedores' },
    { href: '/requests', label: 'Solicitudes' },
    { href: '/rfqs', label: 'RFQs' },
    { href: '/inventory', label: 'Inventario' },
    { href: '/pos', label: 'Órdenes de Compra' },
    { href: '/kitchen', label: 'Cocina' },
  ],
  PROC: [
    { href: '/rfqs', label: 'RFQs' },
    { href: '/pos', label: 'Órdenes de Compra' },
  ],
  INVENTORY: [{ href: '/inventory', label: 'Inventario' }],
  WAITER: [{ href: '/catalog', label: 'Catálogo' }],
  CHEF: [{ href: '/kitchen', label: 'Cocina' }],
};

export default async function WebLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 👇 AHORA se espera la promesa
  const session = await getSession();
  const role: Role | null = session?.role ?? null;
  const items: MenuItem[] = role ? MENU_WEB[role] : [];

  return (
    <div className="min-h-dvh">
      <header className="border-b px-6 py-3 flex gap-4 items-center">
        <Link href="/home" className="font-semibold">
          Admin Web
        </Link>
        <nav className="flex gap-3 text-sm">
          {items.map((i) => (
            <Link key={i.href} href={i.href} className="hover:underline">
              {i.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto text-sm text-gray-600">
          {session?.name ?? ''}
        </div>
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}
