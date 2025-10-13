import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { MockMinCommerceAdapter } from '@/infra/http/MockMinCommerceAdapter';

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> } // 👈
) {
  const { id } = await ctx.params; // 👈
  const rfq = await prisma.rfq.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!rfq) return NextResponse.json({ error: 'RFQ no existe' }, { status: 404 });

  // Chequear que todos tengan precio
  if (rfq.items.some(i => i.quotedUnitPriceCents == null)) {
    return NextResponse.json({ error: 'Hay ítems sin precio ofertado' }, { status: 400 });
  }

  const adapter = new MockMinCommerceAdapter();
  let classification: 'OPCIONADA' | 'RECHAZADA' | 'SOSPECHOSA' = 'OPCIONADA';

  for (const it of rfq.items) {
    const std = (await adapter.getStandardForProduct(it.productId)).unitPriceCents;
    const q = it.quotedUnitPriceCents!;
    if (q > std * 1.25) { classification = 'RECHAZADA'; break; }
    if (q < std * 0.5)  { classification = 'SOSPECHOSA'; /* seguimos buscando RECHAZADA */ }
  }

  await prisma.rfq.update({ where: { id }, data: { classification } });
  return NextResponse.json({ rfqId: id, classification });
}
