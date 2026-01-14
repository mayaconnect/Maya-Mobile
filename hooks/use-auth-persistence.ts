import { AuthService } from '@/services/auth.service';
import { useEffect, useState } from 'react';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any | null;
}

export function useAuthPersistence() {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
  });

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      // Vérifier si l'utilisateur est connecté localement
      const isAuthenticated = await AuthService.isAuthenticated();
      
      if (isAuthenticated) {
        // Récupérer les informations utilisateur depuis le stockage local
        const user = await AuthService.getCurrentUser();
        
        if (user) {
          // Optionnel : vérifier avec le serveur pour s'assurer que le token est toujours valide
          try {
            const userInfo = await AuthService.getCurrentUserInfo();
            setAuthState({
              isAuthenticated: true,
              isLoading: false,
              user: userInfo,
            });
          } catch (error) {
            // Si l'API échoue, utiliser les données locales
            console.log('⚠️ Impossible de vérifier avec le serveur, utilisation des données locales');
            setAuthState({
              isAuthenticated: true,
              isLoading: false,
              user: user,
            });
          }
        } else {
          // Pas d'utilisateur local, déconnecter
          await AuthService.signOut();
          setAuthState({
            isAuthenticated: false,
            isLoading: false,
            user: null,
          });
        }
      } else {
        setAuthState({
          isAuthenticated: false,
          isLoading: false,
          user: null,
        });
      }
    } catch (error) {
      console.error('❌ Erreur lors de la vérification de l\'authentification:', error);
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
      });
    }
  };

  const refreshUser = async () => {
    try {
      if (authState.isAuthenticated) {
        const userInfo = await AuthService.getCurrentUserInfo();
        setAuthState(prev => ({
          ...prev,
          user: userInfo,
        }));
      }
    } catch (error) {
      console.error('❌ Erreur lors du rafraîchissement de l\'utilisateur:', error);
    }
  };

  const signOut = async () => {
    try {
      await AuthService.signOut();
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
      });
    } catch (error) {
      console.error('❌ Erreur lors de la déconnexion:', error);
    }
  };

  return {
    ...authState,
    refreshUser,
    signOut,
    checkAuthStatus,
  };
}
