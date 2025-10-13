/**
 * Adaptador concreto de CategoryRepository usando Prisma.
 * Patrón aplicado: Adapter – traduce llamadas del dominio a Prisma.
 */
import { prisma } from '@/lib/db';
import type { Category, CategoryRepository } from '@/core/ports/CategoryRepository';

export class PrismaCategoryRepository implements CategoryRepository {
  async list(): Promise<Category[]> {
    const rows = await prisma.category.findMany({ orderBy: { name: 'asc' } });
    return rows.map(r => ({ id: r.id, name: r.name }));
  }

  async create(name: string): Promise<Category> {
    const r = await prisma.category.create({ data: { name } });
    return { id: r.id, name: r.name };
  }
}
