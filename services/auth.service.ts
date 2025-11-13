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
const USER_STORAGE_KEY = '@maya_current_user';

// Cache en mémoire pour les performances
let usersCache: User[] | null = null;

// Interface pour les tokens
interface TokenData {
  accessToken: string;
  refreshToken?: string;
  expiresAt: string;
  userId: string;
}

// Fonctions de gestion des tokens
const saveTokens = async (tokens: TokenData): Promise<void> => {
  try {
    await AsyncStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokens));
    console.log('💾 Tokens sauvegardés localement');
  } catch (error) {
    console.error('❌ Erreur lors de la sauvegarde des tokens:', error);
  }
};

const getTokens = async (): Promise<TokenData | null> => {
  try {
    const tokensJson = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
    return tokensJson ? JSON.parse(tokensJson) : null;
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des tokens:', error);
    return null;
  }
};

const clearTokens = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
    await AsyncStorage.removeItem(USER_STORAGE_KEY);
    console.log('🗑️ Tokens supprimés');
  } catch (error) {
    console.error('❌ Erreur lors de la suppression des tokens:', error);
  }
};

// Configuration de l'API
// Pour iOS Simulator, utilise localhost
// Pour Android Emulator, utilise 10.0.2.2
// Pour appareil physique, utilise l'IP de ton ordinateur
export const API_BASE_URL = __DEV__ 
  ? 'http://192.168.1.11:61803/api/v1'  // HTTP sur IP locale (fonctionne avec émulateur)
  // ? 'https://192.168.1.11:61802/api/v1'  // HTTPS (problèmes de certificat SSL)
  // ? 'https://localhost:61802/api/v1'  // Localhost (Postman seulement)
  // ? 'https://10.0.2.2:61802/api/v1'  // Android Emulator (alternative)
  : 'https://ton-api-production.com/api/v1'; // Mode production

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
  
  console.log(`🌐 Appel API vers: ${url}`);
  console.log('📤 Données envoyées:', options.body);
  console.log('🔑 Token présent:', !!tokens?.accessToken);
  console.log('🔑 Headers envoyés:', JSON.stringify(defaultHeaders, null, 2));
  
  // Déboguer le token en entier (seulement en dev)
  if (__DEV__ && tokens?.accessToken) {
    console.log('🔑 Token complet:', tokens.accessToken);
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
      console.log('🔓 Mode développement: SSL non vérifié');
    }

    const response = await fetch(url, fetchOptions);

    clearTimeout(timeoutId);
    console.log(`📥 Réponse API: ${response.status} ${response.statusText}`);
    
    // Logger tous les headers de réponse pour déboguer
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });
    console.log('📥 Headers de réponse:', JSON.stringify(responseHeaders, null, 2));

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorText = await response.text();
        console.log('❌ Corps de l\'erreur API (texte brut):', errorText);
        if (errorText) {
          const errorData = JSON.parse(errorText);
          console.log('❌ Détails de l\'erreur API (JSON):', JSON.stringify(errorData, null, 2));
          errorMessage = errorData.message || errorData.error || errorMessage;
        }
      } catch (parseError) {
        console.log('❌ Impossible de parser l\'erreur JSON:', parseError);
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('✅ Données reçues de l\'API:', data);
    return data;
  } catch (error) {
    console.error('🚨 Erreur lors de l\'appel API:', error);
    if (error instanceof Error) {
      // Gérer spécifiquement les erreurs de timeout et d'abort
      if (error.name === 'AbortError') {
        console.log('⏰ Timeout de connexion - le serveur met trop de temps à répondre');
        // Retry une fois en cas de timeout
        if (retryCount < 1) {
          console.log(`🔄 Tentative de reconnexion ${retryCount + 1}/1...`);
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
    console.error('Erreur lors du chargement des utilisateurs:', error);
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
    console.error('Erreur lors de la sauvegarde des utilisateurs:', error);
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
  signIn: async (loginData: LoginRequest): Promise<PublicUser> => {
    try {
      console.log('🔐 Tentative de connexion avec:', {
        email: loginData.email,
        passwordLength: loginData.password?.length || 0,
        passwordMasked: '*'.repeat(loginData.password?.length || 0)
      });

      // Appel à l'API backend - l'API retourne directement le token
      const response = await apiCall<any>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(loginData),
      });

      console.log('🔍 Réponse complète de l\'API:', response);
      console.log('✅ Connexion réussie!');

      // Extraire les données de l'utilisateur de la réponse
      const userData = response.user || response.data || response;
      
      // Créer l'utilisateur avec les vraies données
      const user: User = {
        id: userData.id || response.userId || 'temp-id',
        email: loginData.email,
        password: loginData.password, // Garder localement pour la session
        firstName: userData.firstName || userData.first_name || 'Utilisateur',
        lastName: userData.lastName || userData.last_name || 'Maya',
        birthDate: userData.birthDate || userData.birth_date || new Date().toISOString(),
        address: userData.address || {
          street: '',
          city: '',
          state: '',
          postalCode: '',
          country: 'France'
        },
        avatarBase64: userData.avatarBase64 || userData.avatar || '',
        createdAt: userData.createdAt || userData.created_at || new Date().toISOString(),
      };

      // Stocker les tokens reçus de l'API
      if (response.accessToken) {
        const tokenData: TokenData = {
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
          expiresAt: response.expiresAt || new Date(Date.now() + 3600000).toISOString(), // 1h par défaut
          userId: user.id,
        };
        
        await saveTokens(tokenData);
        console.log('🔑 Token sauvegardé:', response.accessToken.substring(0, 20) + '...');
        console.log('🔑 Token complet:', response.accessToken);
      } else {
        console.warn('⚠️ Pas de token dans la réponse:', Object.keys(response));
      }

      // Retourner l'utilisateur public
      const publicUser: PublicUser = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        birthDate: user.birthDate,
        address: user.address,
        avatarBase64: user.avatarBase64,
        createdAt: user.createdAt,
      };

      // Sauvegarder l'utilisateur connecté
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(publicUser));
      console.log('👤 Utilisateur sauvegardé:', publicUser.email);

      return publicUser;
    } catch (error) {
      console.log('❌ Erreur lors de la connexion:', error);
      console.log('🔍 Détails de l\'erreur:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack?.substring(0, 200) + '...' : 'No stack trace'
      });
      
      // Vérifier si c'est une erreur d'identifiants invalides
      if (error instanceof Error) {
        if (error.message.includes('401') || error.message.includes('Unauthorized') || error.message.includes('invalid')) {
          console.log('🚨 Identifiants invalides détectés!');
          throw new Error('INVALID_CREDENTIALS');
        }
        
        if (error.message.includes('TIMEOUT_ERROR')) {
          console.log('⏰ Timeout de connexion détecté!');
          throw new Error('TIMEOUT_ERROR');
        }
      }
      
      // Ne pas permettre la connexion en cas d'erreur API
      console.log('🚨 Connexion refusée - erreur API');
      throw error;
    }
  },

  /**
   * Inscription d'un nouvel utilisateur via l'API backend
   * @param registerData - Données d'inscription
   * @returns L'utilisateur créé sans le mot de passe
   * @throws Error si l'email existe déjà ou en cas d'erreur API
   */
  signUp: async (registerData: RegisterRequest): Promise<PublicUser> => {
    try {
      // Appel à l'API backend pour créer le compte
      const registerResponse = await apiCall<any>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: registerData.email,
          password: registerData.password,
          firstName: registerData.firstName,
          lastName: registerData.lastName,
          birthDate: registerData.birthDate,
          address: registerData.address,
          avatarBase64: registerData.avatarBase64,
        }),
      });

      console.log('✅ Compte créé, réponse complète:', JSON.stringify(registerResponse, null, 2));

      // Stocker les tokens reçus après inscription
      if (registerResponse.accessToken) {
        const tokenData: TokenData = {
          accessToken: registerResponse.accessToken,
          refreshToken: registerResponse.refreshToken,
          expiresAt: registerResponse.expiresAt || new Date(Date.now() + 3600000).toISOString(),
          userId: registerResponse.user?.id || registerResponse.id || 'temp-id',
        };
        
        await saveTokens(tokenData);
        console.log('🔑 Token sauvegardé après inscription');
      }

      // Appeler PUT /auth/me pour mettre à jour les infos complètes
      let mergedUserData: any = registerResponse?.user ?? registerResponse;
      // Si l'API ne renvoie pas les infos complètes, reprendre ce que l'on a envoyé
      if (!mergedUserData?.firstName && registerData.firstName) {
        mergedUserData = {
          ...mergedUserData,
          firstName: registerData.firstName,
          lastName: registerData.lastName,
          birthDate: registerData.birthDate,
          address: registerData.address,
        };
      }

      // Créer l'objet utilisateur avec les données mises à jour
      const newUser: User = {
        id:
          mergedUserData?.id ||
          registerResponse.user?.id ||
          registerResponse.id ||
          'temp-id',
        email: registerData.email,
        password: registerData.password,
        firstName: mergedUserData?.firstName ?? registerData.firstName,
        lastName: mergedUserData?.lastName ?? registerData.lastName,
        birthDate: mergedUserData?.birthDate ?? registerData.birthDate,
        address: mergedUserData?.address ?? registerData.address,
        avatarBase64: registerData.avatarBase64,
        createdAt: new Date().toISOString(),
      };

      const publicUser: PublicUser = {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        birthDate: newUser.birthDate,
        address: newUser.address,
        avatarBase64: newUser.avatarBase64,
        createdAt: newUser.createdAt,
      };

      // Sauvegarder l'utilisateur connecté
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(publicUser));
      console.log('👤 Utilisateur sauvegardé après inscription:', publicUser.email);

      return publicUser;
    } catch (error) {
      console.log('🚨 Inscription refusée - erreur API:', error);
      throw error;
    }
  },

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

      console.log('🔄 Token rafraîchi avec succès');
      return response;
    } catch (error) {
      console.log('❌ Erreur lors du rafraîchissement du token:', error);
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
        console.log('👋 Déconnexion API réussie');
      }
      
      // Nettoyer les tokens et le cache local
      await clearTokens();
      usersCache = null;
      
      console.log('👋 Déconnexion locale réussie');
      
    } catch (error) {
      console.log('⚠️ Erreur lors de la déconnexion, mais nettoyage local effectué:', error);
      
      // Nettoyer quand même le cache local même en cas d'erreur
      await clearTokens();
      usersCache = null;
    }
  },

  /**
   * Étape 1 - Vérifier l'existence de l'email et déclencher la procédure de reset
   * @param email - Email de l'utilisateur
   */
  requestPasswordReset: async (email: string): Promise<void> => {
    try {
      await apiCall('/auth/request-password-reset', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });

      console.log('📧 Email vérifié, procédure de reset démarrée');
    } catch (error) {
      console.log('❌ Erreur lors de la vérification de l\'email:', error);
      throw new Error('Adresse email inconnue');
    }
  },

  /**
   * Étape 2 - Envoyer un code de réinitialisation
   * @param email - Email de l'utilisateur
   * @param phoneNumber - Numéro de téléphone (pour SMS)
   * @param channel - Canal d'envoi (email ou sms)
   */
  requestPasswordResetCode: async (
    email: string,
    phoneNumber?: string,
    channel: 'email' | 'sms' = 'email'
  ): Promise<void> => {
    try {
      const payload: Record<string, string> = {
        email,
        channel,
      };

      if (phoneNumber) {
        payload.phoneNumber = phoneNumber;
      }

      await apiCall('/auth/request-password-reset-code', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      console.log(`📨 Code de reset envoyé via ${channel}`);
    } catch (error) {
      console.log('❌ Erreur lors de l\'envoi du code:', error);
      throw new Error('Impossible d\'envoyer le code de vérification');
    }
  },

  /**
   * Étape 3 - Vérifier le code reçu
   * @param email - Email de l'utilisateur
   * @param code - Code de vérification
   */
  verifyPasswordResetCode: async (email: string, code: string): Promise<void> => {
    try {
      await apiCall('/auth/verify-password-reset-code', {
        method: 'POST',
        body: JSON.stringify({ email, code }),
      });

      console.log('✅ Code de reset vérifié');
    } catch (error) {
      console.log('❌ Code invalide:', error);
      throw new Error('Code de vérification invalide');
    }
  },

  /**
   * Réinitialiser le mot de passe
   * @param token - Token de reset reçu par email
   * @param newPassword - Nouveau mot de passe
   * @returns Confirmation de la réinitialisation
   */
  resetPassword: async (code: string, newPassword: string, email?: string): Promise<void> => {
    try {
      const payload: Record<string, string> = {
        code,
        newPassword,
      };

      if (email) {
        payload.email = email;
      }

      await apiCall('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      console.log('✅ Mot de passe réinitialisé avec succès');
    } catch (error) {
      console.log('❌ Erreur lors de la réinitialisation:', error);
      throw new Error('Échec de la réinitialisation du mot de passe');
    }
  },
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
    try {
      // Vérifier d'abord si l'utilisateur est authentifié
      const isAuth = await AuthService.isAuthenticated();
      if (!isAuth) {
        throw new Error('Utilisateur non authentifié');
      }

      const response = await apiCall<any>('/auth/me', {
        method: 'GET',
      });

      const userData: PublicUser | undefined = response?.user ?? response;

      if (!userData) {
        throw new Error('Aucune donnée utilisateur reçue');
      }

      console.log('👤 Informations utilisateur récupérées depuis l\'API:', userData.email);
      return userData;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des infos utilisateur:', error);
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

};

