/**
 * Puerto (interfaz) para persistir/leer platos.
 * Patrón aplicado: Adapter (Ports & Adapters / Hexagonal).
 */
export interface DishRecipeItem {
  productId: string;
  qty: number;
  uom: string;
}

export interface Dish {
  id: string;
  name: string;
  categoryId: string;
  priceCents: number;
  recipe: DishRecipeItem[];
}

export interface DishRepository {
  list(params?: { categoryId?: string }): Promise<Dish[]>;
  create(data: Omit<Dish, 'id'>): Promise<{ id: string }>;
}
