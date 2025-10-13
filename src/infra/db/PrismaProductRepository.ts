/**
 * Adaptador Prisma de ProductRepository.
 * Patrón: Adapter – traduce dominio ↔ Prisma.
 */
import { prisma } from '@/lib/db';
import type { ProductRepository, Product } from '@/core/ports/ProductRepository';

export class PrismaProductRepository implements ProductRepository {
  async list(params?: { categoryId?: string }): Promise<Product[]> {
    const where = params?.categoryId ? { categoryId: params.categoryId } : {};
    const rows = await prisma.product.findMany({ where, orderBy: { name: 'asc' } });
    return rows.map(r => ({ id: r.id, name: r.name, categoryId: r.categoryId }));
  }

  async create(data: { name: string; categoryId: string }): Promise<Product> {
    const r = await prisma.product.create({ data: { name: data.name.trim(), categoryId: data.categoryId } });
    return { id: r.id, name: r.name, categoryId: r.categoryId };
  }
}
