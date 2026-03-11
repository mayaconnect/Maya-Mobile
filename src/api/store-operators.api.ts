/**
 * Maya Connect V2 — Store Operators API Module
 */
import apiClient from './client';
import type {
  StoreOperatorDto,
  SetActiveStoreDto,
  StoreOperatorLiteDto,
  MyPartnerStoresDto,
  CreateStoreOperatorDto,
  CreateStoreOperatorResultDto,
} from '../types';

const BASE = '/api/v1/store-operators';

export const storeOperatorsApi = {
  /** GET /api/v1/store-operators/active-store */
  getActiveStore: () =>
    apiClient.get<StoreOperatorDto>(`${BASE}/active-store`),

  /** POST /api/v1/store-operators/set-active-store */
  setActiveStore: (dto: SetActiveStoreDto) =>
    apiClient.post(`${BASE}/set-active-store`, dto),

  /** GET /api/v1/store-operators/my-partner-stores */
  getMyPartnerStores: () =>
    apiClient.get<MyPartnerStoresDto>(`${BASE}/my-partner-stores`),

  /** GET /api/v1/store-operators/by-partner/:partnerId */
  getOperatorsByPartner: (partnerId: string) =>
    apiClient.get<StoreOperatorLiteDto[]>(`${BASE}/by-partner/${partnerId}`),

  /** POST /api/v1/store-operators/assign */
  assignOperator: (dto: { userId: string; storeId: string; isManager?: boolean }) =>
    apiClient.post(`${BASE}/assign`, dto),

  /** DELETE /api/v1/store-operators/remove */
  removeOperator: (dto: { userId: string; storeId: string }) =>
    apiClient.delete(`${BASE}/remove`, { data: dto }),

  /** POST /api/v1/store-operators/toggle-manager */
  toggleManager: (dto: { userId: string; storeId: string }) =>
    apiClient.post(`${BASE}/toggle-manager`, dto),

  /** POST /api/v1/store-operators/create */
  createOperator: (dto: CreateStoreOperatorDto) =>
    apiClient.post<CreateStoreOperatorResultDto>(`${BASE}/create`, dto),
};
