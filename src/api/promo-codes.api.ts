/**
 * Maya Connect V2 — Partner Promo Codes API
 *
 * GET  /api/my-promo-codes               → list partner's promo codes
 * POST /api/my-promo-codes/{id}/mark-used → mark a code as consumed
 */
import apiClient from './client';
import type { PartnerPromoCodeDto, PromoCodeExternalPartnerDto } from '../types';

export const promoCodesApi = {
  /** GET /api/my-promo-codes — authenticated partner */
  getMyPromoCodes: () =>
    apiClient.get<PartnerPromoCodeDto[]>('/api/my-promo-codes'),

  /** GET /api/my-promo-codes/external-partners — list partners that can receive codes */
  getExternalPartners: () =>
    apiClient.get<PromoCodeExternalPartnerDto[]>('/api/my-promo-codes/external-partners'),

  /** POST /api/my-promo-codes/{id}/mark-used */
  markUsed: (id: string) =>
    apiClient.post<void>(`/api/my-promo-codes/${id}/mark-used`),

  /**
   * POST /api/my-promo-codes/assign-by-partner
   * Assigns (generates) a new promo code for a given partner.
   */
  assignByPartner: (externalPartnerId: string) =>
    apiClient.post<PartnerPromoCodeDto[]>('/api/my-promo-codes/assign-by-partner', {
      externalPartnerId,
    }),
};
