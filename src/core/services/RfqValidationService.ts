import { prisma } from '@/lib/db';
import type { StandardPriceService } from '@/core/ports/StandardPriceService';
import type { Prisma, RfqClassification } from '@prisma/client';

import type { IStandardPriceService } from './StandardPriceService';



export class RfqValidationService {
  constructor(private std: IStandardPriceService) {}

  async setQuotedPrices(rfqId: string, prices: { itemId: string; quotedUnitPriceCents: number }[]) {
    const rfq = await prisma.rfq.findUnique({ where: { id: rfqId }, select: { id: true } });
    if (!rfq) throw new Error('RFQ no existe');

    for (const p of prices) {
      if (!Number.isFinite(p.quotedUnitPriceCents) || p.quotedUnitPriceCents <= 0) {
        throw new Error('Precio inválido');
      }
      await prisma.rfqItem.update({
        where: { id: p.itemId },
        data: { quotedUnitPriceCents: Math.round(p.quotedUnitPriceCents) },
      });
    }
    return { ok: true };
  }

  async validate(rfqId: string) {
    const rfq = await prisma.rfq.findUnique({
      where: { id: rfqId },
      include: { items: true },
    });
    if (!rfq) throw new Error('RFQ no existe');
    if (rfq.items.length === 0) throw new Error('RFQ sin ítems');
    if (rfq.items.some(i => i.quotedUnitPriceCents == null)) {
      throw new Error('Hay ítems sin precio ofertado');
    }

    // Flags en vez de comparar strings dentro del loop
    let rejected = false;
    let suspicious = false;

    for (const it of rfq.items) {
      const std = await this.std.getUnitPriceCents(it.productId);
      const quoted = it.quotedUnitPriceCents!;
      const diff = (quoted - std) / std;

      if (diff > 0.25) {         // +25% => RECHAZADA
        rejected = true;
        break;                    // ya no hace falta seguir
      }
      if (diff < -0.5) {         // -50% => SOSPECHOSA (si no fue rechazada)
        suspicious = true;
      }
    }

    const finalClass: RfqClassification =
    rejected ? 'RECHAZADA' : (suspicious ? 'SOSPECHOSA' : 'OPCIONADA');

    await prisma.rfq.update({
      where: { id: rfqId },
      data: { classification: finalClass },
    });

    return { rfqId, classification: finalClass };
  }

  
}
