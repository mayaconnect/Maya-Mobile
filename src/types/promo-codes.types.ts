/**
 * Maya Connect V2 — Partner Promo Codes Types
 */

export interface PartnerPromoCodeDto {
  id: string;
  /** Backend identifier used by mark-used endpoint */
  promoCodeId?: string;
  code: string;
  /** Identifiant du plan addon associé (ex: `shotgun`, `sunbed`) */
  planCode?: string | null;
  partnerName?: string | null;
  partnerLogoUrl?: string | null;
  discountPercent?: number | null;
  discountAmount?: number | null;
  description?: string | null;
  websiteUrl?: string | null;
  isUsed: boolean;
  usedAt?: string | null;
  expiresAt?: string | null;
  createdAt: string;
}

export interface PromoCodeExternalPartnerDto {
  externalPartnerId: string;
  name: string;
}
