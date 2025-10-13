import 'server-only';
import { headers } from 'next/headers';

export async function absUrl(path: string): Promise<string> {
  const h = await headers();
  const proto = h.get('x-forwarded-proto') ?? 'http';
  const host  = h.get('x-forwarded-host') ?? h.get('host');
  return `${proto}://${host}${path}`;
}
