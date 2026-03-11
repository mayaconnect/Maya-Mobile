/**
 * Maya Connect V2 — Clients API Module
 *
 * The backend controller is UsersController at /api/Users (NOT /api/clients).
 * - GET  /api/Users/me/has-subscription  → [Authorize] any role
 * - GET  /api/Users/me/subscription      → [Authorize] any role
 * - GET  /api/Users/{id}                 → Admin only
 * - PUT  /api/Users/{id}                 → Admin only
 *
 * For profile read/update, prefer authApi.getProfile() / authApi.updateProfile().
 */
import apiClient from './client';
import type { UserProfile } from '../types';

const BASE = '/api/Users';

export const clientsApi = {
  /** GET /api/Users/me/has-subscription — any authenticated user */
  hasSubscription: () =>
    apiClient.get<{ hasSubscription: boolean }>(`${BASE}/me/has-subscription`),

  /** GET /api/Users/me/subscription — any authenticated user */
  getMySubscription: () =>
    apiClient.get(`${BASE}/me/subscription`),

  /** GET /api/Users/{id} — Admin only */
  getById: (id: string) =>
    apiClient.get<UserProfile>(`${BASE}/${id}`),

  /** PUT /api/Users/{id} — Admin only */
  update: (userId: string, dto: Partial<UserProfile>) =>
    apiClient.put(`${BASE}/${userId}`, dto),
};
