// src/app/api/dishes/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  // Ajusta el select si quieres más campos
  const dishes = await prisma.dish.findMany({
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      priceCents: true,
      category: { select: { name: true } },
    },
  });

  // Normalizamos para el front
  const rows = dishes.map(d => ({
    id: d.id,
    name: d.name,
    priceCents: d.priceCents,
    category: d.category?.name ?? null,
  }));

  return NextResponse.json(rows);
}
