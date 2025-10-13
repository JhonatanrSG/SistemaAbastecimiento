// src/core/db/PrismaOrderRepository.ts
import { prisma } from '@/lib/db';
import { OrderStatus } from '@prisma/client';

export type OrderListRow = {
  id: string;
  tableNumber: string;
  waiterName: string;
  status: OrderStatus;
  createdAt: Date;
  items: { dishId: string; qty: number }[];
};

export class PrismaOrderRepository {
  async create(data: {
    tableNumber: string;
    waiterName: string;
    items: { dishId: string; qty: number; note?: string | null }[];
  }): Promise<{ id: string }> {
    const created = await prisma.order.create({
      data: {
        tableNumber: data.tableNumber,
        waiterName: data.waiterName,
        status: OrderStatus.PENDIENTE,
        items: {
          create: data.items.map(i => ({
            dishId: i.dishId,
            qty: i.qty,
            note: i.note ?? null,
          })),
        },
      },
      select: { id: true },
    });
    return created;
  }

  async list(params?: { status?: OrderStatus }): Promise<OrderListRow[]> {
    const where = params?.status ? { status: params.status } : {};
    const rows = await prisma.order.findMany({
      where,
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });

    return rows.map(r => ({
      id: r.id,
      tableNumber: r.tableNumber,
      waiterName: r.waiterName,
      status: r.status,
      createdAt: r.createdAt,
      items: r.items.map(i => ({ dishId: i.dishId, qty: i.qty })),
    }));
  }

  async updateStatus(id: string, status: OrderStatus): Promise<void> {
    await prisma.order.update({ where: { id }, data: { status } });
  }
}
