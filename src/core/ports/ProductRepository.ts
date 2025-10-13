/**
 * Puerto de productos.
 * Patrón: Adapter (Ports & Adapters / Hexagonal).
 */
export interface Product {
  id: string;
  name: string;
  categoryId: string;
}

export interface ProductRepository {
  list(params?: { categoryId?: string }): Promise<Product[]>;
  create(data: { name: string; categoryId: string }): Promise<Product>;
}
