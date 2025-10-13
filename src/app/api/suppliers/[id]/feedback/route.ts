import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> } // Next 15: params es Promise
) {
  const { id: supplierId } = await ctx.params;

  try {
    const body = await req.json();
    const { rfqId, answer, comment } = body ?? {};

    if (typeof rfqId !== 'string' || !rfqId) {
      return NextResponse.json({ error: 'rfqId requerido' }, { status: 400 });
    }
    const valid = ['ACEPTA', 'RECHAZA', 'ACLARA'];
    if (!valid.includes(answer)) {
      return NextResponse.json({ error: 'answer inválido (ACEPTA|RECHAZA|ACLARA)' }, { status: 400 });
    }

    const sup = await prisma.supplier.findUnique({ where: { id: supplierId } });
    if (!sup) return NextResponse.json({ error: 'Proveedor no existe' }, { status: 404 });

    const rfq = await prisma.rfq.findUnique({ where: { id: rfqId } });
    if (!rfq || rfq.supplierId !== supplierId) {
      return NextResponse.json({ error: 'RFQ no existe o no pertenece al proveedor' }, { status: 400 });
    }

    // Sin migraciones: registramos el feedback como Notification
    await prisma.notification.create({
      data: {
        type: 'SUPPLIER_FEEDBACK',
        message: `Proveedor ${sup.name} respondió ${answer} sobre RFQ ${rfqId}${comment ? `: ${comment}` : ''}`,
      },
    });

    // (Opcional) aquí podrías cambiar status de la RFQ o dejarlo como está.
    return NextResponse.json({ ok: true, rfqId, supplierId, answer });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Error' }, { status: 400 });
  }
}
