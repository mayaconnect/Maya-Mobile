/**
 * Maya Connect V2 — Subscriptions & Payments API Module
 *
 * Role access:
 *   GET  /subscription-plans         → Admin, Client
 *   GET  /subscription-plans/{id}    → Admin only
 *   GET  /Users/me/has-subscription  → [Authorize] any role
 *   GET  /Users/me/subscription      → [Authorize] any role
 *   POST /payments/create-checkout-session → [Authorize] any role
 *   POST /payments/cancel-subscription    → [Authorize] any role
 */
import apiClient from './client';
import type {
  SubscriptionPlanDto,
  SubscriptionDto,
  AddonSubscriptionDto,
  CreateCheckoutRequest,
  ChangePlanRequest,
  ChangePlanResult,
  PlanChangePreview,
  InvoiceDto,
} from '../types';
import type { PagedResult } from '../types';

export const subscriptionsApi = {
  /** GET /api/subscription-plans — Admin, Client */
  getPlans: (params?: { page?: number; pageSize?: number }) =>
    apiClient.get<PagedResult<SubscriptionPlanDto>>(
      '/api/subscription-plans',
      { params },
    ),

  /**
   * GET /api/subscription-plans/:id — ⚠️ Admin only
   * Do NOT call from client mobile screens.
   */
  getPlanById: (id: string) =>
    apiClient.get<SubscriptionPlanDto>(`/api/subscription-plans/${id}`),

  /** GET /api/Users/me/has-subscription — any authenticated user */
  hasSubscription: () =>
    apiClient.get<{ hasSubscription: boolean }>('/api/Users/me/has-subscription'),

  /** GET /api/Users/me/subscription — any authenticated user */
  getMySubscription: () =>
    apiClient.get<SubscriptionDto>('/api/Users/me/subscription'),

  /** GET /api/users/me/addon-subscriptions — add-ons actifs (Shotgun, Sunbed…) */
  getMyAddonSubscriptions: () =>
    apiClient.get<AddonSubscriptionDto[]>('/api/users/me/addon-subscriptions'),
};

export const paymentsApi = {
  /** POST /api/payments/create-checkout-session — any authenticated user */
  createCheckoutSession: (dto: CreateCheckoutRequest) =>
    apiClient.post<{ url: string; sessionId: string }>(
      '/api/payments/create-checkout-session',
      dto,
    ),

  /** POST /api/payments/cancel-subscription — any authenticated user */
  cancelSubscription: () =>
    apiClient.post('/api/payments/cancel-subscription'),

  /** POST /api/payments/change-plan — swap active subscription to another plan */
  changePlan: (dto: ChangePlanRequest) =>
    apiClient.post<ChangePlanResult>(
      '/api/payments/change-plan',
      dto,
    ),

  /** POST /api/payments/preview-plan-change — preview proration, cooldown, upgrade/downgrade info */
  previewPlanChange: (dto: ChangePlanRequest) =>
    apiClient.post<PlanChangePreview>(
      '/api/payments/preview-plan-change',
      dto,
    ),

  /** GET /api/payments/my-invoices — client's own invoices */
  getMyInvoices: () =>
    apiClient.get<InvoiceDto[]>('/api/payments/my-invoices'),
};
