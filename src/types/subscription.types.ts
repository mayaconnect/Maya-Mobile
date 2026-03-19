/**
 * Maya Connect V2 — Subscription & Payment Types
 */

export interface SubscriptionPlanDto {
  id: string;
  code?: string | null;
  name?: string | null;
  theme?: string | null;
  defaultPercent: number;
  defaultSeats?: number | null;
  priceAmount: number;
  stripePriceId?: string | null;
  currency?: string | null;
  trialDays?: number | null;
  isActive: boolean;
  createdAt: string;
  /** Plan hierarchy level: SOLO=1, DUO=2, FAMILY=3, VIP=4 */
  tier: number;
}

export interface SubscriptionDto {
  id: string;
  partnerId: string;
  planCode?: string | null;
  price: number;
  personsAllowed: number;
  isActive: boolean;
  startedAt: string;
  expiresAt?: string | null;
}

export interface SubscriptionTableDto {
  id: string;
  planId: string;
  status?: string | null;
  startAt: string;
  endAt?: string | null;
  stripeSubscriptionId?: string | null;
  autoRenew: boolean;
  seatsGranted: number;
  createdAt: string;
}

export interface CreateCheckoutRequest {
  planCode: string;
  successUrl: string;
  cancelUrl: string;
}

export interface ChangePlanRequest {
  newPlanCode: string;
  successUrl?: string;
  cancelUrl?: string;
}

export interface ChangePlanResult {
  success: boolean;
  oldPlanCode?: string | null;
  newPlanCode: string;
  proratedAmount?: number | null;
  message: string;
  isUpgrade: boolean;
  effectiveDate?: string | null;
}

export interface PlanChangePreview {
  canChange: boolean;
  isUpgrade: boolean;
  currentPlanCode?: string | null;
  newPlanCode: string;
  currentTier: number;
  newTier: number;
  proratedAmount?: number | null;
  effectiveDate: string;
  cooldownRemainingDays: number;
  message: string;
}

export interface InvoiceDto {
  id: string;
  userId: string;
  number: string;
  amount: number;
  currency: string;
  taxAmount: number;
  pdfPath: string;
  status: string;
  createdAt: string;
}
