// src/core/services/PoFacade.ts
import { prisma } from '@/lib/db';
import { Prisma, RequestStatus } from '@prisma/client';

export type CreatePoResult = { id: string; duplicate?: boolean };

export class PoFacade {
  /**
   * Crea una Orden de Compra a partir de una RFQ.
   */
  async createFromRfq(rfqId: string): Promise<CreatePoResult> {
    // 1) Trae la RFQ con items
    const rfq = await prisma.rfq.findUnique({
      where: { id: rfqId },
      include: { items: true },
    });
    if (!rfq) throw new Error('RFQ no encontrada');

    // Evita duplicados por RFQ
    const existing = await prisma.purchaseOrder.findFirst({
      where: { rfqId },
      select: { id: true },
    });
    if (existing) return { id: existing.id, duplicate: true };

    // 2) Crea la PO (status default: EMITIDA)
    const po = await prisma.purchaseOrder.create({
      data: {
        rfqId,
        supplierId: rfq.supplierId,
        requestId: rfq.requestId,
      },
      select: { id: true },
    });

    // 3) Inserta los ítems con poId explícito
    const poItems: Prisma.PurchaseOrderItemCreateManyInput[] = rfq.items.map(
      (it) => ({
        poId: po.id,
        productId: it.productId,
        qty: it.qty,
        // qtyReceived tiene default(0) en el schema
      })
    );

    if (poItems.length) {
      await prisma.purchaseOrderItem.createMany({
        data: poItems,
        skipDuplicates: true,
      });
    }

    // 4) Marca la solicitud en EN_PROCESO (si aplica al flujo)
    await prisma.supplyRequest.update({
      where: { id: rfq.requestId },
      data: { status: RequestStatus.EN_PROCESO },
    });

    return { id: po.id };
  }
}
