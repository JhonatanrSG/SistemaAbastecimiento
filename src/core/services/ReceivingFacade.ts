// src/core/services/ReceivingFacade.ts
import { prisma } from '@/lib/db';
import { PoStatus } from '@prisma/client';

export class ReceivingFacade {
  /**
   * Recibe una OC. Si no envías items, consume los de la propia OC.
   */
  async receivePo(poId: string, items?: { productId: string; qty: number }[]) {
    const po = await prisma.purchaseOrder.findUnique({
      where: { id: poId },
      include: { items: true },
    });
    if (!po) throw new Error('OC no encontrada');

    const receive =
      items && items.length
        ? items
        : po.items.map(i => ({ productId: i.productId, qty: i.qty }));

    await prisma.$transaction(async tx => {
      // 1) GRN
      const grn = await tx.goodsReceipt.create({
        data: {
          poId,
          items: {
            create: receive.map(i => ({
              productId: i.productId,
              qty: i.qty,
              uom: null, // nuestro modelo GoodsReceiptItem.uom es opcional
            })),
          },
        },
        include: { items: true },
      });

      // 2) Sumar stock + movimiento
      for (const it of grn.items) {
        await tx.stock.upsert({
          where: { productId: it.productId },
          update: { qty: { increment: it.qty } },
          create: { productId: it.productId, qty: it.qty, capacity: 0, alerted: false },
        });

        await tx.stockMovement.create({
          data: {
            productId: it.productId,
            change: it.qty,
            reason: `RECEPCION_OC (${poId})`,
          },
        });

        // 3) Marcar qtyReceived en el item de la OC
        await tx.purchaseOrderItem.updateMany({
          where: { poId, productId: it.productId },
          data: { qtyReceived: { increment: it.qty } },
        });
      }

      // 4) Si todo recibido, marcar la OC como RECIBIDA
      const latest = await tx.purchaseOrder.findUnique({
        where: { id: poId },
        include: { items: true },
      });
      const allReceived = !!latest?.items.every(i => (i.qtyReceived ?? 0) >= i.qty);
      if (allReceived) {
        await tx.purchaseOrder.update({
          where: { id: poId },
          data: { status: PoStatus.RECIBIDA },
        });
        // Nota: NO tocamos SupplyRequest.status (ya no existe CERRADA). Si quieres,
        // podrías dejarlo en EN_PROCESO y cerrar por otro flujo.
      }

      return { ok: true, grnId: grn.id, poId };
    });

    return { ok: true };
  }
}
