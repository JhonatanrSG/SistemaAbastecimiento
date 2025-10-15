// src/app/api/categories/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const rows = await prisma.category.findMany({
    orderBy: [{ name: 'asc' }],
  });
  return NextResponse.json(rows);
}
