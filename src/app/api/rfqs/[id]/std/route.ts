import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { MockMinCommerceAdapter } from '@/infra/http/MockMinCommerceAdapter';

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> } // 👈 aquí
) {
  const { id } = await ctx.params; // 👈 y aquí
  const rfq = await prisma.rfq.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!rfq) return NextResponse.json({ error: 'RFQ no existe' }, { status: 404 });

  const adapter = new MockMinCommerceAdapter();
  const out = await Promise.all(
    rfq.items.map(async (it) => {
      const std = await adapter.getStandardForProduct(it.productId);
      return {
        itemId: it.id,
        productId: it.productId,
        stdUnitPriceCents: std.unitPriceCents,
      };
    })
  );
  return NextResponse.json(out);
}
