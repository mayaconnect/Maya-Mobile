import { AuthService } from '@/services/auth.service';
import { ClientService } from '@/services/client.service';
import { UserProfile } from '../types';

export const ProfileApi = {
  getCurrentUser: async (): Promise<UserProfile> => {
    try {
      const user = await AuthService.getCurrentUserInfo();
      return user as UserProfile;
    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error);
      throw error;
    }
  },

  updateProfile: async (userId: string, updates: Partial<UserProfile>): Promise<UserProfile> => {
    try {
      const updated = await ClientService.updateClient(userId, updates);
      return updated as UserProfile;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      throw error;
    }
  },
};

