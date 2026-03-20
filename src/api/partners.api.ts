/**
 * Maya Connect V2 — Partners API Module
 *
 * Some endpoints are Admin-only; image endpoints are accessible to Partner role.
 */
import apiClient from './client';
import type { PartnerDto, PartnerDetailsDto } from '../types';

const BASE = '/api/partners';

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

  /**
   * POST /api/partners/:id/image — Upload partner profile image (Admin, Partner)
   * Max 5MB, image/* only.
   * Note: Content-Type is intentionally undefined so React Native's native XHR
   * can set the correct multipart/form-data boundary automatically.
   */
  uploadImage: (id: string, formData: FormData) =>
    apiClient.post<{ url: string }>(`${BASE}/${id}/image`, formData, {
      headers: { 'Content-Type': undefined },
    }),

  /**
   * DELETE /api/partners/:id/image — Remove partner profile image (Admin, Partner)
   */
  deleteImage: (id: string) =>
    apiClient.delete(`${BASE}/${id}/image`),
};
