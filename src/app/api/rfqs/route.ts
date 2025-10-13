// src/app/api/rfqs/route.ts
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { RfqFacade } from '@/core/services/RfqFacade';

function sanitizeId(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const first = v.trim().split(/\s+/)[0]; // si vienen 2 ids pegados, toma el primero
  return first.length ? first : null;
}

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const requestId = sp.get('requestId') ?? undefined;
  const supplierId = sp.get('supplierId') ?? undefined;

  const list = await prisma.rfq.findMany({
    where: {
      ...(requestId ? { requestId } : {}),
      ...(supplierId ? { supplierId } : {}),
    },
    include: {
      supplier: true,
      items: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(list);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const requestId  = sanitizeId(body?.requestId);
    const supplierId = sanitizeId(body?.supplierId);
    const dueStr     = typeof body?.dueDate === 'string' ? body.dueDate.trim() : '';

    if (!requestId || !supplierId || !dueStr) {
      return NextResponse.json(
        { error: 'requestId/supplierId/dueDate deben ser string no vacíos' },
        { status: 400 }
      );
    }
    const due = new Date(dueStr);
    if (Number.isNaN(due.getTime())) {
      return NextResponse.json({ error: 'dueDate inválida' }, { status: 400 });
    }

    const created = await new RfqFacade().createRfq({
      requestId,
      supplierId,
      dueDate: due.toISOString(),
    });

    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    // Muestra mensaje claro si es P2002 u otros
    const msg = e?.code === 'P2002'
      ? 'Ya existe una RFQ para ese (requestId, supplierId)'
      : (e?.message ?? 'Error');
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
