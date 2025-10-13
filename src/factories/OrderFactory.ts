/**
 * Factory Method para OrderDTO (validación/normalización).
 * Patrón: Factory Method (+ Zod).
 */
import { z } from 'zod';

export const OrderSchema = z.object({
  tableNumber: z.string().min(1, 'Mesa requerida'),
  waiterName:  z.string().min(1, 'Mesero requerido'),
  items: z.array(
    z.object({
      dishId: z.string().min(1),
      qty:    z.coerce.number().int().positive()
    })
  ).min(1, 'Debe haber al menos un plato')
});

export type OrderInput = z.infer<typeof OrderSchema>;
export type OrderDTO   = OrderInput;

abstract class OrderFactoryMethod {
  abstract create(input: unknown): OrderDTO;
}

export class DefaultOrderFactory extends OrderFactoryMethod {
  create(input: unknown): OrderDTO {
    const p = OrderSchema.parse(input);
    return { ...p, tableNumber: p.tableNumber.trim(), waiterName: p.waiterName.trim() };
  }
}
