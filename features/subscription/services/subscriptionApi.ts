import { ClientService } from '@/services/client.service';
import { SubscriptionsService } from '@/services/subscriptions.service';
import { PaymentService } from '@/services/payment.service';
import { ActiveSubscription } from '../types';

export const SubscriptionApi = {
  hasActiveSubscription: async (): Promise<boolean> => {
    try {
      return await ClientService.hasActiveSubscription();
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'abonnement:', error);
      throw error;
    }
  },

  getMySubscription: async (): Promise<ActiveSubscription | null> => {
    try {
      const subscription = await ClientService.getMySubscription();
      return subscription as ActiveSubscription | null;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'abonnement:', error);
      throw error;
    }
  },

  createCheckoutSession: async (planId: string, billingCycle: 'monthly' | 'annual'): Promise<string> => {
    try {
      const session = await PaymentService.createCheckoutSession({
        planId,
        billingCycle,
      });
      return session.sessionId || session.id || '';
    } catch (error) {
      console.error('Erreur lors de la création de la session de paiement:', error);
      throw error;
    }
  },

  getSubscriptionPlans: async () => {
    try {
      return await SubscriptionsService.getPlans();
    } catch (error) {
      console.error('Erreur lors de la récupération des plans:', error);
      throw error;
    }
  },
};

