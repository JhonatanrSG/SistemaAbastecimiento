// src/lib/api.ts
export async function getJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, credentials: 'include' });
  if (!res.ok) throw new Error(await safeMsg(res));
  return res.json() as Promise<T>;
}

export async function postJSON<T = unknown>(url: string, body: unknown, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    body: JSON.stringify(body),
    credentials: 'include',
    ...init,
  });
  if (!res.ok) throw new Error(await safeMsg(res));
  return (await res.json()) as T;
}

export async function patchJSON<T = unknown>(url: string, body: unknown, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    body: JSON.stringify(body),
    credentials: 'include',
    ...init,
  });
  if (!res.ok) throw new Error(await safeMsg(res));
  return (await res.json()) as T;
}

async function safeMsg(res: Response) {
  try {
    const j = await res.json();
    return j?.error ?? `${res.status} ${res.statusText}`;
  } catch {
    return `${res.status} ${res.statusText}`;
  }
}
