// src/app/requests/page.tsx
import NavBackHome from '@/components/NavBackHome';
import { absUrl } from '@/lib/server/abs-url';

type SupplyRequest = {
  id: string;
  branch: string;
  requester: string;
  status: 'PENDIENTE' | 'EN_TRAMITE' | 'CERRADA';
  createdAt: string;
};

export default async function RequestsPage() {
  // URL absoluta segura en Server Components
  const url = await absUrl('/api/requests');
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    // Te deja ver el status si algo falla
    throw new Error(`No se pudieron cargar las solicitudes (${res.status})`);
  }
  const data = (await res.json()) as SupplyRequest[];

  return (
    <main className="max-w-5xl mx-auto p-6">
      <NavBackHome />

      <h1 className="text-2xl font-semibold mb-4">Solicitudes de Abastecimiento</h1>

      <div className="overflow-x-auto rounded-xl border">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left">ID</th>
              <th className="px-4 py-2 text-left">Sucursal</th>
              <th className="px-4 py-2 text-left">Solicitante</th>
              <th className="px-4 py-2 text-left">Estado</th>
              <th className="px-4 py-2 text-left">Creada</th>
            </tr>
          </thead>
          <tbody>
            {data.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="px-4 py-2 font-mono">{r.id.slice(0, 8)}…</td>
                <td className="px-4 py-2">{r.branch}</td>
                <td className="px-4 py-2">{r.requester}</td>
                <td className="px-4 py-2">
                  <span className="inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs">
                    {r.status}
                  </span>
                </td>
                <td className="px-4 py-2">
                  {new Date(r.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
