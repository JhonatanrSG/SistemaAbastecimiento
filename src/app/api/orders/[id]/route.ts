import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { OrderStatus } from '@prisma/client';

type Params = { id: string };

// 👇 En Next 15 params es Promise —> ¡hay que await!
export async function PATCH(req: NextRequest, ctx: { params: Promise<Params> }) {
  try {
    const { id } = await ctx.params; // <— ESTA ES LA CLAVE

    const body = await req.json().catch(() => ({}));
    const status = body?.status as OrderStatus | undefined;
    if (!id || !status) {
      return NextResponse.json({ error: 'id y status son requeridos' }, { status: 400 });
    }

    // Opcional: valida transición para evitar estados locos
    const current = await prisma.order.findUnique({
      where: { id },
      select: { status: true },
    });
    if (!current) return NextResponse.json({ error: 'Orden no existe' }, { status: 404 });

    const okMoves = new Set<string>([
      `${OrderStatus.PENDIENTE}->${OrderStatus.EN_PREPARACION}`,
      `${OrderStatus.EN_PREPARACION}->${OrderStatus.LISTO}`,
      // permitir volver atrás:
      `${OrderStatus.EN_PREPARACION}->${OrderStatus.PENDIENTE}`,
      `${OrderStatus.LISTO}->${OrderStatus.EN_PREPARACION}`,
    ]);

    const move = `${current.status}->${status}`;
    if (!okMoves.has(move)) {
      return NextResponse.json({ error: `Transición inválida: ${move}` }, { status: 400 });
    }

    const updated = await prisma.order.update({
      where: { id },
      data: { status },
      select: { id: true, status: true },
    });

    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Error' }, { status: 500 });
  }
}
