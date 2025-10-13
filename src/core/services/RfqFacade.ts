// src/core/services/RfqFacade.ts
/**
 * Facade: crea RFQ, clona ítems y cambia SupplyRequest a EN_TRAMITE si queda cubierta.
 */
import { prisma } from '@/lib/db';
import { buildRfqPdf } from '@/lib/pdf';
import { sendRfq } from '@/infra/email/Mails';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';

export class RfqFacade {
  async createRfq(params: { requestId: string; supplierId: string; dueDate: string }) {
    const requestId = params.requestId.trim();
    const supplierId = params.supplierId.trim();
    const dueDateISO = params.dueDate; // YYYY-MM-DD

    // 0) Idempotencia: si ya existe RFQ para ese par, devolverla
    const existing = await prisma.rfq.findUnique({
      where: { requestId_supplierId: { requestId, supplierId } },
      select: { id: true },
    });
    if (existing) return { id: existing.id, duplicate: true };

    // 1) Traer solicitud + proveedor con items
    const [req, sup] = await Promise.all([
      prisma.supplyRequest.findUnique({
        where: { id: requestId },
        include: { items: true },
      }),
      prisma.supplier.findUnique({ where: { id: supplierId } }),
    ]);
    if (!req) throw new Error('Solicitud no existe');
    if (!sup) throw new Error('Proveedor no existe');

    // 2) Crear RFQ + copiar ítems
    const rfq = await prisma.rfq.create({
      data: {
        requestId,
        supplierId,
        dueDate: new Date(dueDateISO),
        items: {
          create: req.items.map((i) => ({
            productId: i.productId,
            qty: i.qty,
            uom: i.uom,
            brand: i.brand ?? null,
          })),
        },
      },
      include: { items: true },
    });

    // 3) Construir datos para el PDF (nombres de producto)
    const products = await prisma.product.findMany({
      where: { id: { in: rfq.items.map((i) => i.productId) } },
      select: { id: true, name: true },
    });
    const nameOf = (id: string) => products.find((p) => p.id === id)?.name ?? id;

    // Generar PDF en memoria
    const pdfBytes = await buildRfqPdf(
      {
        rfqId: rfq.id,
        supplier: sup.name,
        email: sup.email,
        requestId: req.id,
        branch: req.branch,
        requester: req.requester,
        dueDate: new Date(dueDateISO).toISOString().slice(0, 10),
      },
      rfq.items.map((it) => ({
        product: nameOf(it.productId),
        qty: it.qty,
        uom: it.uom,
        brand: it.brand ?? undefined,
      })),
    );

    // Guardar PDF en /public/rfqs/<rfqId>.pdf
    const outDir = path.join(process.cwd(), 'public', 'rfqs');
    await mkdir(outDir, { recursive: true });
    const pdfPath = path.join(outDir, `${rfq.id}.pdf`);
    await writeFile(pdfPath, Buffer.from(pdfBytes));

    // Enviar (o loguear si no hay SMTP)
    await sendRfq(sup.email, rfq.id, pdfPath);

    // 4) Evaluar cobertura
    const reqProductCount = await prisma.supplyRequestItem.aggregate({
      where: { requestId },
      _count: { productId: true },
    });
    const covered = await prisma.rfqItem.findMany({
      where: { rfq: { is: { requestId } } },
      select: { productId: true },
      distinct: ['productId'],
    });

    if ((covered?.length ?? 0) >= (reqProductCount._count.productId ?? 0)) {
      await prisma.supplyRequest.update({
        where: { id: requestId },
        data: { status: 'EN_PROCESO' },
      });
    }

    return { id: rfq.id };
  }
}
