// prisma/seed.ts
import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // 1) Categorías (name es único → upsert seguro)
  const categoriesData = [
    { name: 'Proteínas' },
    { name: 'Verduras' },
    { name: 'Platos' },
  ];

  const categories = {};
  for (const c of categoriesData) {
    const cat = await prisma.category.upsert({
      where: { name: c.name },
      update: {},
      create: { name: c.name },
    });
    (categories as any)[c.name] = cat;
  }

  // 2) Productos (Product.name NO es único → NO usar upsert por name)
  //    Creamos por nombre si NO existe (findFirst + create)
  type ProdSeed = { name: string; categoryName: string };
  const productsSeed: ProdSeed[] = [
    { name: 'Res', categoryName: 'Proteínas' },
    { name: 'Pollo', categoryName: 'Proteínas' },
    { name: 'Lechuga', categoryName: 'Verduras' },
    { name: 'Tomate', categoryName: 'Verduras' },
  ];

  const productsMap: Record<string, { id: string; name: string }> = {};

  for (const p of productsSeed) {
    const category = (categories as any)[p.categoryName];
    if (!category) throw new Error(`Categoría no encontrada: ${p.categoryName}`);

    // ¿ya existe un producto con ese nombre en esa categoría?
    let prod = await prisma.product.findFirst({
      where: { name: p.name, categoryId: category.id },
    });

    if (!prod) {
      prod = await prisma.product.create({
        data: { name: p.name, categoryId: category.id },
      });
    }

    productsMap[p.name] = { id: prod.id, name: prod.name };
  }

  // 3) Stock inicial (Stock.productId es único → upsert por productId)
  for (const name of Object.keys(productsMap)) {
    const productId = productsMap[name].id;
    await prisma.stock.upsert({
      where: { productId },
      update: { qty: 20, capacity: 100, alerted: false },
      create: { productId, qty: 20, capacity: 100, alerted: false },
    });
  }

  // 4) Plato “Bandeja Prote” + receta
  const platosCat = (categories as any)['Platos'];
  const dish = await prisma.dish.upsert({
    where: { id: 'seed-bandeja-prote' }, // id estable para evitar duplicar
    update: {},
    create: {
      id: 'seed-bandeja-prote',
      name: 'Bandeja Prote',
      categoryId: platosCat.id,
      priceCents: 25000,
    },
  });

  // Receta: 1 Res + 1 Pollo + 1 Lechuga (ejemplo)
  // DishRecipe tiene PK compuesta (dishId, productId) → usa upsert por esa compuesta
  const recipePairs = [
    { productName: 'Res', qty: 1, uom: 'Unidad' },
    { productName: 'Pollo', qty: 1, uom: 'Unidad' },
    { productName: 'Lechuga', qty: 1, uom: 'Unidad' },
  ];

  for (const r of recipePairs) {
    const prod = productsMap[r.productName];
    if (!prod) continue;
    await prisma.dishRecipe.upsert({
      where: { dishId_productId: { dishId: dish.id, productId: prod.id } },
      update: { qty: r.qty, uom: r.uom },
      create: { dishId: dish.id, productId: prod.id, qty: r.qty, uom: r.uom },
    });
  }

  // 5) Proveedor demo (email único → upsert)
  await prisma.supplier.upsert({
    where: { email: 'proveedor@example.com' },
    update: { name: 'Proveedor Demo' },
    create: { name: 'Proveedor Demo', email: 'proveedor@example.com' },
  });

  // 6) Usuarios (email único → upsert) — contraseña 123456
  const pass = await bcrypt.hash('123456', 10);
  const users = [
    { name: 'Admin Demo', email: 'admin@example.com', role: UserRole.ADMIN },
    { name: 'Compras Proc', email: 'proc@example.com', role: UserRole.PROC },
    { name: 'Bodega', email: 'inventory@example.com', role: UserRole.INVENTORY },
    { name: 'Mesero', email: 'waiter@example.com', role: UserRole.WAITER },
    { name: 'Chef', email: 'chef@example.com', role: UserRole.CHEF },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role, passwordHash: pass },
      create: { name: u.name, email: u.email, role: u.role, passwordHash: pass },
    });
  }

  console.log('✅ Seed completado con éxito.');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
