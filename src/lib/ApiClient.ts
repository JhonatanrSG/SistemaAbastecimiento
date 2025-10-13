/**
 * ApiClient como SINGLETON para llamadas HTTP del front.
 * Patrón aplicado: Singleton.
 */
export class ApiClient {
  private static instance: ApiClient;
  private constructor(private base = '/api') {}

  static getInstance() {
    return (
      this.instance ??
      (this.instance = new ApiClient(process.env.NEXT_PUBLIC_API_URL || '/api'))
    );
  }

  async get<T>(path: string): Promise<T> {
    const res = await fetch(`${this.base}${path}`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json() as Promise<T>;
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${this.base}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json() as Promise<T>;
  }
}
