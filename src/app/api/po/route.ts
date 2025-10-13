import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { PoFacade } from '@/core/services/PoFacade';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rfqId = body?.rfqId;
    if (!rfqId || typeof rfqId !== 'string') {
      return NextResponse.json({ error: 'rfqId requerido' }, { status: 400 });
    }
    const created = await new PoFacade().createFromRfq(rfqId);
    return NextResponse.json(created, { status: created.duplicate ? 200 : 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Error' }, { status: 400 });
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const status = url.searchParams.get('status') as any | null;
  const where = status ? { status } : {};
  const pos = await prisma.purchaseOrder.findMany({
    where,
    include: { supplier: true },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(pos);
}
