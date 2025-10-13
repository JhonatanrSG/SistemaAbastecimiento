export interface StandardPriceService {
  getStandardForProduct(productId: string): Promise<{ unitPriceCents: number }>;
}
