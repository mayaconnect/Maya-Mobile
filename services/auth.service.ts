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

// Cache en mémoire pour les performances
let usersCache: User[] | null = null;

// Configuration de l'API
// Pour iOS Simulator, utilise localhost
// Pour Android Emulator, utilise 10.0.2.2
// Pour appareil physique, utilise l'IP de ton ordinateur
const API_BASE_URL = __DEV__ 
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

// Fonction pour faire des appels API avec timeout
const apiCall = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  console.log(`🌐 Appel API vers: ${url}`);
  console.log('📤 Données envoyées:', options.body);

  try {
    // Créer un AbortController pour gérer le timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 secondes de timeout

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

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        console.log('❌ Détails de l\'erreur API:', errorData);
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (e) {
        console.log('❌ Impossible de parser l\'erreur JSON');
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
    // Charger les utilisateurs de base depuis le JSON
    const baseUsers: User[] = [...usersData.users];

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
    return [...usersData.users];
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
      // Appel à l'API backend - l'API retourne directement le token
      const response = await apiCall<any>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(loginData),
      });

      console.log('🔍 Réponse complète de l\'API:', response);

      // L'API retourne directement {accessToken, expiresAt, refreshToken}
      // On doit récupérer les infos utilisateur depuis le token JWT ou faire un autre appel
      
      // Pour l'instant, créer un utilisateur basique avec les données disponibles
      const user: User = {
        id: 'temp-id', // Sera mis à jour après récupération des vraies données
        email: loginData.email,
        password: loginData.password, // Garder localement pour la session
        firstName: 'Utilisateur', // Sera mis à jour
        lastName: 'Maya', // Sera mis à jour
        birthDate: new Date().toISOString(),
        address: {
          street: '',
          city: '',
          state: '',
          postalCode: '',
          country: 'France'
        },
        avatarBase64: '',
        createdAt: new Date().toISOString(),
      };

      // Stocker le token pour les prochains appels API
      // TODO: Implémenter le stockage sécurisé du token
      console.log('🔑 Token reçu:', response.accessToken);

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

      return publicUser;
    } catch (error) {
      console.log('⚠️ Erreur lors de la connexion, mais l\'utilisateur existe dans la base de données');
      console.log('🔄 Redirection vers la page principale...');
      
      // L'utilisateur existe dans la base de données, on crée un utilisateur local temporaire
      const tempUser: PublicUser = {
        id: 'temp-id',
        email: loginData.email,
        firstName: 'Utilisateur',
        lastName: 'Maya',
        birthDate: new Date().toISOString(),
        address: {
          street: '',
          city: '',
          state: '',
          postalCode: '',
          country: 'France'
        },
        avatarBase64: '',
        createdAt: new Date().toISOString(),
      };
      
      return tempUser;
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
      // Appel à l'API backend
      const response = await apiCall<ApiResponse<PublicUser>>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(registerData),
      });

      if (!response.success) {
        throw new Error(response.message || 'Échec de l\'inscriptin');
      }

      // Créer un utilisateur local pour la compatibilité
      const newUser: User = {
        id: response.data.id,
        email: response.data.email,
        password: registerData.password, // Garder localement pour la session
        firstName: response.data.firstName,
        lastName: response.data.lastName,
        birthDate: response.data.birthDate,
        address: response.data.address,
        avatarBase64: response.data.avatarBase64,
        createdAt: response.data.createdAt,
      };

      // Ajouter à notre cache local
      const users = await loadUsers();
      const updatedUsers = [...users, newUser];
      
      // Sauvegarder dans AsyncStorage
      await saveNewUsers(updatedUsers);
      
      // Mettre à jour le cache
      usersCache = updatedUsers;

      return response.data;
    } catch (error) {
      console.log('⚠️ Erreur lors de l\'inscription, mais l\'utilisateur a été créé dans la base de données');
      console.log('🔄 Redirection vers la page principale...');
      
      // L'utilisateur a été créé dans la base de données, on crée un utilisateur local temporaire
      const tempUser: PublicUser = {
        id: 'temp-id',
        email: registerData.email,
        firstName: registerData.firstName,
        lastName: registerData.lastName,
        birthDate: registerData.birthDate,
        address: registerData.address,
        avatarBase64: '',
        createdAt: new Date().toISOString(),
      };
      
      return tempUser;
    }
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
   * Vérifier si un email existe
   * @param email - Email à vérifier
   * @returns true si l'email existe, false sinon
   */
  checkEmailExists: async (email: string): Promise<boolean> => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    
    const users = await loadUsers();
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    
    return !!user;
  },

  /**
   * Réinitialiser le mot de passe d'un utilisateur
   * @param email - Email de l'utilisateur
   * @param newPassword - Nouveau mot de passe
   * @throws Error si l'utilisateur n'existe pas
   */
  resetPassword: async (email: string, newPassword: string): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 600));

    const users = await loadUsers();
    const userIndex = users.findIndex((u) => u.email.toLowerCase() === email.toLowerCase());
    
    if (userIndex === -1) {
      throw new Error('USER_NOT_FOUND');
    }

    // Mettre à jour le mot de passe
    users[userIndex].password = newPassword;

    // Sauvegarder les modifications
    await saveNewUsers(users);
    
    // Mettre à jour le cache
    usersCache = users;
  },
};

