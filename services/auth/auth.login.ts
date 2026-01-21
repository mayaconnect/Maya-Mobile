/**
 * Gestion de la connexion et de l'inscription
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { log } from '@/utils/logger';
import { apiCall } from '@/services/shared/api';
import { USER_STORAGE_KEY } from './auth.config';
import { saveTokens } from './auth.tokens';
import { PublicUser, User, LoginRequest, RegisterRequest, TokenData } from './auth.types';

/**
 * Connexion d'un utilisateur via l'API backend
 * @param loginData - Données de connexion (email et password)
 * @returns L'utilisateur sans le mot de passe
 * @throws Error si les identifiants sont invalides
 */
export async function signIn(loginData: LoginRequest): Promise<PublicUser> {
  try {
    log.info('Tentative de connexion', {
      email: loginData.email,
      passwordLength: loginData.password?.length || 0,
    });

    // Appel à l'API backend - l'API retourne directement le token
    const response = await apiCall<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(loginData),
    });

    log.debug('Réponse API reçue', { hasUser: !!response?.user, hasToken: !!response?.accessToken });

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
        expiresAt: response.expiresAt || new Date(Date.now() + 3600000).toISOString(),
        userId: user.id,
      };
      
      await saveTokens(tokenData);
      log.info('Token sauvegardé');
    } else {
      log.warn('Pas de token dans la réponse', { responseKeys: Object.keys(response) });
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
    log.info('Utilisateur sauvegardé', { email: publicUser.email });

    return publicUser;
  } catch (error) {
    log.error('Erreur lors de la connexion', error as Error);
    
    // Vérifier si c'est une erreur d'identifiants invalides
    if (error instanceof Error) {
      if (error.message.includes('401') || error.message.includes('Unauthorized') || error.message.includes('invalid')) {
        log.warn('Identifiants invalides détectés');
        throw new Error('INVALID_CREDENTIALS');
      }
      
      if (error.message.includes('TIMEOUT_ERROR')) {
        log.warn('Timeout de connexion détecté');
        throw new Error('TIMEOUT_ERROR');
      }
    }
    
    throw error;
  }
}

/**
 * Inscription d'un nouvel utilisateur via l'API backend
 * @param registerData - Données d'inscription
 * @returns L'utilisateur créé sans le mot de passe
 * @throws Error si l'email existe déjà ou en cas d'erreur API
 */
export async function signUp(registerData: RegisterRequest): Promise<PublicUser> {
  try {
    // Préparer le body de la requête avec tous les champs requis
    const requestBody: any = {
      email: registerData.email,
      password: registerData.password,
      firstName: registerData.firstName,
      lastName: registerData.lastName,
      birthDate: registerData.birthDate,
      address: registerData.address,
    };
    
    // Ajouter les champs optionnels s'ils sont présents
    if (registerData.avatarBase64) {
      requestBody.avatarBase64 = registerData.avatarBase64;
    }
    
    // Ajouter le role s'il est présent (OBLIGATOIRE pour l'API)
    if (registerData.role) {
      const roleValue = registerData.role === 'client' ? 'Client' : 
                       registerData.role === 'partners' ? 'Partner' : 
                       registerData.role;
      requestBody.Role = roleValue;
      requestBody.role = registerData.role;
    }

    log.debug('Données d\'inscription envoyées', { email: registerData.email, hasRole: !!registerData.role });
    
    // Appel à l'API backend pour créer le compte
    const registerResponse = await apiCall<any>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    log.info('Compte créé avec succès', { userId: registerResponse?.user?.id || registerResponse?.id });

    // Stocker les tokens reçus après inscription
    if (registerResponse.accessToken) {
      const tokenData: TokenData = {
        accessToken: registerResponse.accessToken,
        refreshToken: registerResponse.refreshToken,
        expiresAt: registerResponse.expiresAt || new Date(Date.now() + 3600000).toISOString(),
        userId: registerResponse.user?.id || registerResponse.id || 'temp-id',
      };
      
      await saveTokens(tokenData);
      log.info('Token sauvegardé après inscription');
    }

    // Appeler PUT /auth/me pour mettre à jour les infos complètes
    let mergedUserData: any = registerResponse?.user ?? registerResponse;
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
      id: mergedUserData?.id || registerResponse.user?.id || registerResponse.id || 'temp-id',
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
    log.info('Utilisateur sauvegardé après inscription', { email: publicUser.email });

    return publicUser;
  } catch (error) {
    log.error('Erreur lors de l\'inscription', error as Error);
    throw error;
  }
}

