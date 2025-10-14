// src/lib/api.ts
export async function getJSON<T = any>(path: string): Promise<T> {
  const url = path.startsWith('http') ? path : path;
  const res = await fetch(url, {
    method: 'GET',
    credentials: 'include',
    headers: { 'Accept': 'application/json' },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `GET ${path} failed: ${res.status}`);
  }
  return res.json();
}

export async function postJSON<T = any>(path: string, body: any): Promise<T> {
  const url = path.startsWith('http') ? path : path;
  const res = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `POST ${path} failed: ${res.status}`);
  }
  return res.json();
}

export async function patchJSON<T = any>(path: string, body?: any): Promise<T> {
  const url = path.startsWith('http') ? path : path;
  const res = await fetch(url, {
    method: 'PATCH',
    credentials: 'include',
    headers: body ? { 'Content-Type': 'application/json', 'Accept': 'application/json' } : { 'Accept': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `PATCH ${path} failed: ${res.status}`);
  }
  return res.json();
}
