// src/app/(web)/catalog/page.tsx
import Link from "next/link";
import { PrismaClient } from "@prisma/client";
import { getSession, type Role } from "@/lib/auth";

// Prisma singleton local
const g = globalThis as unknown as { _prisma?: PrismaClient };
const prisma = g._prisma ?? new PrismaClient({ log: ["error"] });
if (process.env.NODE_ENV !== "production") g._prisma = prisma;

// Tipos mínimos (solo para evitar any)
type Props = { searchParams?: { category?: string } };
type CategoryRow = { id: string; name: string };
type DishRow = {
  id: string;
  name: string;
  description?: string | null;
  priceCents?: number | null; // cambia a tu campo real si no usas priceCents
  categoryId?: string | null;
  category?: { name: string } | null;
};

export default async function CatalogPage({ searchParams }: Props) {
  const session = await getSession();
  const role: Role = ((session as any)?.role ?? (session as any)?.user?.role ?? "WAITER") as Role;
  const canCreate = role === "ADMIN" || role === "CHEF";

  // Filtro por categoría (usa categoryId)
  const cat = searchParams?.category;

  // Categorías (solo id y name)
  const categories = (await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  })) as CategoryRow[];

  // Platos (incluye nombre de categoría; sin ingredientes)
  const dishes = (await prisma.dish.findMany({
    where: cat ? { categoryId: cat } : {},
    orderBy: [{ category: { name: "asc" } }, { name: "asc" }],
    include: { category: { select: { name: true } } },
  })) as DishRow[];

  return (
    <section className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Catálogo</h1>
          <p className="text-sm text-neutral-600">Lista de platos creados (vista de menú).</p>
        </div>

        {canCreate && (
          <Link
            href="/catalog/new"
            className="rounded-lg border px-4 py-2 text-sm hover:bg-neutral-50"
          >
            Registrar plato
          </Link>
        )}
      </header>

      {/* Filtro simple por categoría (categoryId) */}
      <div className="flex flex-wrap gap-2">
        <FilterPill href="/catalog" active={!cat} label="Todas" />
        {categories.map((c) => (
          <FilterPill
            key={c.id}
            href={`/catalog?category=${encodeURIComponent(c.id)}`}
            active={cat === c.id}
            label={c.name}
          />
        ))}
      </div>

      {/* Lista de platos */}
      {dishes.length === 0 ? (
        <p className="text-neutral-600">No hay platos para esta categoría.</p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {dishes.map((d) => (
            <li key={d.id}>
              <DishCard dish={d} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/* ===== Subcomponentes server-only ===== */
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

function DishCard({ dish }: { dish: DishRow }) {
  const price =
    dish.priceCents != null ? (dish.priceCents / 100).toLocaleString() : null;

  return (
    <div className="h-full rounded-2xl border p-4 shadow-sm">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-lg font-medium">{dish.name}</div>
          <div className="text-xs text-neutral-500">
            {dish.category?.name ?? "Sin categoría"}
          </div>
        </div>
        {price && <div className="shrink-0 text-sm font-semibold">${price}</div>}
      </div>

      {dish.description && (
        <p className="text-sm text-neutral-700">{dish.description}</p>
      )}
    </div>
  );
}
