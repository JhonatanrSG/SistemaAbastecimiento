/**
 * Puerto del repositorio de pedidos.
 * Patrón: Adapter (Ports & Adapters).
 */
export type OrderStatus = 'EN_PREPARACION' | 'LISTO' | 'ENTREGADO';

export interface OrderItemDTO { dishId: string; qty: number; }
export interface OrderDTO {
  tableNumber: string; waiterName: string; items: OrderItemDTO[];
}
export interface Order {
  id: string; tableNumber: string; waiterName: string;
  status: OrderStatus; createdAt: Date; items: OrderItemDTO[];
}

export interface OrderRepository {
  create(data: OrderDTO): Promise<{ id: string }>;
  list(params?: { status?: OrderStatus }): Promise<Order[]>;
  updateStatus(id: string, status: OrderStatus): Promise<void>;
}
