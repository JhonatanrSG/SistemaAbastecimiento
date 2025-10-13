import 'server-only';
import { absUrl } from './abs-url';

export async function getJSON<T>(path: string, init?: RequestInit): Promise<T> {
  const url = await absUrl(path);
  const res = await fetch(url, {
    ...init,
    cache: 'no-store',
    headers: { 'content-type': 'application/json', ...(init?.headers as any) },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<T>;
}

export async function postJSON<T>(path: string, body: unknown, init?: RequestInit) {
  const url = await absUrl(path);
  const res = await fetch(url, {
    method: 'POST',
    body: JSON.stringify(body),
    cache: 'no-store',
    headers: { 'content-type': 'application/json', ...(init?.headers as any) },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<T>;
}
