import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db'; // usa tu helper de prisma

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> } // en Next 15, params es Promise
) {
  const { id } = await ctx.params;
  if (!id) {
    return NextResponse.json({ error: 'Falta id' }, { status: 400 });
  }

  // 1) ¿Está usado en pedidos?
  const usedCount = await prisma.orderItem.count({ where: { dishId: id } });
  if (usedCount > 0) {
    return NextResponse.json(
      {
        error:
          'No se puede eliminar el plato porque ya fue usado en pedidos. ' +
          'Sugerencia: desactívalo o crea uno nuevo.',
      },
      { status: 409 }
    );
  }

  // 2) Transacción: primero recetas, luego plato
  await prisma.$transaction(async (tx) => {
    await tx.dishRecipe.deleteMany({ where: { dishId: id } });
    await tx.dish.delete({ where: { id } });
  });

  return NextResponse.json({ ok: true });
}
