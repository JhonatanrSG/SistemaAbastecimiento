// src/app/api/orders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { OrderStatus } from '@prisma/client';

// --- LISTAR PEDIDOS ---
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get('status');
    const limit = Number(searchParams.get('limit') ?? 50);

    // filtro opcional por estado (?status=PENDIENTE | EN_PREPARACION | LISTO)
    const where =
      statusParam && (statusParam in OrderStatus)
        ? { status: statusParam as OrderStatus }
        : {};

    const rows = await prisma.order.findMany({
      where,
      include: { items: { include: { dish: true } } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    // Normalizamos para el front
    const data = rows.map(r => ({
      id: r.id,
      createdAt: r.createdAt,
      tableNumber: r.tableNumber,
      waiterName: r.waiterName,
      status: r.status,
      items: r.items.map(i => ({
        id: i.id,
        dishId: i.dishId,
        dishName: i.dish.name,
        qty: i.qty,
        note: i.note,
      })),
    }));

    return NextResponse.json({ rows: data });
  } catch (e: any) {
    console.error('[GET /api/orders]', e);
    return NextResponse.json({ error: 'Error listando pedidos' }, { status: 500 });
  }
}

// --- CREAR PEDIDO (deja tu implementación de antes) ---
export async function POST(req: Request) {
  try {
    const { tableNumber, waiterName, items } = await req.json();
    if (!tableNumber || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Payload inválido' }, { status: 400 });
    }

    const waiter = waiterName?.trim() ?? '';

    const created = await prisma.$transaction(async (tx) => {
      // 1) Crear la orden + items (status usa default PENDIENTE)
      const order = await tx.order.create({
        data: {
          tableNumber,
          waiterName: waiter,
          items: {
            create: items.map((it: any) => ({
              dishId: it.dishId,
              qty: Number(it.qty) || 1,
              note: it.note ?? null,
            })),
          },
        },
        include: { items: true },
      });

      // 2) Descontar stock por receta (si aplica)
      for (const it of order.items) {
        const recipe = await tx.dishRecipe.findMany({
          where: { dishId: it.dishId },
          select: { productId: true, qty: true },
        });
        for (const r of recipe) {
          await tx.stock.upsert({
            where: { productId: r.productId },
            update: { qty: { decrement: it.qty * r.qty } },
            create: { productId: r.productId, qty: 0, capacity: 0, alerted: false },
          });
        }
      }

      return order;
    });

    return NextResponse.json({ ok: true, id: created.id });
  } catch (e: any) {
    console.error('[POST /api/orders]', e);
    return NextResponse.json({ error: e.message ?? 'Error creando pedido' }, { status: 500 });
  }
}
