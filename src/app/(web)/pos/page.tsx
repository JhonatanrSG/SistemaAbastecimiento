// src/app/(web)/pos/page.tsx
import Link from 'next/link';
import PosClient from './pos.client';
import { getJSONServer } from '@/lib/api-server';

type DishDto = {
  id: string;
  name: string;
  priceCents: number;
  categoryId?: string | null;
  category?: { id: string; name: string } | null;
};

type CategoryDto = { id: string; name: string };

export default async function PosPage() {
  // Traer platos
  const dishesData = await getJSONServer<any>('/api/dishes').catch(() => []);
  const dishes: DishDto[] = Array.isArray(dishesData)
    ? dishesData
    : (dishesData?.rows ?? []);

  // Traer categorías (si tuvieras /api/categories)
  let categories: CategoryDto[] = [];
  try {
    const cat = await getJSONServer<any>('/api/categories');
    categories = Array.isArray(cat) ? cat : (cat?.rows ?? []);
  } catch {
    // Silencioso: si no existe endpoint, el filtro igual funciona en cliente (“Todas”)
    categories = [];
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/home" className="text-sm underline">
          &lt; Volver al inicio
        </Link>
        <h1 className="text-2xl font-bold">POS – Tomar pedido</h1>
      </div>

      <PosClient dishes={dishes} categories={categories} />
    </div>
  );
}
