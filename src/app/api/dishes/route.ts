// src/app/api/dishes/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const searchParams = new URL(req.url).searchParams;
  const q = searchParams.get('search')?.trim() || undefined;
  const categoryId = searchParams.get('categoryId') || undefined;

  const rows = await prisma.dish.findMany({
    where: {
      AND: [
        categoryId ? { categoryId } : {},
        q ? { name: { contains: q, mode: 'insensitive' } } : {},
      ],
    },
    orderBy: [{ createdAt: 'desc' }], // ✅ válido
    include: {
      category: { select: { id: true, name: true } },
      recipe: {
        select: {
          productId: true,
          qty: true,
          uom: true,
          product: { select: { name: true } },
        },
      },
    },
  });

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || (session.role !== 'CHEF' && session.role !== 'ADMIN')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });

  const { name, categoryId, priceCents, recipe } = body as {
    name: string;
    categoryId: string;
    priceCents?: number;
    recipe: { productId: string; qty: number; uom: string }[];
  };

  if (!name?.trim()) return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 });
  if (!categoryId) return NextResponse.json({ error: 'categoryId requerido' }, { status: 400 });

  // Validar receta
  if (!Array.isArray(recipe) || recipe.length === 0) {
    return NextResponse.json({ error: 'Debes agregar ingredientes' }, { status: 400 });
  }
  for (let i = 0; i < recipe.length; i++) {
    const r = recipe[i];
    if (!r?.productId || typeof r.qty !== 'number' || r.qty <= 0) {
      return NextResponse.json({ error: `Recipe[${i}] inválido` }, { status: 400 });
    }
  }

  // Chequear productos existentes
  const productIds = [...new Set(recipe.map((r) => r.productId))];
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true },
  });
  if (products.length !== productIds.length) {
    const found = new Set(products.map((p) => p.id));
    const missing = productIds.filter((id) => !found.has(id));
    return NextResponse.json({ error: `Productos inexistentes: ${missing.join(', ')}` }, { status: 400 });
  }

  const created = await prisma.dish.create({
    data: {
      name: name.trim(),
      categoryId,
      priceCents: priceCents ?? 0,
      recipe: {
        create: recipe.map((r) => ({
          productId: r.productId,
          qty: r.qty,
          uom: r.uom || 'Unidad',
        })),
      },
    },
    include: {
      recipe: true,
    },
  });

  return NextResponse.json(created, { status: 201 });
}
