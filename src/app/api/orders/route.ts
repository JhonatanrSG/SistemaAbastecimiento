// src/app/api/orders/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { OrderStatus } from '@prisma/client';
import { getSession } from '@/lib/auth';

type Body = {
  tableNumber: string;
  waiterName: string;
  items: { dishId: string; qty: number; note?: string | null }[];
};

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { tableNumber, waiterName, items } = (await req.json()) as Body;

  if (!tableNumber || !waiterName || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
  }

  const result = await prisma.$transaction(async (tx) => {
    // 1) Crear Orden + Items
    const order = await tx.order.create({
      data: {
        tableNumber,
        waiterName,
        status: OrderStatus.PENDIENTE,
        items: {
          create: items.map((it) => ({
            dishId: it.dishId,
            qty: it.qty,
            note: it.note ?? null,
          })),
        },
      },
      include: { items: true },
    });

    // 2) Descontar inventario según receta del plato (DishRecipe)
    for (const it of order.items) {
      const recipe = await tx.dishRecipe.findMany({
        where: { dishId: it.dishId },
        select: { productId: true, qty: true }, // qty = unidades por plato
      });

      for (const r of recipe) {
        const consume = (r.qty ?? 0) * it.qty;
        if (consume <= 0) continue;

        // Descuenta del stock
        await tx.stock.update({
          where: { productId: r.productId },
          data: { qty: { decrement: consume } },
        });

        // Guarda movimiento
        await tx.stockMovement.create({
          data: {
            productId: r.productId,
            change: -consume,
            reason: `Consumo por orden ${order.id}`,
            orderId: order.id,
          },
        });

        // 3) Alerta de stock bajo (si aplica)
        const inv = await tx.stock.findUnique({ where: { productId: r.productId } });
        if (inv && inv.capacity > 0) {
          const threshold = Math.max(1, Math.floor(inv.capacity * 0.2)); // 20% de capacidad
          if (!inv.alerted && inv.qty <= threshold) {
            await tx.notification.create({
              data: {
                type: 'LOW_STOCK',
                message: `Stock bajo. ${r.productId} actual: ${inv.qty}`,
              },
            });
            await tx.stock.update({
              where: { productId: r.productId },
              data: { alerted: true },
            });
          }
        }
      }
    }

    return order;
  });

  return NextResponse.json({ ok: true, id: result.id });
}
