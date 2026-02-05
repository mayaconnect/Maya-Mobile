import { AuthService, LoginRequest, PublicUser, RegisterRequest } from '@/services/auth.service';
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

type AuthUser = PublicUser & { role?: string };

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  signIn: (params: LoginRequest) => Promise<AuthUser>;
  signInWithGoogle: () => Promise<AuthUser>;
  signUp: (params: RegisterRequest) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true); // Commencer par true pour charger l'utilisateur

  // Charger l'utilisateur au démarrage avec persistance
  React.useEffect(() => {
    const loadUser = async () => {
      try {
        // D'abord, charger l'utilisateur depuis le stockage local pour un affichage immédiat
        const localUser = await AuthService.getCurrentUser();
        if (localUser) {
          setUser(localUser);
          console.log('👤 Utilisateur chargé depuis le stockage local (affichage immédiat):', localUser.email);
        }

        // Ensuite, vérifier l'authentification et mettre à jour si nécessaire
        const isAuth = await AuthService.isAuthenticated();
        
        if (isAuth) {
          // Essayer de récupérer les infos complètes depuis l'API en arrière-plan
          try {
            const userInfo = await AuthService.getCurrentUserInfo();
            setUser(userInfo);
            console.log('✅ Utilisateur mis à jour depuis l\'API:', userInfo.email);
          } catch (apiError) {
            // Si l'API échoue, garder les données locales si elles existent
            console.log('⚠️ API indisponible, utilisation des données locales persistées');
            if (!localUser) {
              // Si on n'a pas de données locales non plus, déconnecter
              setUser(null);
              console.log('❌ Aucune donnée locale trouvée, déconnexion');
            }
          }
        } else {
          // Token invalide ou expiré, nettoyer
          if (localUser) {
            console.log('⚠️ Token invalide, nettoyage des données locales');
            await AuthService.signOut();
          }
          setUser(null);
          console.log('❌ Aucun utilisateur connecté');
        }
      } catch (error) {
        console.error('❌ Erreur lors du chargement de l\'utilisateur:', error);
        // En cas d'erreur, essayer de charger depuis le stockage local
        try {
          const localUser = await AuthService.getCurrentUser();
          if (localUser) {
            setUser(localUser);
            console.log('👤 Utilisateur chargé depuis le stockage local (fallback):', localUser.email);
          } else {
            setUser(null);
          }
        } catch {
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const signIn = useCallback(async (loginData: LoginRequest): Promise<AuthUser> => {
    setLoading(true);
    try {
      if (!loginData.email || !loginData.password) {
        throw new Error('MISSING_CREDENTIALS');
      }
      
      // La méthode signIn retourne déjà l'utilisateur
      const userInfo = await AuthService.signIn(loginData);
      setUser(userInfo);
      console.log('✅ Connexion réussie:', userInfo.email);
      
      // Essayer de récupérer les infos complètes depuis l'API en arrière-plan
      // mais ne pas bloquer la connexion si ça échoue
      let finalUserInfo = userInfo;
      try {
        const updatedUserInfo = await AuthService.getCurrentUserInfo();
        if (updatedUserInfo) {
          setUser(updatedUserInfo);
          finalUserInfo = updatedUserInfo;
          console.log('🔄 Infos utilisateur mises à jour depuis l\'API');
        }
      } catch {
        console.log('⚠️ Impossible de récupérer les infos complètes, utilisation des données de base');
      }
      
      return finalUserInfo;
    } catch (error) {
      // Ne pas mettre user à null en cas d'erreur pour éviter les redirections
      // L'utilisateur reste sur la page de connexion et peut voir l'erreur
      // setUser(null); // Commenté pour éviter la redirection vers l'onboarding
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const signInWithGoogle = useCallback(async (): Promise<AuthUser> => {
    setLoading(true);
    try {
      const userInfo = await AuthService.signInWithGoogle();
      setUser(userInfo);
      console.log('✅ Connexion Google réussie:', userInfo.email);
      
      // Essayer de récupérer les infos complètes depuis l'API en arrière-plan
      let finalUserInfo = userInfo;
      try {
        const updatedUserInfo = await AuthService.getCurrentUserInfo();
        if (updatedUserInfo) {
          setUser(updatedUserInfo);
          finalUserInfo = updatedUserInfo;
          console.log('🔄 Infos utilisateur mises à jour depuis l\'API');
        }
      } catch {
        console.log('⚠️ Impossible de récupérer les infos complètes, utilisation des données de base');
      }
      
      return finalUserInfo;
    } catch (error) {
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const signUp = useCallback(async (registerData: RegisterRequest) => {
    setLoading(true);
    try {
      if (!registerData.email || !registerData.password) {
        throw new Error('MISSING_CREDENTIALS');
      }
      
      // La méthode signUp crée le compte mais ne connecte PAS l'utilisateur
      const newUser = await AuthService.signUp(registerData);
      console.log('✅ Inscription réussie:', newUser.email);
      
      // Nettoyer les tokens et ne pas connecter l'utilisateur automatiquement
      // L'utilisateur devra se connecter manuellement après l'inscription
      await AuthService.signOut();
      setUser(null);
      console.log('👋 Utilisateur déconnecté après inscription - redirection vers login');
    } catch (error) {
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    setLoading(true);
    try {
      await AuthService.signOut();
      setUser(null);
      console.log('👋 Déconnexion réussie');
    } catch (error) {
      console.error('❌ Erreur lors de la déconnexion:', error);
      setUser(null); // Déconnecter quand même localement
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      if (user) {
        const userInfo = await AuthService.getCurrentUserInfo();
        setUser(userInfo);
        console.log('🔄 Utilisateur rafraîchi:', userInfo.email);
      }
    } catch (error) {
      console.error('❌ Erreur lors du rafraîchissement:', error);
    }
  }, [user]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, signIn, signInWithGoogle, signUp, signOut, refreshUser }),
    [user, loading, signIn, signInWithGoogle, signUp, signOut, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};


