/**
 * Fachada de pedidos.
 * Patrones: Facade (orquesta) + (transacción en infra puntual para HU5).
 */
import type { OrderRepository, OrderDTO, OrderStatus } from '@/core/ports/OrderRepository';
import { prisma } from '@/lib/db';

export class OrdersFacade {
  constructor(private orders: OrderRepository) {}

  createOrder(dto: OrderDTO) {
    return this.orders.create(dto);
  }

  listOrders(status?: OrderStatus) {
    return this.orders.list({ status });
  }

  updateOrderStatus(id: string, status: OrderStatus) {
    return this.orders.updateStatus(id, status);
  }

  /**
   * Confirma pedido (EN_PREPARACION -> LISTO) con descuento de inventario.
   * - Calcula insumos a partir de la receta de cada plato * cantidad pedida.
   * - Si falta stock de algún insumo, falla.
   * - Si hay stock, descuenta y deja movimientos + cambia estado a LISTO.
   */
  async confirmOrder(id: string) {
    // Carga pedido (items) y estado actual
    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true }
    });
    if (!order) throw new Error('Pedido no existe');
    if (order.status !== 'EN_PREPARACION') throw new Error('Pedido no está en EN_PREPARACION');

    // Obtén recetas de los platos del pedido
    const dishIds = order.items.map(i => i.dishId);
    const recipes = await prisma.dishRecipe.findMany({
      where: { dishId: { in: dishIds } }
    });

    // Agrega requerimientos: productId -> qty total
    const need: Record<string, number> = {};
    for (const it of order.items) {
      const rcp = recipes.filter(r => r.dishId === it.dishId);
      for (const r of rcp) {
        need[r.productId] = (need[r.productId] ?? 0) + r.qty * it.qty;
      }
    }

    const productIds = Object.keys(need);
    if (productIds.length === 0) {
      // Plato sin receta: nada que descontar, solo marca LISTO
      await prisma.order.update({ where: { id }, data: { status: 'LISTO' } });
      return { ok: true };
    }

    // Verifica stock disponible
    const stocks = await prisma.stock.findMany({ where: { productId: { in: productIds } } });
    const stockMap = new Map(stocks.map(s => [s.productId, s.qty]));
    const faltantes: string[] = [];
    for (const pid of productIds) {
      const have = stockMap.get(pid) ?? 0;
      const req = need[pid];
      if (have < req) faltantes.push(pid);
    }
    if (faltantes.length) {
      // falla: no se confirma
      throw new Error(`Stock insuficiente para productos: ${faltantes.join(', ')}`);
    }

    // Descuento + movimientos + cambio de estado en una transacción
    await prisma.$transaction(async (tx) => {
  for (const pid of productIds) {
    const req = need[pid];
    const updated = await tx.stock.update({
      where: { productId: pid },
      data: { qty: { decrement: req } },
      select: { productId: true, qty: true, capacity: true, alerted: true }
    });
    await tx.stockMovement.create({
      data: { productId: pid, change: -req, reason: 'CONSUMO_PEDIDO', orderId: id }
    });

    // 🔔 HU6: alerta si cae al 25% o menos y aún no alertado
    const threshold = updated.capacity > 0 ? 0.25 * updated.capacity : -1;
    if (updated.capacity > 0 && !updated.alerted && updated.qty <= threshold) {
      await tx.notification.create({
  data: {
    type: 'LOW_STOCK',
    message: `Stock bajo (<25%): ${updated.productId} ${updated.qty}/${updated.capacity}`,
  },
});

      await tx.stock.update({
        where: { productId: updated.productId },
        data: { alerted: true }
      });
      // aquí podríamos "enviar correo" real; por ahora lo simulamos:
      console.log('[ALERTA] LOW_STOCK email -> jefe@konrad.test', updated);
    }
  }
  await tx.order.update({ where: { id }, data: { status: 'LISTO' } });
});


    return { ok: true };
  }
}
