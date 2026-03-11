/**
 * Maya Connect V2 — Referentiel API Module
 * /api/referentiel/* endpoints (read-only reference data)
 */
import apiClient from './client';
import type { StoreCategoryDto } from '../types';

const BASE = '/api/referentiel';

export const referentielApi = {
  /** GET /api/referentiel/store-categories */
  getStoreCategories: () =>
    apiClient.get<StoreCategoryDto[]>(`${BASE}/store-categories`),
};
