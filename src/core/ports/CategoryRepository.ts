/**
 * Puerto del repositorio de Categorías.
 * Patrón aplicado: Adapter (Ports & Adapters / Hexagonal) – esta interfaz
 * desacopla el dominio del proveedor de datos (Prisma/Postgres ahora, Mongo mañana).
 */
export interface Category {
  id: string;
  name: string;
}

export interface CategoryRepository {
  list(): Promise<Category[]>;
  create(name: string): Promise<Category>;
}
