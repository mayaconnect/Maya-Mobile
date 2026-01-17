import { AuthService } from '@/services/auth.service';
import { LoginCredentials, RegisterRequest, ResetPasswordRequest, AuthUser } from '../types';

export const AuthApi = {
  login: async (credentials: LoginCredentials): Promise<AuthUser> => {
    try {
      const user = await AuthService.signIn(credentials);
      return user as AuthUser;
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      throw error;
    }
  },

  signup: async (registerData: RegisterRequest): Promise<AuthUser> => {
    try {
      const user = await AuthService.signUp(registerData);
      return user as AuthUser;
    } catch (error) {
      console.error('Erreur lors de l\'inscription:', error);
      throw error;
    }
  },

  logout: async (): Promise<void> => {
    try {
      await AuthService.signOut();
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      throw error;
    }
  },

  resetPassword: async (data: ResetPasswordRequest): Promise<void> => {
    try {
      // À implémenter quand l'API sera disponible
      // await AuthService.resetPassword(data.email);
      throw new Error('Non implémenté');
    } catch (error) {
      console.error('Erreur lors de la réinitialisation du mot de passe:', error);
      throw error;
    }
  },

  getCurrentUser: async (): Promise<AuthUser> => {
    try {
      const user = await AuthService.getCurrentUserInfo();
      return user as AuthUser;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'utilisateur:', error);
      throw error;
    }
  },
};

