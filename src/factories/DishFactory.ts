/**
 * Factory Method para construir/validar DishDTO desde input externo (form/API).
 * Patrón aplicado: Factory Method + Validación (Zod).
 */
import { z } from 'zod';

export const DishSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  categoryId: z.string().min(1, 'Categoría requerida'),
  priceCents: z.coerce.number().int().nonnegative(),
  recipe: z.array(
    z.object({
      productId: z.string().min(1),
      qty: z.coerce.number().positive(),
      uom: z.enum(['Kg', 'Lb', 'L', 'Unidad'])
    })
  ).min(1, 'La receta debe tener al menos un ingrediente')
});

export type DishInput = z.infer<typeof DishSchema>;
export type DishDTO = DishInput;

abstract class DishFactoryMethod {
  abstract create(input: unknown): DishDTO;
}

export class DefaultDishFactory extends DishFactoryMethod {
  create(input: unknown): DishDTO {
    const parsed = DishSchema.parse(input);
    // normalizaciones simples
    return { ...parsed, name: parsed.name.trim() };
  }
}
