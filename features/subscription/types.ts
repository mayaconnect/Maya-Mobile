export interface SubscriptionPlan {
  id: string;
  name: 'solo' | 'duo' | 'family';
  price: number;
  billingCycle: 'monthly' | 'annual';
  features: string[];
}

export interface ActiveSubscription {
  id: string;
  planId: string;
  planName: string;
  status: 'active' | 'cancelled' | 'expired';
  startDate: string;
  endDate?: string;
  price: number;
  billingCycle: 'monthly' | 'annual';
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'paypal' | 'applepay' | 'googlepay';
  last4?: string;
  brand?: string;
}

