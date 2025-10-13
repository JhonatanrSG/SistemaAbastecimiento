// Seguro para Client Components: usa rutas relativas
export async function getJSON<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    cache: 'no-store',
    headers: { 'content-type': 'application/json', ...(init?.headers as any) },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<T>;
}

export async function postJSON<T>(path: string, body: unknown, init?: RequestInit) {
  const res = await fetch(path, {
    method: 'POST',
    body: JSON.stringify(body),
    cache: 'no-store',
    headers: { 'content-type': 'application/json', ...(init?.headers as any) },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<T>;
}
