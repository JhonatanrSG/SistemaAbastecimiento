import { prisma } from '@/lib/db';
import type { RequestRepository, SupplyRequestDTO, SupplyRequestRow, RequestFilters } from '@/core/ports/RequestRepository';

export class PrismaRequestRepository implements RequestRepository {
  async create(data: SupplyRequestDTO): Promise<{ id: string }> {
    const created = await prisma.supplyRequest.create({
      data: {
        branch: data.branch,
        requester: data.requester,
        items: {
          // ✅ usar create (no createMany) para anidado
          create: data.items.map(i => ({
            productId: i.productId,
            qty: i.qty,
            uom: i.uom,
            brand: i.brand ?? null,
          })),
        },
      },
      select: { id: true },
    });
    return created;
  }

  async list(filters?: RequestFilters): Promise<SupplyRequestRow[]> {
    const where: any = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.from || filters?.to) {
      where.createdAt = {};
      if (filters.from) where.createdAt.gte = new Date(filters.from);
      if (filters.to)   where.createdAt.lte = new Date(filters.to);
    }
    if (filters?.productId || filters?.brand) {
      where.items = { some: {
        ...(filters.productId ? { productId: filters.productId } : {}),
        ...(filters.brand ? { brand: filters.brand } : {}),
      }}; 
    }

    const rows = await prisma.supplyRequest.findMany({
      where,
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });

    return rows.map(r => ({
      id: r.id,
      branch: r.branch,
      requester: r.requester,
      status: r.status as any,
      createdAt: r.createdAt,
      items: r.items.map(i => ({ productId: i.productId, qty: i.qty, uom: i.uom, brand: i.brand ?? undefined })),
    }));
  }
}
