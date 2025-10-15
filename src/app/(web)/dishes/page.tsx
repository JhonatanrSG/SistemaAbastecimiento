import Link from "next/link";
import { PrismaClient } from "@prisma/client";
import { getSession, type Role } from "@/lib/auth";
import DishActionsClient from "./DishActions.client"; // 👈 import client

const g = globalThis as unknown as { _prisma?: PrismaClient };
const prisma = g._prisma ?? new PrismaClient({ log: ["error"] });
if (process.env.NODE_ENV !== "production") g._prisma = prisma;

type Props = { searchParams: Promise<{ category?: string }> };

export default async function CatalogPage({ searchParams }: Props) {
  const session = await getSession();
  const role: Role =
    ((session as any)?.role ?? (session as any)?.user?.role ?? "WAITER") as Role;

  const canCreate = role === "ADMIN" || role === "CHEF";
  const canManage = role === "ADMIN" || role === "CHEF";

  // Next 15: searchParams es Promise
  const { category: cat } = await searchParams;

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  const dishes = await prisma.dish.findMany({
    where: cat ? { categoryId: cat } : {},
    orderBy: [{ category: { name: "asc" } }, { name: "asc" }],
    include: {
      category: { select: { name: true } },
      recipe: {
        select: {
          qty: true,
          uom: true,
          product: { select: { name: true } },
        },
      },
    },
  });

  return (
    <section className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Catálogo</h1>
          <p className="text-sm text-neutral-600">
            Lista de platos e ingredientes (receta).
          </p>
        </div>

        {canCreate && (
          <Link
            href="/dishes/new"
            className="rounded-lg border px-4 py-2 text-sm hover:bg-neutral-50"
          >
            Registrar plato
          </Link>
        )}
      </header>

      <div className="flex flex-wrap gap-2">
        <FilterPill href="/dishes" active={!cat} label="Todas" />
        {categories.map((c) => (
          <FilterPill
            key={c.id}
            href={`/dishes?category=${encodeURIComponent(c.id)}`}
            active={cat === c.id}
            label={c.name}
          />
        ))}
      </div>

      {dishes.length === 0 ? (
        <p className="text-neutral-600">No hay platos para esta categoría.</p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {dishes.map((d) => (
            <li key={d.id}>
              <DishCard
                dish={{
                  id: d.id,
                  name: d.name,
                  description: (d as any).description ?? null,
                  priceCents: (d as any).priceCents ?? null,
                  categoryName: d.category?.name ?? "Sin categoría",
                  ingredients:
                    d.recipe.map((r) => ({
                      productName: r.product.name,
                      qty: r.qty,
                      uom: r.uom,
                    })) ?? [],
                }}
                canManage={canManage}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/* ------------ subcomponentes (server) ------------ */

function FilterPill({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  const base = "rounded-full border px-4 py-1.5 text-sm";
  const cls = active ? `${base} bg-black text-white` : `${base} hover:bg-neutral-50`;
  return (
    <Link prefetch href={href} className={cls}>
      {label}
    </Link>
  );
}

function DishCard({
  dish,
  canManage,
}: {
  dish: {
    id: string;
    name: string;
    description: string | null;
    priceCents: number | null;
    categoryName: string;
    ingredients: { productName: string; qty: number; uom: string }[];
  };
  canManage: boolean;
}) {
  const price =
    dish.priceCents != null ? (dish.priceCents / 100).toLocaleString() : null;

  return (
    <div className="h-full rounded-2xl border p-4 shadow-sm flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-lg font-medium">{dish.name}</div>
          <div className="text-xs text-neutral-500">{dish.categoryName}</div>
        </div>
        {price && <div className="shrink-0 text-sm font-semibold">${price}</div>}
      </div>

      {dish.description && (
        <p className="text-sm text-neutral-700">{dish.description}</p>
      )}

      <div>
        <div className="text-xs font-medium text-neutral-600 mb-1">
          Ingredientes
        </div>
        {dish.ingredients.length === 0 ? (
          <div className="text-xs text-neutral-500">Sin receta.</div>
        ) : (
          <ul className="text-sm list-disc pl-5 space-y-0.5">
            {dish.ingredients.map((ing, i) => (
              <li key={i}>
                {ing.productName} — {ing.qty} {ing.uom}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 👇 Acciones interactivas: componente cliente */}
      {canManage && (
        <DishActionsClient
          id={dish.id}
          currentPriceCents={dish.priceCents ?? 0}
        />
      )}
    </div>
  );
}
