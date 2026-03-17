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
