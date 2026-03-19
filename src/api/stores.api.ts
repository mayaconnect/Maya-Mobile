/**
 * Maya Connect V2 — Stores API Module
 * /api/stores/* endpoints
 *
 * Role access:
 *   POST /search        → [Authorize] any role
 *   GET  /{id}          → [Authorize] any role
 *   GET  /subscribers   → StoreOperator, Partner, Admin
 *   GET  /{id}/details  → Admin only (do NOT call from mobile)
 */
import apiClient from './client';
import type { StoreDto, StoreDetailsDto, StoreSearchRequestDto, StoreSubscriberDto, StoreUpdateDto } from '../types';
import type { PagedResult } from '../types';

const BASE = '/api/stores';

export const storesApi = {
  /** POST /api/stores/search — any authenticated role */
  search: (dto: StoreSearchRequestDto) =>
    apiClient.post<PagedResult<StoreDto>>(`${BASE}/search`, dto),

  /** GET /api/stores/:id — any authenticated role (includes IsUsual flag) */
  getById: (id: string) =>
    apiClient.get<StoreDto>(`${BASE}/${id}`),

  /** GET /api/stores/subscribers — StoreOperator, Partner, Admin */
  getSubscribers: (params?: {
    partnerId?: string;
    storeId?: string;
    isActive?: boolean;
  }) => apiClient.get<StoreSubscriberDto[]>(`${BASE}/subscribers`, { params }),

  /**
   * GET /api/stores/:id/details — ⚠️ Admin only
   * Do NOT call from client/partner screens.
   */
  getDetails: (id: string) =>
    apiClient.get<StoreDetailsDto>(`${BASE}/${id}/details`),

  /**
   * Convenience: fetch stores belonging to a partner.
   * Uses POST /search with partnerId filter.
   */
  getByPartner: (partnerId: string, pageSize = 50) =>
    apiClient.post<PagedResult<StoreDto>>(`${BASE}/search`, {
      partnerId,
      pageSize,
    }),

  /**
   * PUT /api/stores/:id — Update store data (opening hours, contact, etc.)
   * Admin can update any store; Partner/StoreOperator can update their own stores only.
   */
  updateStore: (id: string, dto: StoreUpdateDto) =>
    apiClient.put<StoreDto>(`${BASE}/${id}`, dto),

  /**
   * POST /api/stores/:id/image — Upload store image (multipart, max 5MB)
   * Admin, Partner, StoreOperator (must be assigned to the store).
   */
  uploadImage: (id: string, formData: FormData) =>
    apiClient.post<{ imageUrl: string }>(`${BASE}/${id}/image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  /**
   * DELETE /api/stores/:id/image — Remove store image
   * Admin, Partner, StoreOperator (must be assigned to the store).
   */
  deleteImage: (id: string) =>
    apiClient.delete(`${BASE}/${id}/image`),
};
