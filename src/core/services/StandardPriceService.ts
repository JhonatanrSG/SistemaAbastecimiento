// p.ej. src/core/services/StandardPriceService.ts
export interface IStandardPriceService {
  getUnitPriceCents(productId: string): Promise<number>;
}

// y tu implementación concreta implementa esa interfaz
export class StandardPriceService implements IStandardPriceService {
  async getUnitPriceCents(productId: string): Promise<number> {
    // ...
    return 0;
  }
}
