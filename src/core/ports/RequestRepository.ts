/**
 * Puerto del repositorio de SupplyRequest.
 * Patrón: Adapter (Ports & Adapters).
 */
export type RequestStatus = 'PENDIENTE'|'EN_TRAMITE'|'CERRADA';

export interface SupplyRequestItemDTO {
  productId: string; qty: number; uom: string; brand?: string;
}
export interface SupplyRequestDTO {
  branch: string; requester: string; items: SupplyRequestItemDTO[];
}
export interface SupplyRequestRow {
  id: string; branch: string; requester: string; status: RequestStatus; createdAt: Date;
  items: SupplyRequestItemDTO[];
}

export interface RequestFilters {
  from?: string; to?: string; productId?: string; brand?: string; status?: RequestStatus;
}

export interface RequestRepository {
  create(data: SupplyRequestDTO): Promise<{ id: string }>;
  list(filters?: RequestFilters): Promise<SupplyRequestRow[]>;
}
