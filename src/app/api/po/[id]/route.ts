// src/app/api/po/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;

  const po = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: { items: true, supplier: true, request: true },
  });

  if (!po) {
    return NextResponse.json({ error: 'PO no existe' }, { status: 404 });
  }

  return NextResponse.json(po);
}
