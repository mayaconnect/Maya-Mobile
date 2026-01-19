import { AuthService } from '@/services/auth.service';
import { ProfilesService } from '@/services/profiles.service';
import { apiCall } from '@/services/shared/api';

jest.mock('@/services/auth.service', () => ({
  API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || 'https://fc554a95db2c.ngrok-free.app/api/v1',
  AuthService: {
    getAccessToken: jest.fn().mockResolvedValue('test-token'),
  },
}));

jest.mock('@/services/shared/api');

describe('ProfilesService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AuthService.getAccessToken as jest.Mock).mockResolvedValue('test-token');
  });

  describe('createProfile', () => {
    it('calls the profiles API endpoint', async () => {
      const mockResponse = { id: 'profile_123', createdAt: '2024-01-01' };

      (apiCall as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await ProfilesService.createProfile();

      expect(apiCall).toHaveBeenCalledWith(
        '/profiles',
        expect.objectContaining({
          method: 'POST',
        }),
        0,
        expect.any(String)
      );
      expect(result).toEqual(mockResponse);
    });
  });
});

