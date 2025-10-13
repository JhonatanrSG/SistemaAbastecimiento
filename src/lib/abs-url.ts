// Puente: en cliente devuelve el path tal cual; en server usa headers()
export async function toUrl(path: string): Promise<string> {
  if (typeof window !== 'undefined') return path;  // cliente
  const { absUrl } = await import('./server/abs-url'); // server-only
  return absUrl(path);
}
