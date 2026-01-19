import { AuthService } from '@/services/auth.service';
import { PaymentService } from '@/services/payment.service';
import { apiCall } from '@/services/shared/api';

jest.mock('@/services/auth.service', () => ({
  API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || 'https://fc554a95db2c.ngrok-free.app/api/v1',
  AuthService: {
    getAccessToken: jest.fn(),
  },
}));

jest.mock('@/services/shared/api');

jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
  },
}));

describe('PaymentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AuthService.getAccessToken as jest.Mock).mockResolvedValue('test-token');
  });

  describe('processPayment', () => {
    it('routes to PayPal payment method', async () => {
      const request = {
        amount: 100,
        currency: 'EUR',
        planId: 'plan1',
        planName: 'Solo',
        billingCycle: 'monthly' as const,
        paymentMethod: 'paypal' as const,
      };

      const result = await PaymentService.processPayment(request);

      expect(result.success).toBe(true);
      expect(result.transactionId).toMatch(/^PP-/);
      expect(result.message).toContain('PayPal');
    });

    it('routes to Apple Pay payment method', async () => {
      const request = {
        amount: 100,
        currency: 'EUR',
        planId: 'plan1',
        planName: 'Solo',
        billingCycle: 'monthly' as const,
        paymentMethod: 'applepay' as const,
      };

      const result = await PaymentService.processPayment(request);

      expect(result.success).toBe(true);
      expect(result.transactionId).toMatch(/^AP-/);
    });

    it('routes to Google Pay payment method', async () => {
      const request = {
        amount: 100,
        currency: 'EUR',
        planId: 'plan1',
        planName: 'Solo',
        billingCycle: 'monthly' as const,
        paymentMethod: 'googlepay' as const,
      };

      const result = await PaymentService.processPayment(request);

      expect(result.success).toBe(true);
      expect(result.transactionId).toMatch(/^GP-/);
    });

    it('routes to card payment method', async () => {
      const request = {
        amount: 100,
        currency: 'EUR',
        planId: 'plan1',
        planName: 'Solo',
        billingCycle: 'monthly' as const,
        paymentMethod: 'card' as const,
      };

      const result = await PaymentService.processPayment(request);

      expect(result.success).toBe(true);
      expect(result.transactionId).toMatch(/^CARD-/);
    });

    it('returns error for unsupported payment method', async () => {
      const request = {
        amount: 100,
        currency: 'EUR',
        planId: 'plan1',
        planName: 'Solo',
        billingCycle: 'monthly' as const,
        paymentMethod: 'unsupported' as any,
      };

      const result = await PaymentService.processPayment(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('non supportée');
    });
  });

  describe('isApplePayAvailable', () => {
    it('returns true on iOS', async () => {
      const isAvailable = await PaymentService.isApplePayAvailable();
      expect(isAvailable).toBe(true);
    });
  });

  describe('createCheckoutSession', () => {
    it('creates a checkout session successfully', async () => {
      const mockResponse = {
        sessionId: 'session_123',
        url: 'https://checkout.stripe.com/session_123',
      };

      (apiCall as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await PaymentService.createCheckoutSession(
        'Solo',
        'https://success.com',
        'https://cancel.com',
        'monthly'
      );

      expect(result.sessionId).toBe('session_123');
      expect(result.url).toBe('https://checkout.stripe.com/session_123');
      expect(apiCall).toHaveBeenCalledWith(
        '/payments/create-checkout-session',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Solo'),
        }),
        0,
        expect.any(String)
      );
    });

    it('throws error on invalid response', async () => {
      (apiCall as jest.Mock).mockResolvedValueOnce({});

      await expect(
        PaymentService.createCheckoutSession('Solo', 'https://success.com', 'https://cancel.com')
      ).rejects.toThrow();
    });
  });

  describe('checkPaymentSessionStatus', () => {
    it('returns session status successfully', async () => {
      const mockResponse = {
        status: 'complete',
        paymentStatus: 'paid',
        subscriptionId: 'sub_123',
        customerEmail: 'test@example.com',
      };

      (apiCall as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await PaymentService.checkPaymentSessionStatus('session_123');

      expect(result.status).toBe('complete');
      expect(result.paymentStatus).toBe('paid');
      expect(result.subscriptionId).toBe('sub_123');
    });

    it('returns error status on API failure', async () => {
      (apiCall as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

      const result = await PaymentService.checkPaymentSessionStatus('session_123');

      expect(result.status).toBe('error');
      expect(result.message).toBe('API Error');
    });
  });

  describe('processWebhook', () => {
    it('processes webhook successfully', async () => {
      const webhookData = {
        sessionId: 'session_123',
        status: 'complete',
        paymentStatus: 'paid',
        subscriptionId: 'sub_123',
      };

      const mockResponse = { success: true, message: 'Webhook processed' };

      (apiCall as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await PaymentService.processWebhook(webhookData);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Webhook processed');
    });

    it('handles webhook processing error', async () => {
      (apiCall as jest.Mock).mockRejectedValueOnce(new Error('Processing failed'));

      const result = await PaymentService.processWebhook({
        sessionId: 'session_123',
        status: 'error',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Processing failed');
    });
  });
});

