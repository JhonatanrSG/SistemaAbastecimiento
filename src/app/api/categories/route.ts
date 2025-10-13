/**
 * Capa de entrega (Next API) → Facade → Adapter (Prisma)
 * Patrones: Facade + Adapter. El acceso a DB abajo usa Prisma Singleton.
 */
import { NextResponse } from 'next/server';
import { PrismaCategoryRepository } from '@/infra/db/PrismaCategoryRepository';
import { CatalogFacade } from '@/core/services/CatalogFacade';

export async function GET() {
  const facade = new CatalogFacade(new PrismaCategoryRepository());
  const data = await facade.listCategories();
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const { name } = await req.json();
  if (!name || typeof name !== 'string' || !name.trim()) {
    return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 });
  }
  const facade = new CatalogFacade(new PrismaCategoryRepository());
  const created = await facade.createCategory(name);
  return NextResponse.json(created, { status: 201 });
}
