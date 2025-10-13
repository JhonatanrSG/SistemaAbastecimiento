/**
 * Fachada del catálogo (categorías, productos y platos).
 * Patrón aplicado: Facade — simplifica el uso desde la capa web/API.
 */
import type { CategoryRepository } from '@/core/ports/CategoryRepository';
import type { ProductRepository } from '@/core/ports/ProductRepository';
import type { DishRepository } from '@/core/ports/DishRepository';
import type { DishDTO } from '@/factories/DishFactory';

export class CatalogFacade {
  constructor(
    private categories: CategoryRepository,
    private products?: ProductRepository,
    private dishes?: DishRepository
  ) {}

  // Categorías
  listCategories() { return this.categories.list(); }
  createCategory(name: string) { return this.categories.create(name.trim()); }

  // Productos
  listProductsByCategory(categoryId?: string) {
    if (!this.products) throw new Error('Products repo not wired');
    return this.products.list({ categoryId });
  }
  createProduct(name: string, categoryId: string) {
    if (!this.products) throw new Error('Products repo not wired');
    return this.products.create({ name: name.trim(), categoryId });
  }

  // Platos
  listDishes(categoryId?: string) {
    if (!this.dishes) throw new Error('Dishes repo not wired');
    return this.dishes.list({ categoryId });
  }
  createDish(dto: DishDTO) {
    if (!this.dishes) throw new Error('Dishes repo not wired');
    return this.dishes.create(dto);
  }
}
