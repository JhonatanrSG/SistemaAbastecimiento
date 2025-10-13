/**
 * Facade de cliente web (simple) que usa el Singleton ApiClient.
 * Patrones: Facade (del lado front) + Singleton (ApiClient).
 */
import { ApiClient } from '@/lib/ApiClient';
import type { Category, Dish } from '@/domain/catalog/Composite';

const api = ApiClient.getInstance();

export function fetchCategories(): Promise<Category[]> {
  return api.get('/categories');
}
export function fetchDishes(): Promise<Dish[]> {
  return api.get('/dishes');
}
