import { updateCurrentUser, uploadAvatar, removeAvatar } from '@/services/auth/auth.profile';
import { apiCall } from '@/services/shared/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock apiCall
jest.mock('@/services/shared/api', () => ({
  apiCall: jest.fn(),
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

describe('Auth Profile Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('updateCurrentUser', () => {
    it('devrait mettre à jour les informations utilisateur', async () => {
      const updates = {
        firstName: 'John',
        lastName: 'Doe',
        address: {
          street: '123 Main St',
          city: 'Paris',
          postalCode: '75001',
          country: 'France',
        },
      };

      const mockUpdatedUser = {
        id: '1',
        email: 'test@example.com',
        ...updates,
      };

      (apiCall as jest.Mock).mockResolvedValue(mockUpdatedUser);

      const result = await updateCurrentUser(updates);

      expect(apiCall).toHaveBeenCalledWith('/auth/me', {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      expect(result).toEqual(mockUpdatedUser);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        expect.any(String),
        JSON.stringify(mockUpdatedUser)
      );
    });

    it('devrait gérer les erreurs de mise à jour', async () => {
      const error = new Error('Update failed');
      (apiCall as jest.Mock).mockRejectedValue(error);

      await expect(updateCurrentUser({ firstName: 'John' })).rejects.toThrow('Update failed');
    });
  });

  describe('uploadAvatar', () => {
    it('devrait uploader un avatar', async () => {
      const imageUri = 'file://test-image.jpg';
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        avatarUrl: 'https://api.test.com/avatars/1.jpg',
      };

      (apiCall as jest.Mock).mockResolvedValue(mockUser);

      const result = await uploadAvatar(imageUri);

      expect(apiCall).toHaveBeenCalledWith(
        '/auth/upload-avatar',
        expect.objectContaining({
          method: 'POST',
        })
      );
      expect(result).toEqual(mockUser);
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    it('devrait gérer les erreurs d\'upload', async () => {
      const error = new Error('Upload failed');
      (apiCall as jest.Mock).mockRejectedValue(error);

      await expect(uploadAvatar('file://test.jpg')).rejects.toThrow('Upload failed');
    });
  });

  describe('removeAvatar', () => {
    it('devrait supprimer l\'avatar', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        avatarUrl: null,
      };

      (apiCall as jest.Mock).mockResolvedValue({ user: mockUser });

      const result = await removeAvatar();

      expect(apiCall).toHaveBeenCalledWith('/auth/remove-avatar', {
        method: 'DELETE',
      });
      expect(result).toEqual(mockUser);
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    it('devrait gérer les erreurs de suppression', async () => {
      const error = new Error('Delete failed');
      (apiCall as jest.Mock).mockRejectedValue(error);

      await expect(removeAvatar()).rejects.toThrow('Delete failed');
    });

    it('devrait gérer les erreurs 404 (avatar déjà supprimé)', async () => {
      const error = new Error('HTTP 404');
      (apiCall as jest.Mock).mockRejectedValue(error);

      await expect(removeAvatar()).rejects.toThrow();
    });
  });
});

