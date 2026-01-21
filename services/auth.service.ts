import usersData from '@/data/users.json';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Interface pour l'adresse selon l'API backend
export interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

// Interface pour l'inscription selon l'API backend
export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  birthDate: string; // ISO 8601 format
  address: Address;
  avatarBase64?: string;
  role?: 'partners' | 'client';
}

// Interface utilisateur complète (local)
export interface User {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  address: Address;
  avatarBase64?: string;
  createdAt: string;
}

// Interface utilisateur publique (sans mot de passe)
export interface PublicUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  address: Address;
  avatarBase64?: string;
  createdAt: string;
}

// Interface pour la requête de login
export interface LoginRequest {
  email: string;
  password: string;
  role?: 'partners' | 'client';
}

// Interface de réponse de l'API
export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

// Clé pour AsyncStorage
const STORAGE_KEY = '@maya_users';
const TOKEN_STORAGE_KEY = '@maya_tokens';

// Cache en mémoire pour les performances
let usersCache: User[] | null = null;

// Interface pour les tokens
interface TokenData {
  accessToken: string;
  refreshToken?: string;
  expiresAt: string;
  userId: string;
}

// Import des fonctions de gestion des tokens depuis le module dédié
import { log } from '@/utils/logger';
import { USER_STORAGE_KEY } from './auth/auth.config';
import { signIn as signInUser, signUp as signUpUser } from './auth/auth.login';
import { signInWithGoogle as signInWithGoogleOAuth } from './auth/auth.oauth';
import { requestPasswordReset, requestPasswordResetCode, resetPassword, verifyPasswordResetCode } from './auth/auth.password-reset';
import { updateCurrentUser as updateCurrentUserProfile, uploadAvatar as uploadAvatarProfile } from './auth/auth.profile';
import { clearTokens as clearTokensModule, getTokens } from './auth/auth.tokens';

// Wrapper pour clearTokens qui nettoie aussi USER_STORAGE_KEY
const clearTokens = async (): Promise<void> => {
  await clearTokensModule();
  try {
    await AsyncStorage.removeItem(USER_STORAGE_KEY);
  } catch (error) {
    log.error('Erreur lors de la suppression de l\'utilisateur', error as Error);
  }
};

const normalizeBaseUrl = (raw?: string | null) => {
  if (!raw) {
    return undefined;
  }
  const trimmed = raw.trim();
  if (!trimmed) {
    return undefined;
  }
  return trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
};

const ENV_API_BASE = normalizeBaseUrl(process.env.EXPO_PUBLIC_API_BASE_URL);

export const API_BASE_URL = ENV_API_BASE || 'https://fc554a95db2c.ngrok-free.app/api/v1';

// Fonction utilitaire pour enlever le mot de passe d'un utilisateur
const removePassword = (user: User): PublicUser => {
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

// Fonction pour faire des appels API avec timeout et retry
const apiCall = async <T>(
  endpoint: string,
  options: RequestInit = {},
  retryCount: number = 0,
  baseUrlOverride?: string,
): Promise<T> => {
  const baseUrl = baseUrlOverride ?? API_BASE_URL;
  const url = `${baseUrl}${endpoint}`;
  
  // Récupérer le token d'authentification si disponible
  const tokens = await getTokens();
  
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  // Ajouter le header Authorization si un token est présent
  if (tokens?.accessToken) {
    defaultHeaders['Authorization'] = `Bearer ${tokens.accessToken}`;
  }
  
  log.debug('Appel API', { url, hasBody: !!options.body, hasToken: !!tokens?.accessToken });
  
  // Déboguer le token en entier (seulement en dev)
  if (__DEV__ && tokens?.accessToken) {
    log.debug('Token disponible', { token: tokens.accessToken.substring(0, 20) + '...' });
  }

  try {
    // Créer un AbortController pour gérer le timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 secondes de timeout

    // Configuration pour accepter les certificats auto-signés en développement
    const fetchOptions: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
      signal: controller.signal,
    };

    // En développement, ignorer les erreurs de certificat SSL
    if (__DEV__) {
      // Pour React Native, on peut ajouter des headers spéciaux si nécessaire
      log.debug('Mode développement: SSL non vérifié');
    }

    const response = await fetch(url, fetchOptions);

    clearTimeout(timeoutId);
    log.debug('Réponse API reçue', { status: response.status, statusText: response.statusText });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      let errorCode = response.status.toString();
      try {
        const errorText = await response.text();
        log.debug('Corps de l\'erreur API', { errorText });
        if (errorText) {
          try {
            const errorData = JSON.parse(errorText);
            log.debug('Détails de l\'erreur API', { errorData });
            // Extraire le message d'erreur (peut être dans message, error, ou details)
            errorMessage = errorData.message || errorData.error || errorData.details || errorMessage;
            // Extraire le code d'erreur si disponible
            if (errorData.code) {
              errorCode = errorData.code;
            }
            // Préfixer avec le code HTTP pour faciliter le traitement
            errorMessage = `HTTP ${response.status} (${errorCode}): ${errorMessage}`;
          } catch (jsonParseError) {
            // Si ce n'est pas du JSON, utiliser le texte brut
            errorMessage = `HTTP ${response.status}: ${errorText || response.statusText}`;
          }
        }
      } catch (parseError) {
        log.warn('Impossible de parser l\'erreur JSON', { error: parseError instanceof Error ? parseError.message : String(parseError) });
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    log.debug('Données reçues de l\'API', { endpoint });
    return data;
  } catch (error) {
    log.error('Erreur lors de l\'appel API', error as Error, { endpoint });
    if (error instanceof Error) {
      // Gérer spécifiquement les erreurs de timeout et d'abort
      if (error.name === 'AbortError') {
        log.warn('Timeout de connexion - le serveur met trop de temps à répondre');
        // Retry une fois en cas de timeout
        if (retryCount < 1) {
          log.info(`Tentative de reconnexion ${retryCount + 1}/1`);
          await new Promise(resolve => setTimeout(resolve, 2000)); // Attendre 2 secondes
          return apiCall<T>(endpoint, options, retryCount + 1);
        }
        throw new Error('TIMEOUT_ERROR');
      }
      throw error;
    }
    throw new Error('Erreur de connexion au serveur');
  }
};

/**
 * Charge tous les utilisateurs (JSON + AsyncStorage)
 */
const loadUsers = async (): Promise<User[]> => {
  // Si le cache existe, l'utiliser
  if (usersCache !== null) {
    return usersCache;
  }

  try {
    // Charger les utilisateurs de base depuis le JSON et les convertir au bon format
    const baseUsers: User[] = usersData.users.map(user => ({
      id: user.id,
      email: user.email,
      password: user.password,
      firstName: user.name.split(' ')[0] || '',
      lastName: user.name.split(' ').slice(1).join(' ') || '',
      birthDate: '1990-01-01', // Valeur par défaut
      address: {
        street: '',
        city: '',
        state: '',
        postalCode: '',
        country: '',
      },
      createdAt: user.createdAt,
    }));

    // Charger les nouveaux utilisateurs depuis AsyncStorage
    const storedUsersJson = await AsyncStorage.getItem(STORAGE_KEY);
    const storedUsers: User[] = storedUsersJson ? JSON.parse(storedUsersJson) : [];

    // Fusionner les deux listes (éviter les doublons par email)
    const allUsers = [...baseUsers];
    storedUsers.forEach((storedUser) => {
      const exists = baseUsers.some((u) => u.email.toLowerCase() === storedUser.email.toLowerCase());
      if (!exists) {
        allUsers.push(storedUser);
      }
    });

    // Mettre en cache
    usersCache = allUsers;
    return allUsers;
  } catch (error) {
    log.error('Erreur lors du chargement des utilisateurs', error as Error);
    return usersData.users.map(user => ({
      id: user.id,
      email: user.email,
      password: user.password,
      firstName: user.name.split(' ')[0] || '',
      lastName: user.name.split(' ').slice(1).join(' ') || '',
      birthDate: '1990-01-01',
      address: {
        street: '',
        city: '',
        state: '',
        postalCode: '',
        country: '',
      },
      createdAt: user.createdAt,
    }));
  }
};

/**
 * Sauvegarde les utilisateurs créés dans AsyncStorage
 */
const saveNewUsers = async (newUsers: User[]): Promise<void> => {
  try {
    // Ne sauvegarder que les utilisateurs qui ne sont pas dans le JSON de base
    const baseEmails = usersData.users.map((u) => u.email.toLowerCase());
    const usersToSave = newUsers.filter((u) => !baseEmails.includes(u.email.toLowerCase()));

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(usersToSave));
  } catch (error) {
    log.error('Erreur lors de la sauvegarde des utilisateurs', error as Error);
    throw new Error('SAVE_FAILED');
  }
};

/**
 * Service d'authentification mockée avec persistance
 */
export const AuthService = {
  /**
   * Connexion d'un utilisateur via l'API backend
   * @param loginData - Données de connexion (email et password)
   * @returns L'utilisateur sans le mot de passe
   * @throws Error si les identifiants sont invalides
   */
  signIn: signInUser,

  /**
   * Inscription d'un nouvel utilisateur via l'API backend
   * @param registerData - Données d'inscription
   * @returns L'utilisateur créé sans le mot de passe
   * @throws Error si l'email existe déjà ou en cas d'erreur API
   */
  signUp: signUpUser,

  /**
   * Rafraîchir le token d'accès
   * @param refreshToken - Token de rafraîchissement
   * @returns Nouveau token d'accès
   */
  refreshToken: async (refreshToken: string): Promise<any> => {
    try {
      const response = await apiCall<any>('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      });

      log.info('Token rafraîchi avec succès');
      return response;
    } catch (error) {
      log.error('Erreur lors du rafraîchissement du token', error as Error);
      throw new Error('Échec du rafraîchissement du token');
    }
  },

  /**
   * Déconnexion de l'utilisateur
   * @param refreshToken - Token de rafraîchissement à invalider
   * @returns Confirmation de déconnexion
   */
  signOut: async (): Promise<void> => {
    try {
      const tokens = await getTokens();
      
      if (tokens?.refreshToken) {
        await apiCall('/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refreshToken: tokens.refreshToken }),
        });
        log.info('Déconnexion API réussie');
      }
      
      // Nettoyer les tokens et le cache local
      await clearTokens();
      usersCache = null;
      
      log.info('Déconnexion locale réussie');
      
    } catch (error) {
      log.warn('Erreur lors de la déconnexion, mais nettoyage local effectué', { error: error instanceof Error ? error.message : String(error) });
      
      // Nettoyer quand même le cache local même en cas d'erreur
      await clearTokens();
      usersCache = null;
    }
  },

  /**
   * Étape 1 - Vérifier l'existence de l'email et déclencher la procédure de reset
   * POST /api/v1/auth/request-password-reset
   * @param email - Email de l'utilisateur
   */
  requestPasswordReset,

  /**
   * Étape 2 - Envoyer un code de réinitialisation
   * POST /api/v1/auth/request-password-reset-code
   * @param email - Email de l'utilisateur
   * @param phoneNumber - Numéro de téléphone (pour SMS, optionnel)
   * @param channel - Canal d'envoi ('email' ou 'sms')
   */
  requestPasswordResetCode,

  /**
   * Vérifier le code de réinitialisation (étape 3)
   * POST /api/v1/auth/verify-password-reset-code
   * @param email - Email de l'utilisateur
   * @param code - Code de vérification reçu
   * @returns Token de réinitialisation (si l'API le retourne, sinon undefined)
   */
  verifyPasswordResetCode,

  /**
   * Réinitialiser le mot de passe
   * @param token - Token de reset reçu par email
   * @param newPassword - Nouveau mot de passe
   * @returns Confirmation de la réinitialisation
   */
  resetPassword,
  getAccessToken: async (): Promise<string | null> => {
    const tokens = await getTokens();
    return tokens?.accessToken ?? null;
  },

  /**
   * Récupérer un utilisateur par son ID
   * @param userId - ID de l'utilisateur
   * @returns L'utilisateur sans le mot de passe
   * @throws Error si l'utilisateur n'existe pas
   */
  getUserById: async (userId: string): Promise<PublicUser> => {
    await new Promise((resolve) => setTimeout(resolve, 200));

    const users = await loadUsers();
    const user = users.find((u) => u.id === userId);
    
    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    return removePassword(user);
  },

  /**
   * Mettre à jour un utilisateur
   * @param userId - ID de l'utilisateur
   * @param updates - Données à mettre à jour
   * @returns L'utilisateur mis à jour sans le mot de passe
   * @throws Error si l'utilisateur n'existe pas
   */
  updateUser: async (userId: string, updates: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<PublicUser> => {
    await new Promise((resolve) => setTimeout(resolve, 400));

    const users = await loadUsers();
    const userIndex = users.findIndex((u) => u.id === userId);
    
    if (userIndex === -1) {
      throw new Error('USER_NOT_FOUND');
    }

    // Mettre à jour l'utilisateur
    users[userIndex] = {
      ...users[userIndex],
      ...updates,
    };

    // Sauvegarder les modifications
    await saveNewUsers(users);
    
    // Mettre à jour le cache
    usersCache = users;

    return removePassword(users[userIndex]);
  },

  /**
   * Supprimer un utilisateur
   * @param userId - ID de l'utilisateur
   * @throws Error si l'utilisateur n'existe pas
   */
  deleteUser: async (userId: string): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 300));

    const users = await loadUsers();
    const userIndex = users.findIndex((u) => u.id === userId);
    
    if (userIndex === -1) {
      throw new Error('USER_NOT_FOUND');
    }

    users.splice(userIndex, 1);
    
    // Sauvegarder les modifications
    await saveNewUsers(users);
    
    // Mettre à jour le cache
    usersCache = users;
  },

  /**
   * Réinitialiser les utilisateurs à leur état initial
   */
  resetUsers: async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      usersCache = null;
    } catch (error) {
      console.error('Erreur lors de la réinitialisation:', error);
    }
  },

  /**
   * Récupérer tous les utilisateurs (pour debug)
   */
  getAllUsers: async (): Promise<PublicUser[]> => {
    const users = await loadUsers();
    return users.map(removePassword);
  },

  /**
   * Récupérer l'utilisateur actuellement connecté
   */
  getCurrentUser: async (): Promise<PublicUser | null> => {
    try {
      const userJson = await AsyncStorage.getItem(USER_STORAGE_KEY);
      return userJson ? JSON.parse(userJson) : null;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération de l\'utilisateur:', error);
      return null;
    }
  },

  /**
   * Récupérer les informations complètes de l'utilisateur actuellement connecté depuis l'API
   * @returns Informations complètes de l'utilisateur
   */
  getCurrentUserInfo: async (): Promise<PublicUser> => {
    console.log('👤 [Auth Service] getCurrentUserInfo appelé');
    
    try {
      // Vérifier d'abord si l'utilisateur est authentifié
      console.log('🔐 [Auth Service] Vérification de l\'authentification...');
      const isAuth = await AuthService.isAuthenticated();
      console.log('🔐 [Auth Service] Authentifié:', isAuth);
      
      if (!isAuth) {
        console.error('❌ [Auth Service] Utilisateur non authentifié');
        throw new Error('Utilisateur non authentifié');
      }

      const token = await getTokens();
      console.log('🔑 [Auth Service] Token disponible:', token ? token.accessToken.substring(0, 20) + '...' : 'Aucun');
      console.log('🌐 [Auth Service] Appel API: GET /api/v1/auth/me');
      console.log('🌐 [Auth Service] Base URL:', API_BASE_URL);

      const startTime = Date.now();
      const response = await apiCall<any>('/auth/me', {
        method: 'GET',
      });
      const duration = Date.now() - startTime;

      console.log('✅ [Auth Service] Réponse API reçue', {
        duration: duration + 'ms',
        hasUser: !!response?.user,
        hasData: !!response?.data,
        responseKeys: response ? Object.keys(response) : [],
      });

      if (response) {
        console.log('📄 [Auth Service] Contenu de la réponse:', {
          responseType: typeof response,
          isUser: !!response.user,
          isDirect: !response.user && !response.data,
          fullResponse: JSON.stringify(response, null, 2),
        });
      }

      let userData: PublicUser | undefined = response?.user ?? response;

      if (!userData) {
        console.error('❌ [Auth Service] Aucune donnée utilisateur dans la réponse', {
          response,
        });
        throw new Error('Aucune donnée utilisateur reçue');
      }

      // Préserver les champs supplémentaires qui pourraient contenir l'avatar
      // Si response n'a pas de .user, prendre tous les champs de response pour préserver avatarUrl, etc.
      if (!response?.user && response) {
        userData = {
          ...userData,
          ...response,
        } as PublicUser;
      }

      console.log('✅ [Auth Service] Informations utilisateur récupérées', {
        id: userData.id,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        hasAddress: !!userData.address,
        hasBirthDate: !!userData.birthDate,
        hasAvatarBase64: !!userData.avatarBase64,
        hasAvatarUrl: !!(userData as any)?.avatarUrl,
        hasAvatar: !!(userData as any)?.avatar,
        allKeys: Object.keys(userData || {}),
        address: userData.address,
      });

      // Sauvegarder les informations mises à jour (avec les champs supplémentaires)
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
      console.log('💾 [Auth Service] Informations utilisateur sauvegardées localement');

      return userData;
    } catch (error) {
      console.error('❌ [Auth Service] Erreur lors de la récupération des infos utilisateur:', error);
      if (error instanceof Error) {
        console.error('❌ [Auth Service] Détails de l\'erreur:', {
          message: error.message,
          name: error.name,
          stack: error.stack?.substring(0, 200),
        });

        // Si le token a expiré, essayer de le rafraîchir
        if (error.message.includes('401') || error.message.includes('expired') || error.message.includes('invalid_token')) {
          console.log('🔄 [Auth Service] Token expiré, tentative de rafraîchissement...');
          // Note: Le refresh token devrait être géré automatiquement par le hook useAuth
        }
      }
      throw new Error('Impossible de récupérer les informations utilisateur');
    }
  },

  /**
   * Vérifier si un utilisateur est connecté
   */
  isAuthenticated: async (): Promise<boolean> => {
    const tokens = await getTokens();
    return tokens !== null && new Date(tokens.expiresAt) > new Date();
  },

  /**
   * Vérifier si un email existe via l'API
   * @param email - Email à vérifier
   * @returns true si l'email existe, false sinon
   */
  checkEmailExists: async (email: string): Promise<boolean> => {
    try {
      // Utiliser l'API pour demander un reset de mot de passe
      // L'API retournera toujours 200, mais on peut considérer que si ça marche, l'email existe
      await AuthService.requestPasswordReset(email);
      console.log('📧 Email vérifié via l\'API - reset demandé');
      return true;
    } catch (error) {
      console.log('❌ Email non trouvé via l\'API:', error);
      return false;
    }
  },

  /**
   * Met à jour le profil de l'utilisateur actuel (PUT /auth/me)
   */
  updateCurrentUser: updateCurrentUserProfile,

  /**
   * Upload un avatar (POST /auth/upload-avatar, multipart, max 5MB)
   */
  uploadAvatar: uploadAvatarProfile,

  /**
   * Connexion via Google OAuth
   * @returns L'utilisateur connecté
   * @throws Error si la connexion Google échoue
   */
  signInWithGoogle: async (): Promise<PublicUser> => {
    return signInWithGoogleOAuth();
  },
};

