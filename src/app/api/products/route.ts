/**
 * Capa de entrega (Next API) → Facade → Adapter(Prisma)
 * Patrones: Facade + Adapter. Prisma usa Singleton en src/lib/db.ts
 */
import { NextResponse } from 'next/server';
import { PrismaProductRepository } from '@/infra/db/PrismaProductRepository';
import { PrismaCategoryRepository } from '@/infra/db/PrismaCategoryRepository';
import { CatalogFacade } from '@/core/services/CatalogFacade';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get('categoryId') ?? undefined;

  const facade = new CatalogFacade(new PrismaCategoryRepository(), new PrismaProductRepository());
  const data = await facade.listProductsByCategory(categoryId);
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const { name, categoryId } = await req.json();
  if (!name || !categoryId) {
    return NextResponse.json({ error: 'name y categoryId son requeridos' }, { status: 400 });
  }
  const facade = new CatalogFacade(new PrismaCategoryRepository(), new PrismaProductRepository());
  const created = await facade.createProduct(name, categoryId);
  return NextResponse.json(created, { status: 201 });
}
