/**
 * Factory Method para SupplyRequest (validación/normalización)
 * Patrón: Factory Method + Zod.
 */
import { z } from 'zod';

export const SupplyRequestSchema = z.object({
  branch: z.string().min(1, 'Sucursal requerida'),
  requester: z.string().min(1, 'Solicitante requerido'),
  items: z.array(
    z.object({
      productId: z.string().min(1),
      qty: z.coerce.number().positive(),
      uom: z.enum(['Kg','Lb','L','Unidad']),
      brand: z.string().optional()
    })
  ).min(1, 'Debe haber al menos un ítem')
});

export type SupplyRequestInput = z.infer<typeof SupplyRequestSchema>;
export type SupplyRequestDTO = SupplyRequestInput;

abstract class RequestFactoryMethod {
  abstract create(input: unknown): SupplyRequestDTO;
}

export class DefaultRequestFactory extends RequestFactoryMethod {
  create(input: unknown): SupplyRequestDTO {
    const data = SupplyRequestSchema.parse(input);
    return {
      branch: data.branch.trim(),
      requester: data.requester.trim(),
      items: data.items.map(i => ({
        ...i,
        brand: i.brand?.trim()
      }))
    };
  }
}
