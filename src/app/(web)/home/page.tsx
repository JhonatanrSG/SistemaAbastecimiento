// src/app/(web)/home/page.tsx
import Link from 'next/link';
import { getSession, type Role } from '@/lib/auth';

type MenuItem = { href: string; label: string };

const MENU_WEB: Record<Role, MenuItem[]> = {
  ADMIN: [
    { href: '/catalog', label: 'Catálogo' },
    { href: '/pos', label: 'POS' },
    { href: '/orders', label: 'Pedidos' },
    { href: '/kitchen', label: 'Cocina' },
    { href: '/suppliers', label: 'Proveedores' },
  ],
  CHEF: [
    { href: '/kitchen', label: 'Cocina' },
    { href: '/orders', label: 'Pedidos' },
  ],
  INVENTORY: [
    { href: '/catalog', label: 'Catálogo' },
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
  ],
};

export default async function HomePage() {
  const session = await getSession();
  const role: Role | null = session?.role ?? null;
  const items: MenuItem[] = role ? MENU_WEB[role] : [];

  return (
    <div className="max-w-4xl">
      <h1 className="text-4xl font-bold">Sistema de Abastecimiento</h1>
      <p className="mt-2 text-gray-600">
        Bienvenido{role ? `, ${role === 'WAITER' ? 'Mesero' : role}` : ''}.
      </p>

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map((i) => (
          <Link
            key={i.href}
            href={i.href}
            className="border rounded-xl p-5 hover:shadow transition"
          >
            {i.label}
          </Link>
        ))}
        {items.length === 0 && (
          <div className="text-gray-500">
            Inicia sesión para ver tus módulos.
          </div>
        )}
      </div>
    </div>
  );
}
