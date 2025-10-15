// src/app/api/products/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const rows = await prisma.product.findMany({
    orderBy: [{ name: 'asc' }],
    include: { category: { select: { id: true, name: true } } },
  });
  return NextResponse.json(rows);
}
