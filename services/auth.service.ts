import usersData from '@/data/users.json';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  createdAt: string;
}

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

// Clé pour AsyncStorage
const STORAGE_KEY = '@maya_users';

// Cache en mémoire pour les performances
let usersCache: User[] | null = null;

// Fonction utilitaire pour enlever le mot de passe d'un utilisateur
const removePassword = (user: User): PublicUser => {
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
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
   * Connexion d'un utilisateur
   * @param email - Email de l'utilisateur
   * @param password - Mot de passe de l'utilisateur
   * @returns L'utilisateur sans le mot de passe
   * @throws Error si les identifiants sont invalides
   */
  signIn: async (email: string, password: string): Promise<PublicUser> => {
    // Simuler une latence réseau
    await new Promise((resolve) => setTimeout(resolve, 600));

    const users = await loadUsers();
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      throw new Error('INVALID_EMAIL');
    }

    if (user.password !== password) {
      throw new Error('INVALID_PASSWORD');
    }

    return removePassword(user);
  },

  /**
   * Inscription d'un nouvel utilisateur
   * @param email - Email de l'utilisateur
   * @param password - Mot de passe de l'utilisateur
   * @param name - Nom de l'utilisateur (optionnel)
   * @returns L'utilisateur créé sans le mot de passe
   * @throws Error si l'email existe déjà
   */
  signUp: async (email: string, password: string, name?: string): Promise<PublicUser> => {
    // Simuler une latence réseau
    await new Promise((resolve) => setTimeout(resolve, 800));

    const users = await loadUsers();

    // Vérifier si l'email existe déjà
    const existingUser = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      throw new Error('EMAIL_ALREADY_EXISTS');
    }

    // Créer le nouvel utilisateur
    const newUser: User = {
      id: Date.now().toString(),
      email,
      password,
      name: name || email.split('@')[0],
      createdAt: new Date().toISOString(),
    };

    // Ajouter à la liste des utilisateurs
    const updatedUsers = [...users, newUser];
    
    // Sauvegarder dans AsyncStorage
    await saveNewUsers(updatedUsers);
    
    // Mettre à jour le cache
    usersCache = updatedUsers;

    return removePassword(newUser);
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

