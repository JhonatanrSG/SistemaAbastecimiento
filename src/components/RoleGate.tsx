// src/components/RoleGate.tsx
'use client';

import { useEffect, useState } from 'react';
import type { Role } from '@/lib/auth';

export default function RoleGate({
  allow,
  children,
  roleFromServer, // opcional
}: {
  allow: Role[];
  children: React.ReactNode;
  roleFromServer?: Role | null;
}) {
  // undefined = aún no sabemos; null = sin rol
  const [role, setRole] = useState<Role | null | undefined>(roleFromServer);

  useEffect(() => {
    // Si el server ya nos dio el rol (incluido null), no hacemos fetch
    if (roleFromServer !== undefined) return;

    let alive = true;
    (async () => {
      try {
        const res = await fetch('/api/me', { cache: 'no-store' });
        const data = await res.json().catch(() => ({}));
        if (alive) setRole((data?.role ?? null) as Role | null);
      } catch {
        if (alive) setRole(null);
      }
    })();

    return () => {
      alive = false;
    };
  }, [roleFromServer]);

  if (role === undefined) return <div className="text-sm text-gray-500">Cargando rol…</div>;
  if (!allow.includes(role as Role)) return <div className="text-sm text-red-600">No autorizado.</div>;

  return <>{children}</>;
}
