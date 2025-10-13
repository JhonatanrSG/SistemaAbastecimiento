/**
 * Composite para Catálogo (Categoría → Platos).
 * Patrones: Composite (CategoryComposite + DishLeaf).
 */
import React, { type JSX } from 'react';

export interface CatalogComponent {
  getName(): string;
  render(): JSX.Element;
}


export type Category = { id: string; name: string };
export type Dish = { id: string; name: string; categoryId: string; priceCents: number };

export interface CatalogComponent {
  getName(): string;
  render(): JSX.Element;
}

export class DishLeaf implements CatalogComponent {
  constructor(private dish: Dish) {}
  getName() { return this.dish.name; }
  render() {
    const price = (this.dish.priceCents / 100).toFixed(2);
    return (
      <div className="border rounded p-3 shadow-sm">
        <div className="font-medium">{this.dish.name}</div>
        <div>${price}</div>
      </div>
    );
  }
}

export class CategoryComposite implements CatalogComponent {
  private children: CatalogComponent[] = [];
  constructor(private name: string) {}
  add(child: CatalogComponent) { this.children.push(child); }
  getName() { return this.name; }
  render() {
    return (
      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-2">{this.name}</h2>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {this.children.map((c, i) => <div key={i}>{c.render()}</div>)}
        </div>
      </section>
    );
  }
}

/** Builder: arma el árbol Categoría→Platos desde datos planos */
export function buildCatalogTree(categories: Category[], dishes: Dish[]) {
  const byCat = new Map<string, CategoryComposite>();
  categories.forEach(c => byCat.set(c.id, new CategoryComposite(c.name)));
  dishes.forEach(d => {
    const node = byCat.get(d.categoryId);
    if (node) node.add(new DishLeaf(d));
  });
  // Devuelve solo categorías que tengan platos (o ajusta si quieres todas)
  return Array.from(byCat.values()).filter(cat => cat['children']?.length ?? 0);
}
