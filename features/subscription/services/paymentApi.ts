import { API_BASE_URL } from '@/services/auth.service';
import { apiCall } from '@/services/shared/api';
import { ApiClient } from '@/services/shared/api-client';
import { log } from '@/utils/logger';
import { Platform } from 'react-native';

const PAYMENTS_API_BASE_URL = API_BASE_URL.replace(/\/api\/v1$/i, '/api');

// Wrapper pour les appels API de paiement avec le bon baseUrl
const paymentsApiCall = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  return apiCall<T>(endpoint, options, 0, PAYMENTS_API_BASE_URL);
};

export type PaymentMethod = 'card' | 'paypal' | 'applepay' | 'googlepay';

export interface PaymentRequest {
  amount: number;
  currency: string;
  planId: string;
  planName: string;
  billingCycle: 'monthly' | 'annual';
  paymentMethod: PaymentMethod;
}

export interface PaymentResponse {
  success: boolean;
  transactionId?: string;
  error?: string;
  message?: string;
}

export const PaymentApi = {
  /**
   * Traiter un paiement via PayPal
   */
  processPayPalPayment: async (request: PaymentRequest): Promise<PaymentResponse> => {
    try {
      log.info('Traitement du paiement PayPal', { request });
      
      // TODO: Intégrer le SDK PayPal réel
      // Simulation du processus PayPal
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const transactionId = `PP-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      
      log.info('Paiement PayPal réussi', { transactionId });
      
      return {
        success: true,
        transactionId,
        message: 'Paiement PayPal effectué avec succès',
      };
    } catch (error) {
      log.error('Erreur paiement PayPal', error as Error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur lors du paiement PayPal',
      };
    }
  },

  /**
   * Traiter un paiement via Apple Pay
   */
  processApplePayPayment: async (request: PaymentRequest): Promise<PaymentResponse> => {
    try {
      log.info('Traitement du paiement Apple Pay', { request });
      
      // Vérifier si Apple Pay est disponible
      const isAvailable = await PaymentApi.isApplePayAvailable();
      if (!isAvailable) {
        throw new Error('Apple Pay n\'est pas disponible sur cet appareil');
      }
      
      // Simulation du processus Apple Pay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const transactionId = `AP-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      
      log.info('Paiement Apple Pay réussi', { transactionId });
      
      return {
        success: true,
        transactionId,
        message: 'Paiement Apple Pay effectué avec succès',
      };
    } catch (error) {
      log.error('Erreur paiement Apple Pay', error as Error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur lors du paiement Apple Pay',
      };
    }
  },

  /**
   * Traiter un paiement via Google Pay
   */
  processGooglePayPayment: async (request: PaymentRequest): Promise<PaymentResponse> => {
    try {
      log.info('Traitement du paiement Google Pay', { request });
      
      // Simulation du processus Google Pay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const transactionId = `GP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      log.info('Paiement Google Pay réussi', { transactionId });
      
      return {
        success: true,
        transactionId,
        message: 'Paiement Google Pay effectué avec succès',
      };
    } catch (error) {
      log.error('Erreur paiement Google Pay', error as Error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur lors du paiement Google Pay',
      };
    }
  },

  /**
   * Traiter un paiement via carte bancaire
   */
  processCardPayment: async (request: PaymentRequest): Promise<PaymentResponse> => {
    try {
      log.info('Traitement du paiement par carte', { request }  );
      
      // TODO: Intégrer Stripe pour les paiements par carte
      // Pour l'instant, simulation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const transactionId = `CARD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      log.info('Paiement par carte réussi', { transactionId });
      
      return {
        success: true,
        transactionId,
        message: 'Paiement par carte effectué avec succès',
      };
    } catch (error) {
      log.error('Erreur paiement par carte', error as Error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur lors du paiement par carte',
      };
    }
  },

  /**
   * Traiter un paiement (méthode principale)
   */
  processPayment: async (request: PaymentRequest): Promise<PaymentResponse> => {
    log.info('Début du traitement du paiement', { request });
    
    switch (request.paymentMethod) {
      case 'paypal':
        return await PaymentApi.processPayPalPayment(request);
      case 'applepay':
        return await PaymentApi.processApplePayPayment(request);
      case 'googlepay':
        return await PaymentApi.processGooglePayPayment(request);
      case 'card':
        return await PaymentApi.processCardPayment(request);
      default:
        return {
          success: false,
          error: 'Méthode de paiement non supportée',
        };
    }
  },

  /**
   * Vérifier si Apple Pay est disponible
   */
  isApplePayAvailable: async (): Promise<boolean> => {
    // TODO: Vérifier avec expo-apple-authentication
    // Pour l'instant, retourner true sur iOS
    try {
      return Platform.OS === 'ios';
    } catch {
      return false;
    }
  },

  /**
   * Vérifier si Google Pay est disponible
   */
  isGooglePayAvailable: async (): Promise<boolean> => {
    // TODO: Vérifier avec react-native-google-pay
    // Pour l'instant, retourner true sur Android
    try {
      return Platform.OS === 'android';
    } catch {
      return false;
    }
  },

  /**
   * Créer une session de checkout pour un abonnement
   * POST /api/payments/create-checkout-session
   * 
   * @param planCode - Code du plan d'abonnement (ex: "Solo", "Duo", "Family")
   * @param successUrl - URL de redirection en cas de succès (peut contenir {CHECKOUT_SESSION_ID})
   * @param cancelUrl - URL de redirection en cas d'annulation
   * @param billingCycle - Cycle de facturation ("monthly" ou "annual") - optionnel
   * @returns CreateCheckoutResult contenant sessionId et url
   */
  createCheckoutSession: async (
    planCodeOrParams: string | { planId: string; billingCycle: 'monthly' | 'annual' },
    successUrl?: string,
    cancelUrl?: string,
    billingCycle?: 'monthly' | 'annual'
  ): Promise<{ sessionId: string; url: string }> => {
    // Support de deux signatures pour compatibilité
    let planCode: string;
    let finalSuccessUrl: string;
    let finalCancelUrl: string;
    let finalBillingCycle: 'monthly' | 'annual' | undefined;

    if (typeof planCodeOrParams === 'string') {
      // Ancienne signature: createCheckoutSession(planCode, successUrl, cancelUrl, billingCycle?)
      planCode = planCodeOrParams;
      finalSuccessUrl = successUrl || 'maya://subscription/success';
      finalCancelUrl = cancelUrl || 'maya://subscription/cancel';
      finalBillingCycle = billingCycle;
    } else {
      // Nouvelle signature: createCheckoutSession({ planId, billingCycle })
      planCode = planCodeOrParams.planId;
      finalSuccessUrl = 'maya://subscription/success';
      finalCancelUrl = 'maya://subscription/cancel';
      finalBillingCycle = planCodeOrParams.billingCycle;
    }

    log.info('Création de la session de checkout', {
      planCode,
      successUrl: finalSuccessUrl,
      cancelUrl: finalCancelUrl,
      billingCycle: finalBillingCycle,
    });

    try {
      const requestBody: any = {
        planCode,
        successUrl: finalSuccessUrl,
        cancelUrl: finalCancelUrl,
      };
      
      if (finalBillingCycle) {
        requestBody.billingCycle = finalBillingCycle;
      }

      const response = await ApiClient.post<{ sessionId: string; url: string }>(
        '/payments/create-checkout-session',
        requestBody,
        {
          baseUrlOverride: PAYMENTS_API_BASE_URL,
        }
      );

      if (!response || (!response.url && !response.sessionId)) {
        throw new Error('Réponse invalide de l\'API: URL ou sessionId manquant');
      }

      return {
        sessionId: response.sessionId || '',
        url: response.url || '',
      };
    } catch (error) {
      log.error('Erreur lors de la création de la session', error as Error);
      throw error;
    }
  },

  /**
   * Vérifier le statut d'une session de paiement Stripe
   * GET /api/payments/checkout-session/{sessionId}
   */
  checkPaymentSessionStatus: async (
    sessionId: string
  ): Promise<{
    status: 'complete' | 'open' | 'expired' | 'processing' | 'error';
    paymentStatus?: 'paid' | 'unpaid' | 'no_payment_required';
    subscriptionId?: string;
    customerEmail?: string;
    message?: string;
  }> => {
    log.info('Vérification du statut de la session', { sessionId });

    try {
      const response = await ApiClient.get<{
        status: string;
        paymentStatus?: string;
        subscriptionId?: string;
        customerEmail?: string;
        message?: string;
      }>(`/payments/checkout-session/${encodeURIComponent(sessionId)}`, {
        baseUrlOverride: PAYMENTS_API_BASE_URL,
      });

      const normalizedStatus = (response?.status || 'error').toLowerCase() as
        'complete' | 'open' | 'expired' | 'processing' | 'error';

      return {
        status: normalizedStatus,
        paymentStatus: response?.paymentStatus as 'paid' | 'unpaid' | 'no_payment_required' | undefined,
        subscriptionId: response?.subscriptionId,
        customerEmail: response?.customerEmail,
        message: response?.message,
      };
    } catch (error) {
      log.error('Erreur lors de la vérification du statut', error as Error);

      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Erreur lors de la vérification du statut',
      };
    }
  },

  /**
   * Traiter un webhook de paiement après confirmation
   * POST /api/payments/webhook
   * 
   * Cette méthode est appelée UNIQUEMENT après que le paiement soit confirmé et validé.
   * Elle déclenche la mise à jour de l'abonnement dans la base de données.
   * 
   * @param webhookData - Données du webhook incluant sessionId, status, etc.
   * @returns Résultat du traitement du webhook
   */
  processWebhook: async (webhookData: {
    sessionId: string;
    status: string;
    paymentStatus?: string;
    subscriptionId?: string;
  }): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> => {
    console.log('🔔 [Payments Service] processWebhook appelé après paiement confirmé');
    console.log('📋 [Payments Service] Données du webhook:', webhookData);

    try {
      const startTime = Date.now();
      
      const response = await paymentsApiCall<{
        success: boolean;
        message?: string;
        error?: string;
      }>('/payments/webhook', {
        method: 'POST',
        body: JSON.stringify(webhookData),
      });
      
      const duration = Date.now() - startTime;

      console.log('✅ [Payments Service] Webhook traité avec succès', {
        duration: duration + 'ms',
        success: response?.success,
        message: response?.message,
      });

      return {
        success: response?.success ?? false,
        message: response?.message,
        error: response?.error,
      };
    } catch (error) {
      console.error('❌ [Payments Service] Erreur lors du traitement du webhook:', error);
      
      if (error instanceof Error) {
        console.error('❌ [Payments Service] Détails de l\'erreur:', {
          message: error.message,
          name: error.name,
        });
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur lors du traitement du webhook',
      };
    }
  },
};

