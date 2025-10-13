import { NextResponse } from 'next/server';
import { PoFacade } from '@/core/services/PoFacade';

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  try {
    const res = await new PoFacade().createFromRfq(id);
    return NextResponse.json(res, { status: res.duplicate ? 200 : 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Error' }, { status: 400 });
  }
}
