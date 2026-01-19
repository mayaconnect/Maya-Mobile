import { AuthService } from '@/services/auth.service';
import { apiCall } from '@/services/shared/api';
import { SubscriptionsService } from '@/services/subscriptions.service';

jest.mock('@/services/auth.service', () => ({
  API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || 'https://fc554a95db2c.ngrok-free.app/api/v1',
  AuthService: {
    getAccessToken: jest.fn(),
  },
}));

jest.mock('@/services/shared/api');

describe('SubscriptionsService', () => {        
  beforeEach(() => {
    jest.clearAllMocks();
    (AuthService.getAccessToken as jest.Mock).mockResolvedValue('test-token');
  });

  describe('getSubscriptions', () => {
    it('fetches subscriptions with pagination', async () => {
      const mockResponse = {
        items: [{ id: '1', planId: 'plan1' }],
        page: 1,
        pageSize: 10,
        totalCount: 1,
      };

      (apiCall as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await SubscriptionsService.getSubscriptions({ page: 1, pageSize: 10 });

      expect(apiCall).toHaveBeenCalledWith(
        expect.stringMatching(/\/subscriptions\?.*page=1.*pageSize=10/),
        expect.any(Object),
        0,
        expect.any(String)
      );
      expect(result.items).toEqual(mockResponse.items);
    });

    it('handles array response', async () => {
      const arrayResponse = [{ id: '1' }, { id: '2' }];

      (apiCall as jest.Mock).mockResolvedValueOnce(arrayResponse);

      const result = await SubscriptionsService.getSubscriptions();

      expect(result.items).toEqual(arrayResponse);
      expect(result.totalCount).toBe(2);
    });
  });

  describe('createSubscription', () => {
    it('creates subscription successfully', async () => {
      const subscriptionData = {
        userId: 'user1',
        planId: 'plan1',
        isActive: true,
      };

      const mockResponse = { id: 'sub1', ...subscriptionData };

      (apiCall as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await SubscriptionsService.createSubscription(subscriptionData);

      expect(apiCall).toHaveBeenCalledWith(
        '/subscriptions',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(subscriptionData),
        }),
        0,
        expect.any(String)
      );
      expect(result).toEqual(mockResponse);
    });

    it('throws error when userId is missing', async () => {
      await expect(
        SubscriptionsService.createSubscription({ userId: '', planId: 'plan1' })
      ).rejects.toThrow('userId et planId sont requis');
    });

    it('throws error when planId is missing', async () => {
      await expect(
        SubscriptionsService.createSubscription({ userId: 'user1', planId: '' })
      ).rejects.toThrow('userId et planId sont requis');
    });
  });

  describe('updateSubscription', () => {
    it('updates subscription successfully', async () => {
      const updateData = { isActive: false };

      (apiCall as jest.Mock).mockResolvedValueOnce({ id: 'sub1', ...updateData });

      await SubscriptionsService.updateSubscription('sub1', updateData);

      expect(apiCall).toHaveBeenCalledWith(
        '/subscriptions/sub1',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(updateData),
        }),
        0,
        expect.any(String)
      );
    });

    it('throws error when ID is missing', async () => {
      await expect(SubscriptionsService.updateSubscription('', {})).rejects.toThrow(
        'Subscription ID requis'
      );
    });
  });

  describe('deleteSubscription', () => {
    it('deletes subscription successfully', async () => {
      (apiCall as jest.Mock).mockResolvedValueOnce(undefined);

      await SubscriptionsService.deleteSubscription('sub1');

      expect(apiCall).toHaveBeenCalledWith(
        '/subscriptions/sub1',
        expect.objectContaining({
          method: 'DELETE',
        }),
        0,
        expect.any(String)
      );
    });
  });

  describe('hasActiveSubscription', () => {
    it('returns true when user has active subscription', async () => {
      (apiCall as jest.Mock).mockResolvedValueOnce({ hasSubscription: true });

      const result = await SubscriptionsService.hasActiveSubscription();

      expect(result).toBe(true);
    });

    it('returns false when user has no subscription', async () => {
      (apiCall as jest.Mock).mockResolvedValueOnce({ hasSubscription: false });

      const result = await SubscriptionsService.hasActiveSubscription();

      expect(result).toBe(false);
    });

    it('returns false on 404 error', async () => {
      const error = new Error('HTTP 404: Not found');
      (apiCall as jest.Mock).mockRejectedValueOnce(error);

      const result = await SubscriptionsService.hasActiveSubscription();

      expect(result).toBe(false);
    });
  });

  describe('getMyActiveSubscription', () => {
    it('returns subscription when found', async () => {
      const mockSubscription = { id: 'sub1', planCode: 'Solo', isActive: true };

      (apiCall as jest.Mock).mockResolvedValueOnce(mockSubscription);

      const result = await SubscriptionsService.getMyActiveSubscription();

      expect(result).toEqual(mockSubscription);
    });

    it('returns null on 404 error', async () => {
      const error = new Error('HTTP 404: Not found');
      (apiCall as jest.Mock).mockRejectedValueOnce(error);

      const result = await SubscriptionsService.getMyActiveSubscription();

      expect(result).toBeNull();
    });
  });
});

