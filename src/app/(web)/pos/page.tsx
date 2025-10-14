// src/app/(web)/pos/page.tsx
import Link from 'next/link';
import { getJSONServer } from '@/lib/api-server';
import PosClient from './pos.client';

type Dish = {
  id: string;
  name: string;
  priceCents: number;
  category: string | null;
};

export default async function PosPage() {
  // Traemos platos de la API (sin cache para ver cambios en caliente)
  const dishes = (await getJSONServer('/api/dishes', { cache: 'no-store' } as any)) as Dish[];

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/home" className="text-sm underline">&lt; Volver al inicio</Link>
        <h1 className="text-2xl font-bold">POS – Tomar pedido</h1>
      </div>

      <PosClient dishes={Array.isArray(dishes) ? dishes : []} />
    </div>
  );
}
