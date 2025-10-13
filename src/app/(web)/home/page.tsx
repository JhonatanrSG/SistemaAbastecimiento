// src/app/(web)/home/page.tsx
import Link from 'next/link';
import { getSession, type Role } from '@/lib/auth';

const MODULES: Record<Role, { href: string; label: string }[]> = {
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
  CHEF: [{ href: '/kitchen', label: 'Cocina' }, { href: '/catalog', label: 'Catálogo' }],
};

export default async function HomePage() {
  const session = await getSession();            // 👈 importante: await
  const role = session?.role as Role | undefined;
  const items = role ? MODULES[role] : [];

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold mb-3">Sistema de Abastecimiento</h1>

      {!session && (
        <p className="text-gray-600">
          No has iniciado sesión. <Link href="/login" className="underline">Inicia aquí</Link> para ver tus módulos.
        </p>
      )}

      {session && (
        <>
          <p className="text-gray-600 mb-5">
            Bienvenido, <span className="font-medium">{session.name ?? session.email}</span>.
          </p>

          {items.length === 0 ? (
            <p className="text-gray-600">No hay módulos para tu rol.</p>
          ) : (
            <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {items.map((m) => (
                <li key={m.href} className="border rounded-xl p-4 hover:bg-gray-50">
                  <Link href={m.href} className="font-medium">{m.label}</Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </main>
  );
}
