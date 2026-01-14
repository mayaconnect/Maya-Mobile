/**
 * Service de paiement pour Maya
 * Gère les paiements via PayPal, Apple Pay, Google Pay et cartes bancaires
 */

import { API_BASE_URL, AuthService } from './auth.service';
import { apiCall } from './shared/api';

const PAYMENTS_API_BASE_URL = API_BASE_URL.replace(/\/api\/v1$/i, '/api');

const paymentsApiCall = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  const token = await AuthService.getAccessToken();
  console.log('🔑 [Payments Service] Token disponible:', token ? token.substring(0, 20) + '...' : 'Aucun');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
    console.log('✅ [Payments Service] Token ajouté aux headers');
  } else {
    console.warn('⚠️ [Payments Service] Aucun token disponible');
  }

  const finalOptions: RequestInit = {
    ...options,
    headers,
  };

  console.log('📤 [Payments Service] Options de requête:', {
    method: finalOptions.method || 'GET',
    hasBody: !!finalOptions.body,
    hasAuth: !!headers.Authorization,
    headers: Object.keys(headers),
  });

  return apiCall<T>(endpoint, finalOptions, 0, PAYMENTS_API_BASE_URL);
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

/**
 * Service de paiement
 */
export const PaymentService = {
  /**
   * Traiter un paiement via PayPal
   */
  processPayPalPayment: async (request: PaymentRequest): Promise<PaymentResponse> => {
    try {
      console.log('💳 Traitement du paiement PayPal:', request);
      
      // TODO: Intégrer le SDK PayPal réel
      // Options possibles:
      // 1. react-native-paypal (si disponible)
      // 2. PayPal REST API directement
      // 3. Via Stripe (Stripe supporte PayPal)
      
      // Simulation du processus PayPal
      // Étape 1: Initialiser la session PayPal
      console.log('📱 Initialisation de la session PayPal...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Étape 2: Ouvrir le flux PayPal (simulation)
      console.log('🔐 Ouverture du flux PayPal...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Étape 3: Confirmation du paiement
      console.log('✅ Confirmation PayPal...');
      
      // Générer un ID de transaction simulé
      const transactionId = `PP-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      
      console.log('✅ Paiement PayPal réussi:', transactionId);
      
      return {
        success: true,
        transactionId,
        message: 'Paiement PayPal effectué avec succès',
      };
    } catch (error) {
      console.error('❌ Erreur paiement PayPal:', error);
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
      console.log('🍎 Traitement du paiement Apple Pay:', request);
      
      // TODO: Intégrer Apple Pay réel
      // Options:
      // 1. react-native-apple-pay (nécessite un build natif)
      // 2. Via Stripe (Stripe supporte Apple Pay nativement)
      // 3. Apple Pay JS (pour web)
      
      // Vérifier si Apple Pay est disponible
      const isAvailable = await PaymentService.isApplePayAvailable();
      if (!isAvailable) {
        throw new Error('Apple Pay n\'est pas disponible sur cet appareil');
      }
      
      // Simulation du processus Apple Pay
      // Étape 1: Présenter Apple Pay
      console.log('📱 Présentation d\'Apple Pay...');
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Étape 2: Authentification (Face ID / Touch ID)
      console.log('🔐 Authentification biométrique...');
      await new Promise(resolve => setTimeout(resolve, 700));
      
      // Étape 3: Traitement de la transaction
      console.log('💳 Traitement de la transaction...');
      
      // Générer un ID de transaction simulé
      const transactionId = `AP-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      
      console.log('✅ Paiement Apple Pay réussi:', transactionId);
      
      return {
        success: true,
        transactionId,
        message: 'Paiement Apple Pay effectué avec succès',
      };
    } catch (error) {
      console.error('❌ Erreur paiement Apple Pay:', error);
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
      console.log('📱 Traitement du paiement Google Pay:', request);
      
      // Simulation du processus Google Pay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const transactionId = `GP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      console.log('✅ Paiement Google Pay réussi:', transactionId);
      
      return {
        success: true,
        transactionId,
        message: 'Paiement Google Pay effectué avec succès',
      };
    } catch (error) {
      console.error('❌ Erreur paiement Google Pay:', error);
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
      console.log('💳 Traitement du paiement par carte:', request);
      
      // TODO: Intégrer Stripe pour les paiements par carte
      // Pour l'instant, simulation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const transactionId = `CARD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      console.log('✅ Paiement par carte réussi:', transactionId);
      
      return {
        success: true,
        transactionId,
        message: 'Paiement par carte effectué avec succès',
      };
    } catch (error) {
      console.error('❌ Erreur paiement par carte:', error);
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
    console.log('🚀 Début du traitement du paiement:', request);
    
    switch (request.paymentMethod) {
      case 'paypal':
        return await PaymentService.processPayPalPayment(request);
      case 'applepay':
        return await PaymentService.processApplePayPayment(request);
      case 'googlepay':
        return await PaymentService.processGooglePayPayment(request);
      case 'card':
        return await PaymentService.processCardPayment(request);
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
      const { Platform } = require('react-native');
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
      const { Platform } = require('react-native');
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
   * @param billingCycle - Cycle de facturation ("monthly" ou "annual") - optionnel, peut être géré par le planCode
   * @returns CreateCheckoutResult contenant sessionId et url
   */
  createCheckoutSession: async (
    planCode: string,
    successUrl: string,
    cancelUrl: string,
    billingCycle?: 'monthly' | 'annual'
  ): Promise<{ sessionId: string; url: string }> => {
    console.log('💳 [Payments Service] createCheckoutSession appelé');
    console.log('📋 [Payments Service] Paramètres:', {
      planCode,
      successUrl,
      cancelUrl,
      billingCycle,
    });

    try {
      const startTime = Date.now();
      const requestBody: any = {
        planCode,
        successUrl,
        cancelUrl,
      };
      
      // Ajouter le billingCycle si fourni
      if (billingCycle) {
        requestBody.billingCycle = billingCycle;
      }
      
      const response = await paymentsApiCall<{ sessionId: string; url: string }>('/payments/create-checkout-session', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });
      const duration = Date.now() - startTime;

      console.log('✅ [Payments Service] Session de checkout créée', {
        duration: duration + 'ms',
        hasUrl: !!response?.url,
        hasSessionId: !!response?.sessionId,
        sessionId: response?.sessionId,
        urlPreview: response?.url ? response.url.substring(0, 50) + '...' : 'N/A',
      });

      // Valider que la réponse contient les champs requis
      if (!response || (!response.url && !response.sessionId)) {
        throw new Error('Réponse invalide de l\'API: URL ou sessionId manquant');
      }

      return {
        sessionId: response.sessionId || '',
        url: response.url || '',
      };
    } catch (error) {
      console.error('❌ [Payments Service] Erreur lors de la création de la session:', error);
      if (error instanceof Error) {
        console.error('❌ [Payments Service] Détails de l\'erreur:', {
          message: error.message,
          name: error.name,
        });
      }
      throw error;
    }
  },

  /**
   * Vérifier le statut d'une session de paiement Stripe
   * GET /api/payments/checkout-session/{sessionId}
   * 
   * @param sessionId - ID de la session Stripe Checkout
   * @returns Statut de la session avec les informations de paiement
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
    console.log('🔍 [Payments Service] Vérification du statut de la session:', sessionId);
    
    try {
      const startTime = Date.now();
      
      const response = await paymentsApiCall<{
        status: string;
        paymentStatus?: string;
        subscriptionId?: string;
        customerEmail?: string;
        message?: string;
      }>(`/payments/checkout-session/${encodeURIComponent(sessionId)}`, {
        method: 'GET',
      });
      
      const duration = Date.now() - startTime;

      console.log('✅ [Payments Service] Statut de session récupéré', {
        duration: duration + 'ms',
        status: response?.status,
        paymentStatus: response?.paymentStatus,
        hasSubscriptionId: !!response?.subscriptionId,
      });

      // Normaliser le statut
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
      console.error('❌ [Payments Service] Erreur lors de la vérification du statut:', error);
      
      if (error instanceof Error) {
        console.error('❌ [Payments Service] Détails de l\'erreur:', {
          message: error.message,
          name: error.name,
        });
      }
      
      // En cas d'erreur, retourner un statut d'erreur
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

