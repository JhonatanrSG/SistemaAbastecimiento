import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') ?? undefined;
  const rfqId = searchParams.get('rfqId') ?? undefined;

  const where: any = {};
  if (status) where.status = status;
  if (rfqId) where.rfqId = rfqId;

  const rows = await prisma.purchaseOrder.findMany({
    where,
    include: { items: true, supplier: true, rfq: true },
    orderBy: { createdAt: 'desc' }
  });

  return NextResponse.json({ value: rows, Count: rows.length });
}
