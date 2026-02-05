/**
 * Gestion de la connexion et de l'inscription
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { log } from '@/utils/logger';
import { apiCall } from '@/services/shared/api';
import { USER_STORAGE_KEY } from './auth.config';
import { saveTokens, getTokens } from './auth.tokens';
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

    log.info('📝 Réponse complète de l\'inscription', {
      hasUser: !!registerResponse?.user,
      hasId: !!registerResponse?.id,
      userId: registerResponse?.user?.id || registerResponse?.id,
      hasAccessToken: !!registerResponse?.accessToken,
      responseKeys: Object.keys(registerResponse || {}),
      fullResponse: JSON.stringify(registerResponse, null, 2).substring(0, 500),
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
      
      // Vérifier que le token a bien été sauvegardé
      const savedTokens = await getTokens();
      if (!savedTokens || savedTokens.accessToken !== registerResponse.accessToken) {
        log.warn('⚠️ Le token n\'a pas été correctement sauvegardé');
      } else {
        log.info('✅ Token vérifié et correctement sauvegardé');
      }
    } else {
      log.warn('⚠️ Aucun token reçu dans la réponse d\'inscription', {
        responseKeys: Object.keys(registerResponse || {}),
        hasUser: !!registerResponse?.user,
      });
    }

    // IMPORTANT: Récupérer le vrai ID utilisateur depuis l'API avec le token
    // On ne doit JAMAIS utiliser "temp-id" si on a un token valide
    let finalUserData: any = registerResponse?.user ?? registerResponse;
    let userId = finalUserData?.id || registerResponse.id;
    
    // Si on a un token mais pas d'ID valide, OBLIGATOIREMENT récupérer depuis /auth/me
    if (registerResponse.accessToken && (!userId || userId === 'temp-id')) {
      try {
        log.info('🔄 Récupération OBLIGATOIRE de l\'ID utilisateur depuis /auth/me avec le token');
        
        // Attendre un court délai pour que l'API finalise la création
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const meResponse = await apiCall<any>('/auth/me', {
          method: 'GET',
        });
        
        if (meResponse?.user?.id || meResponse?.id) {
          userId = meResponse.user?.id || meResponse.id;
          finalUserData = meResponse.user || meResponse;
          log.info('✅ ID utilisateur réel récupéré depuis /auth/me:', userId);
        } else {
          log.error('❌ /auth/me n\'a pas retourné d\'ID utilisateur', {
            responseKeys: Object.keys(meResponse || {}),
            response: JSON.stringify(meResponse, null, 2).substring(0, 500),
          });
          throw new Error('Aucun ID utilisateur dans la réponse /auth/me');
        }
      } catch (error) {
        log.error('❌ ERREUR CRITIQUE: Impossible de récupérer l\'ID depuis /auth/me', error);
        // Si on a un token mais pas d'ID, c'est un problème grave
        // On ne peut pas continuer avec temp-id si on a un token valide
        throw new Error('Impossible de récupérer l\'ID utilisateur après l\'inscription. Le compte a peut-être été créé mais l\'authentification a échoué.');
      }
    } else if (!registerResponse.accessToken) {
      log.error('❌ ERREUR: Aucun token reçu lors de l\'inscription');
      throw new Error('Aucun token d\'authentification reçu lors de l\'inscription');
    }
    
    // Vérification finale : on ne doit JAMAIS avoir temp-id si on a un token
    if (userId === 'temp-id' && registerResponse.accessToken) {
      log.error('❌ ERREUR CRITIQUE: ID utilisateur reste temp-id malgré la présence d\'un token');
      throw new Error('Impossible de récupérer l\'ID utilisateur valide après l\'inscription');
    }

    // Merger les données si nécessaire
    if (!finalUserData?.firstName && registerData.firstName) {
      finalUserData = {
        ...finalUserData,
        firstName: registerData.firstName,
        lastName: registerData.lastName,
        birthDate: registerData.birthDate,
        address: registerData.address,
      };
    }

    // Créer l'objet utilisateur avec les données mises à jour
    const newUser: User = {
      id: userId,
      email: registerData.email,
      password: registerData.password,
      firstName: finalUserData?.firstName ?? registerData.firstName,
      lastName: finalUserData?.lastName ?? registerData.lastName,
      birthDate: finalUserData?.birthDate ?? registerData.birthDate,
      address: finalUserData?.address ?? registerData.address,
      avatarBase64: registerData.avatarBase64,
      createdAt: finalUserData?.createdAt ?? new Date().toISOString(),
    };
    
    // Mettre à jour le userId dans les tokens si on a maintenant un vrai ID
    if (userId !== 'temp-id' && registerResponse.accessToken) {
      const tokens = await getTokens();
      if (tokens) {
        tokens.userId = userId;
        await saveTokens(tokens);
        log.info('✅ userId mis à jour dans les tokens:', userId);
      }
    }

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

