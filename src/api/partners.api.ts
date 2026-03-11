/**
 * Maya Connect V2 — Partners API Module
 *
 * ⚠️  ALL /api/partners/* endpoints are **Admin-only** in the backend.
 *     Mobile client screens must NOT call these — use storesApi instead:
 *       • Browse merchants → storesApi.search()
 *       • Store detail     → storesApi.getById()
 *
 *     This file is kept for admin/backoffice tooling only.
 */
import apiClient from './client';
import type { PartnerDto, PartnerDetailsDto } from '../types';

const BASE = '/api/partners';

/**
 * Admin-only partner management endpoints.
 * Do NOT use from client or partner screens — they will return 403.
 */
export const partnersApi = {
  /** GET /api/partners — Admin only */
  getAll: (params?: {
    name?: string;
    email?: string;
    isActive?: boolean;
    page?: number;
    pageSize?: number;
  }) => apiClient.get<{ items: PartnerDto[]; totalCount: number }>(BASE, { params }),

  /** GET /api/partners/:id — Admin only */
  getById: (id: string) =>
    apiClient.get<PartnerDto>(`${BASE}/${id}`),

  /** GET /api/partners/:id/details — Admin only */
  getDetails: (id: string) =>
    apiClient.get<PartnerDetailsDto>(`${BASE}/${id}/details`),
};
