import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> } // 👈
) {
  const { id } = await ctx.params; // 👈
  if (!id) return NextResponse.json({ error: 'rfqId inválido en URL' }, { status: 400 });

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'JSON inválido' }, { status: 400 }); }

  const prices = Array.isArray(body) ? body : body?.prices;
  if (!Array.isArray(prices) || prices.length === 0) {
    return NextResponse.json({ error: 'Body debe ser un array de precios' }, { status: 400 });
  }

  await Promise.all(
    prices.map((p: any) =>
      prisma.rfqItem.update({
        where: { id: p.itemId },
        data: { quotedUnitPriceCents: p.quotedUnitPriceCents },
      })
    )
  );

  return NextResponse.json({ ok: true });
}
