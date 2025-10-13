/**
 * Adaptador concreto usando Prisma para DishRepository.
 * Patrón aplicado: Adapter — dominio ↔ proveedor (Prisma/PostgreSQL).
 */
import { prisma } from '@/lib/db';
import type { DishRepository, Dish, DishRecipeItem } from '@/core/ports/DishRepository';

export class PrismaDishRepository implements DishRepository {
  async list(params?: { categoryId?: string }): Promise<Dish[]> {
    const where = params?.categoryId ? { categoryId: params.categoryId } : {};
    const rows = await prisma.dish.findMany({
      where,
      include: { recipe: true },
      orderBy: { name: 'asc' }
    });
    return rows.map(r => ({
      id: r.id,
      name: r.name,
      categoryId: r.categoryId,
      priceCents: r.priceCents,
      recipe: r.recipe.map(i => ({ productId: i.productId, qty: i.qty, uom: i.uom }))
    }));
  }

  async create(data: Omit<Dish, 'id'>): Promise<{ id: string }> {
    // transacción: crea plato y su receta
    const created = await prisma.dish.create({
      data: {
        name: data.name,
        categoryId: data.categoryId,
        priceCents: data.priceCents,
        recipe: {
          createMany: {
            data: data.recipe.map((i: DishRecipeItem) => ({
              productId: i.productId,
              qty: i.qty,
              uom: i.uom
            }))
          }
        }
      },
      select: { id: true }
    });
    return created;
  }
}
