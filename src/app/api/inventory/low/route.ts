import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const rows = await prisma.stock.findMany({
    where: { capacity: { gt: 0 } },
    include: { product: true }
  });
  const low = rows
    .map(r => ({
      productId: r.productId,
      productName: r.product.name,
      qty: r.qty,
      capacity: r.capacity,
      percent: r.capacity > 0 ? (r.qty / r.capacity) * 100 : null
    }))
    .filter(x => x.percent !== null && x.percent! <= 25);
  return NextResponse.json(low);
}
