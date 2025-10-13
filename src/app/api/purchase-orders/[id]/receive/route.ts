// src/app/api/purchase-orders/[id]/receive/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ReceivingFacade } from '@/core/services/ReceivingFacade';

type ReceiveItem = { productId: string; qty: number };

export async function POST(
  req: NextRequest,
  ctx: { params: { id: string } }
) {
  const { id } = ctx.params;

  // Lee y valida el body
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  if (!Array.isArray(raw)) {
    return NextResponse.json(
      { error: 'items debe ser un array' },
      { status: 400 }
    );
  }

  // Normaliza tipos
  const items: ReceiveItem[] = (raw as any[]).map((x) => ({
    productId: String(x.productId),
    qty: Number(x.qty),
  }));

  // Ejecuta recepción
  const svc = new ReceivingFacade();
  const res = await svc.receivePo(id, items);

  return NextResponse.json(res);
}
