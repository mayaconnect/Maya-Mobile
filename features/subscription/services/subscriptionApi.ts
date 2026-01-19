import { ProfileApi } from '@/features/profile/services/profileApi';
import { ActiveSubscription } from '../types';
import { PaymentApi } from './paymentApi';
import { SubscriptionsApi } from './subscriptionsApi';

export const SubscriptionApi = {
  hasActiveSubscription: async (): Promise<boolean> => {
    try {
      return await ProfileApi.hasActiveSubscription();
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'abonnement:', error);
      throw error;
    }
  },

  getMySubscription: async (): Promise<ActiveSubscription | null> => {
    try {
      const subscription = await ProfileApi.getMySubscription();
      return subscription as ActiveSubscription | null;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'abonnement:', error);
      throw error;
    }
  },

  createCheckoutSession: async (planId: string, billingCycle: 'monthly' | 'annual'): Promise<string> => {
    try {
      const session = await PaymentApi.createCheckoutSession({
        planId,
        billingCycle,
      });
      return session.sessionId || '';
    } catch (error) {
      console.error('Erreur lors de la création de la session de paiement:', error);
      throw error;
    }
  },

  getSubscriptionPlans: async () => {
    try {
      return await SubscriptionsApi.getPlans();
    } catch (error) {
      console.error('Erreur lors de la récupération des plans:', error);
      throw error;
    }
  },
};

