/**
 * Maya Connect V2 — Transactions API Module
 */
import apiClient from './client';
import type {
  TransactionDto,
  SavingsByCategoryDto,
  SavingsByPeriodDto,
} from '../types';
import type { PagedResult } from '../types';

const BASE = '/api/transactions';

export const transactionsApi = {
  /** GET /api/transactions/partner/:partnerId */
  getByPartner: (partnerId: string, params?: {
    storeId?: string;
    page?: number;
    pageSize?: number;
  }) => apiClient.get<PagedResult<TransactionDto>>(
    `${BASE}/partner/${partnerId}`,
    { params },
  ),

  /** GET /api/transactions/user/:userId */
  getByUser: (userId: string, params?: {
    isOperator?: boolean;
    page?: number;
    pageSize?: number;
  }) => apiClient.get<PagedResult<TransactionDto>>(
    `${BASE}/user/${userId}`,
    { params },
  ),

  /** GET /api/transactions/scancount */
  getScanCount: (params?: {
    partnerId?: string;
    storeId?: string;
    since?: string;
  }) => apiClient.get<{ count: number }>(`${BASE}/scancount`, { params }),

  /** GET /api/transactions/user/:userId/savings/by-category */
  getSavingsByCategory: (userId: string) =>
    apiClient.get<SavingsByCategoryDto[]>(
      `${BASE}/user/${userId}/savings/by-category`,
    ),

  /** GET /api/transactions/user/:userId/savings/:period */
  getSavingsByPeriod: (userId: string, period: string) =>
    apiClient.get<SavingsByPeriodDto[]>(
      `${BASE}/user/${userId}/savings/${period}`,
    ),

  /** GET /api/transactions/filtered */
  getFiltered: (params?: {
    PartnerId?: string;
    StoreId?: string;
    OperatorUserId?: string;
    CustomerUserId?: string;
    Since?: string;
    Until?: string;
    Page?: number;
    PageSize?: number;
  }) => apiClient.get<PagedResult<TransactionDto>>(
    `${BASE}/filtered`,
    { params },
  ),
};
