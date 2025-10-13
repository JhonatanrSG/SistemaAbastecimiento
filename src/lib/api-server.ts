// Llama endpoints de /api/* desde Server Components armando URL absoluta.
import { headers } from 'next/headers';

export async function getJSONServer<T>(path: string, init?: RequestInit): Promise<T> {
  const h = await headers();
  const proto = h.get('x-forwarded-proto') ?? 'http';
  const host = h.get('host');
  if (!host) throw new Error('No Host header');

  const url = `${proto}://${host}${path}`;
  const res = await fetch(url, { ...init, cache: 'no-store' });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`GET ${path} -> ${res.status} ${txt}`);
  }
  return res.json() as Promise<T>;
}

export async function postJSONServer<T>(path: string, body: unknown, init?: RequestInit): Promise<T> {
  const h = await headers();
  const proto = h.get('x-forwarded-proto') ?? 'http';
  const host = h.get('host');
  if (!host) throw new Error('No Host header');

  const url = `${proto}://${host}${path}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
    body: JSON.stringify(body),
    cache: 'no-store',
    ...init,
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`POST ${path} -> ${res.status} ${txt}`);
  }
  return res.json() as Promise<T>;
}
