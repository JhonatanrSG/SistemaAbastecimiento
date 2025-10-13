// src/app/api/requests/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { RequestStatus } from '@prisma/client';

type Body = {
  note?: string | null;
  items: { productId: string; qty: number; uom?: string | null; note?: string | null }[];
};

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { note, items } = (await req.json()) as Body;
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'Items inválidos' }, { status: 400 });
  }

  const rfq = await prisma.request.create({
    data: {
      status: RequestStatus.PENDIENTE,
      note: note ?? null,
      createdById: session.id ?? null,
      items: {
        create: items.map((i) => ({
          productId: i.productId,
          qty: i.qty,
          uom: i.uom ?? null,
          note: i.note ?? null,
        })),
      },
    },
    select: { id: true },
  });

  // Notificación a compras (simple)
  await prisma.notification.create({
    data: {
      type: 'REQUEST_CREATED',
      message: `Nueva solicitud #${rfq.id} creada`,
    },
  });

  return NextResponse.json({ ok: true, id: rfq.id });
}
