// src/app/api/goods-receipts/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';          // <- ajusta si tu client vive en otra ruta
import { getSession } from '@/lib/auth';    // <- ajusta si vive en otra ruta

type Body = {
  poId?: string | null;
  items: { productId: string; qty: number; uom?: string | null }[];
};

export async function POST(req: Request) {
  // 0) Auth
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  // 1) Body
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const poId = body.poId ?? null;
  const items = Array.isArray(body.items) ? body.items : [];

  if (items.length === 0) {
    return NextResponse.json({ error: 'Sin ítems para recibir' }, { status: 400 });
  }

  // 2) Transacción: crear GRN + sumar stock + movimientos + actualizar PO items (si aplica)
  const result = await prisma.$transaction(async (tx) => {
    // 2.1) Crear GRN con items
    const grn = await tx.goodsReceipt.create({
      data: {
        poId,
        createdById: session.id ?? null,
        items: {
          create: items.map((i) => ({
            productId: i.productId,
            qty: i.qty,
            uom: i.uom ?? null,
          })),
        },
      },
      include: { items: true }, // <- NECESARIO para que el tipo tenga `items`
    });

    // 2.2) Sumar inventario y registrar movimiento
    for (const it of grn.items) {
      // Stock: productId es único -> update directo
      await tx.stock.update({
        where: { productId: it.productId },
        data: { qty: { increment: it.qty } },
      });

      // Movimiento de stock
      await tx.stockMovement.create({
        data: {
          productId: it.productId,
          change: it.qty,
          reason: poId ? `GRN PO ${poId}` : 'GRN manual',
          // orderId: null, // si un día quieres ligar a una orden
        },
      });

      // 2.3) Si viene de una OC, acumular qtyReceived
      if (poId) {
        await tx.purchaseOrderItem.updateMany({
          where: { poId, productId: it.productId },
          data: { qtyReceived: { increment: it.qty } },
        });
      }
    }

    return grn;
  });

  return NextResponse.json({ ok: true, grn: result });
}
