import Link from 'next/link';
import RoleGate from '@/components/RoleGate';
// import KitchenBoard from '@/components/KitchenBoard'; // si lo tienes

export default function Page() {
  return (
    <RoleGate allow={['CHEF', 'ADMIN']}>
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Cocina</h1>

        <div className="flex gap-3">
          <Link href="/catalog/new" className="border rounded px-3 py-1">Registrar plato</Link>
          <Link href="/catalog" className="border rounded px-3 py-1">Ver catálogo</Link>
        </div>

        {/* <KitchenBoard /> */}
      </div>
    </RoleGate>
  );
}
