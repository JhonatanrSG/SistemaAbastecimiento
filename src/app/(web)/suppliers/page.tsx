import Link from 'next/link';
import { getJSONServer } from '@/lib/api-server';

type Supplier = { id: string; name: string; email: string };

export default async function SuppliersPage() {
  const data = await getJSONServer<Supplier[]>('/api/suppliers');

  return (
    <main className="p-8 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Proveedores</h1>
        <Link href="/home" className="underline">← Volver</Link>
      </div>

      <ul className="divide-y">
        {data.map((s) => (
          <li key={s.id} className="py-3">
            <div className="font-medium">{s.name}</div>
            <div className="text-sm text-gray-500">{s.email}</div>
          </li>
        ))}
      </ul>
    </main>
  );
}
