/**
 * Gestion de l'authentification OAuth (Google)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AuthSession from 'expo-auth-session';
import { log } from '@/utils/logger';
import { apiCall } from '@/services/shared/api';
import { API_BASE_URL, USER_STORAGE_KEY } from './auth.config';
import { saveTokens } from './auth.tokens';
import { PublicUser, User, TokenData } from './auth.types';

/**
 * Connexion via Google OAuth
 * @returns L'utilisateur connecté
 * @throws Error si la connexion Google échoue
 */
export async function signInWithGoogle(): Promise<PublicUser> {
  log.info('Début de la connexion Google');
  
  try {
    // Configuration de la requête d'authentification Google
    const discovery = {
      authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenEndpoint: 'https://oauth2.googleapis.com/token',
      revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
    };

    // Récupérer le Client ID depuis les variables d'environnement ou app.json
    const clientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || 
                     '535870809549-kanp7rd1hmu5ubq88aejlg2pk78htjhi.apps.googleusercontent.com';
    
    if (!clientId) {
      throw new Error('Google Client ID non configuré. Veuillez définir EXPO_PUBLIC_GOOGLE_CLIENT_ID');
    }

    const redirectUri = AuthSession.makeRedirectUri({});

    const request = new AuthSession.AuthRequest({
      clientId: clientId,
      scopes: ['openid', 'profile', 'email'],
      responseType: AuthSession.ResponseType.Code,
      redirectUri: redirectUri,
      usePKCE: true,
      extraParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    });

    log.debug('Requête d\'authentification Google créée', {
      clientId: clientId.substring(0, 20) + '...',
      redirectUri: request.redirectUri,
      scopes: request.scopes,
    });

    // Lancer la requête d'authentification
    const result = await request.promptAsync(discovery);
    
    log.debug('Résultat de l\'authentification Google', { type: result.type });

    if (result.type === 'success' && 'params' in result) {
      const params = result.params as { code?: string; id_token?: string };
      
      // Si on utilise le flow Code, échanger le code contre un token
      let idToken: string | undefined;
      
      if (params.code) {
        log.info('Code d\'autorisation reçu, échange contre un token');
        
        const codeVerifier = request.codeVerifier;
        
        if (!codeVerifier) {
          log.error('Code verifier manquant pour PKCE');
          throw new Error('Erreur de configuration PKCE');
        }

        const tokenResponse = await fetch(discovery.tokenEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            code: params.code,
            client_id: clientId,
            redirect_uri: redirectUri,
            grant_type: 'authorization_code',
            code_verifier: codeVerifier,
          }).toString(),
        });

        if (!tokenResponse.ok) {
          const errorText = await tokenResponse.text();
          log.error('Erreur lors de l\'échange du code', new Error(errorText));
          throw new Error('Impossible d\'échanger le code contre un token');
        }

        const tokenData = await tokenResponse.json();
        idToken = tokenData.id_token;
        
        if (!idToken) {
          log.error('Aucun id_token dans la réponse d\'échange');
          throw new Error('Aucun token Google reçu après l\'échange');
        }
        
        log.info('ID Token obtenu après échange');
      } else if (params.id_token) {
        idToken = params.id_token;
        log.info('ID Token reçu directement');
      } else {
        log.error('Aucun code ni id_token reçu de Google', { params: Object.keys(params) });
        throw new Error('Aucun token Google reçu');
      }

      log.debug('Appel API: POST /auth/google', { baseUrl: API_BASE_URL });

      // Envoyer l'idToken à votre API backend
      const startTime = Date.now();
      const response = await apiCall<any>('/auth/google', {
        method: 'POST',
        body: JSON.stringify({
          idToken: idToken,
        }),
      });
      const duration = Date.now() - startTime;

      log.debug('Réponse API reçue', {
        duration: duration + 'ms',
        hasUser: !!response?.user,
        hasAccessToken: !!response?.accessToken,
      });

      // Extraire les données de l'utilisateur de la réponse
      const userData = response.user || response.data || response;
      
      // Créer l'utilisateur avec les données reçues
      const user: User = {
        id: userData.id || response.userId || 'temp-id',
        email: userData.email || '',
        password: '',
        firstName: userData.firstName || userData.first_name || userData.given_name || 'Utilisateur',
        lastName: userData.lastName || userData.last_name || userData.family_name || 'Maya',
        birthDate: userData.birthDate || userData.birth_date || new Date().toISOString(),
        address: userData.address || {
          street: '',
          city: '',
          state: '',
          postalCode: '',
          country: 'France'
        },
        avatarBase64: userData.avatarBase64 || userData.avatar || userData.picture || '',
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
        log.warn('Pas de token dans la réponse');
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
      log.info('Utilisateur Google sauvegardé', { email: publicUser.email });

      return publicUser;
    } else if (result.type === 'error') {
      const errorDetails = 'errorCode' in result ? result.errorCode : 
                          ('error' in result ? (result as any).error : 
                          ('message' in result ? (result as any).message : 
                          'Erreur inconnue'));
      
      log.error('Erreur lors de l\'authentification Google', {
        error: errorDetails,
        resultType: result.type,
      });

      // Messages d'erreur plus explicites
      let errorMessage = 'Erreur lors de la connexion Google';
      if (typeof errorDetails === 'string') {
        if (errorDetails.includes('access_denied') || errorDetails.includes('blocked')) {
          errorMessage = 'Accès bloqué. Vérifiez que l\'application est autorisée dans votre compte Google.';
        } else if (errorDetails.includes('redirect_uri_mismatch')) {
          errorMessage = 'Erreur de configuration. Le redirect URI n\'est pas autorisé.';
        } else if (errorDetails.includes('invalid_client')) {
          errorMessage = 'Client ID Google invalide. Vérifiez la configuration.';
        } else {
          errorMessage = `Erreur Google: ${errorDetails}`;
        }
      }
      
      throw new Error(errorMessage);
    } else {
      log.info('Authentification Google annulée par l\'utilisateur');
      throw new Error('Connexion Google annulée');
    }
  } catch (error) {
    log.error('Erreur lors de la connexion Google', error as Error);
    throw error;
  }
}

