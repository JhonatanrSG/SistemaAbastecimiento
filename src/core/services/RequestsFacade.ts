/**
 * Facade para SupplyRequest.
 * Patrón: Facade — orquesta creación y notificación.
 */
import type { RequestRepository, SupplyRequestDTO, RequestFilters } from '@/core/ports/RequestRepository';

export class RequestsFacade {
  constructor(private repo: RequestRepository) {}

  async create(dto: SupplyRequestDTO) {
    const created = await this.repo.create(dto);
    // “Enviar” correo de confirmación (simulado)
    console.log(`[EMAIL] Solicitud registrada #${created.id}`);
    return created;
  }

  list(filters?: RequestFilters) {
    return this.repo.list(filters);
  }
}
