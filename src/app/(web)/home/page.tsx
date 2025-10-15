// src/app/(web)/home/page.tsx
import Link from 'next/link';
import { getSession, type Role } from '@/lib/auth';

type Card = { href: string; label: string; roles: Role[] };

const CARDS: Card[] = [
  { href: '/pos',          label: 'POS',            roles: ['ADMIN','WAITER'] },
  { href: '/orders',       label: 'Pedidos',        roles: ['ADMIN','WAITER','CHEF'] },
  { href: '/kitchen',      label: 'Cocina',         roles: ['ADMIN','CHEF'] },
  { href: '/dishes',       label: 'Catálogo',       roles: ['ADMIN','CHEF','WAITER','INVENTORY'] },
  { href: '/dishes/new',   label: 'Registrar plato',roles: ['ADMIN','CHEF'] },
];

export default async function HomePage() {
  const session = await getSession();
  const role: Role | null = session?.role ?? null;

  const visible = role ? CARDS.filter(c => c.roles.includes(role)) : [];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Sistema de Abastecimiento</h1>
      <p>Bienvenido, {role ?? 'Invitado'}.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {visible.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="rounded-xl border p-6 hover:bg-gray-50 transition"
          >
            {c.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
