import type { StandardPriceService } from '@/core/ports/StandardPriceService';

/**
 * Adapter mock: reemplázalo por un cliente HTTP real cuando tengas el servicio oficial.
 * Mapea productId -> precio estándar (en centavos).
 */
const MAP: Record<string, number> = {
  // Ajusta según tus ids reales:
  'seed-res':   320_000, // $3.200 * 100
  'seed-pollo': 120_000, // $1.200 * 100
};

export class MockMinCommerceAdapter implements StandardPriceService {
  async getStandardForProduct(productId: string): Promise<{ unitPriceCents: number }> {
    const unitPriceCents = MAP[productId] ?? 100_000; // fallback $1.000 * 100
    return { unitPriceCents };
  }
}
