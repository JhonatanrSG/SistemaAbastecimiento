/**
 * Capa de entrega Next API → Facade → Adapter(Prisma)
 * Patrones: Facade + Adapter. Prisma usa Singleton (src/lib/db.ts).
 */
import { NextResponse } from 'next/server';
import { PrismaCategoryRepository } from '@/infra/db/PrismaCategoryRepository';
import { PrismaProductRepository } from '@/infra/db/PrismaProductRepository';
import { PrismaDishRepository } from '@/infra/db/PrismaDishRepository';
import { CatalogFacade } from '@/core/services/CatalogFacade';
import { DefaultDishFactory } from '@/factories/DishFactory';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get('categoryId') ?? undefined;

  const facade = new CatalogFacade(
    new PrismaCategoryRepository(),
    new PrismaProductRepository(),
    new PrismaDishRepository()
  );
  const data = await facade.listDishes(categoryId);
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  try {
    const raw = await req.json();                               // entrada externa
    const dto = new DefaultDishFactory().create(raw);           // Factory Method (validación)
    const facade = new CatalogFacade(
      new PrismaCategoryRepository(),
      new PrismaProductRepository(),
      new PrismaDishRepository()
    );
    const created = await facade.createDish(dto);               // Facade → Adapter → Prisma
    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    // errores comunes (validación Zod o FK)
    const message = err?.errors?.[0]?.message || err?.message || 'Bad Request';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
