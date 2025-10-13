// src/app/api/orders/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { OrderStatus } from '@prisma/client';

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const id = params.id;
  if (!id) return NextResponse.json({ error: 'Falta id' }, { status: 400 });

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

  // Avance simple: PENDIENTE -> EN_PREPARACION -> LISTO
  let next: OrderStatus;
  switch (order.status) {
    case OrderStatus.PENDIENTE:
      next = OrderStatus.EN_PREPARACION;
      break;
    case OrderStatus.EN_PREPARACION:
      next = OrderStatus.LISTO;
      break;
    default:
      next = order.status;
  }

  await prisma.order.update({
    where: { id },
    data: { status: next },
  });

  return NextResponse.json({ ok: true, next });
}
