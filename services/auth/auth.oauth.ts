/**
 * Gestion de l'authentification OAuth (Google)
 */

import { apiCall } from '@/services/shared/api';
import { log } from '@/utils/logger';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AuthSession from 'expo-auth-session';
import Constants from 'expo-constants';
import { API_BASE_URL, USER_STORAGE_KEY } from './auth.config';
import { saveTokens } from './auth.tokens';
import { PublicUser, TokenData, User } from './auth.types';

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
    // Pour iOS, utilisez le Client ID iOS créé dans Google Console
    // IMPORTANT: Le Client ID iOS doit avoir le Bundle ID: com.mayaconnect.app
    const clientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || 
                     Constants.expoConfig?.extra?.googleClientId ||
                     '125229396520-lecj818mbh823h4l3cno4els6ag58ue9.apps.googleusercontent.com';
    if (!clientId) {
      throw new Error('Google Client ID non configuré. Veuillez définir EXPO_PUBLIC_GOOGLE_CLIENT_ID');
    }

    // Pour un Client ID iOS, Google génère automatiquement un "Schéma d'URL iOS"
    // Exemple: com.googleusercontent.apps.xxxxx
    // Ce schéma est visible dans Google Console > Credentials > votre Client ID iOS
    // Pour iOS, on peut utiliser soit :
    // 1. Le schéma généré par Google (com.googleusercontent.apps.xxxxx)
    // 2. Le proxy Expo qui génère une URL HTTPS valide (recommandé pour le développement)
    // 3. Le scheme personnalisé (maya://) mais il faut l'ajouter dans "Authorized redirect URIs"
    
    // En développement, Expo utilise automatiquement le proxy si disponible
    // Le proxy génère une URL HTTPS valide : https://auth.expo.io/@username/slug
    const redirectUri = AuthSession.makeRedirectUri({
      scheme: 'maya',
      // Expo détecte automatiquement si on est en dev et utilise le proxy si nécessaire
    });

    console.log('🔐 [Google OAuth] Configuration:', {
      clientId: clientId.substring(0, 30) + '...',
      redirectUri: redirectUri,
      scheme: 'maya',
      useProxy: __DEV__,
      isDev: __DEV__,
    });

    log.info('Configuration OAuth Google', {
      clientId: clientId.substring(0, 30) + '...',
      redirectUri: redirectUri,
      scheme: 'maya',
      useProxy: __DEV__,
    });

    // Avertissement si le redirect URI semble incorrect
    if (!redirectUri || (!redirectUri.startsWith('maya://') && !redirectUri.startsWith('exp://') && !redirectUri.startsWith('https://'))) {
      log.warn('Redirect URI peut être incorrect', { redirectUri });
      console.warn('⚠️ [Google OAuth] Redirect URI peut être incorrect:', redirectUri);
    } else {
      console.log('✅ [Google OAuth] Redirect URI généré:', redirectUri);
      console.log('📝 [Google OAuth] Pour un Client ID iOS:');
      console.log('   1. Le "Schéma d\'URL iOS" dans Google Console est généré automatiquement');
      console.log('   2. Vous devez ajouter ce redirect URI dans "Authorized redirect URIs":');
      console.log('      - Allez dans Google Cloud Console > APIs & Services > Credentials');
      console.log('      - Sélectionnez votre Client ID iOS');
      console.log('      - Dans "Authorized redirect URIs", ajoutez:', redirectUri);
      console.log('   3. Le Bundle ID doit être exactement: com.mayaconnect.app');
    }

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
      redirectUri: request.redirectUri || redirectUri,
      scopes: request.scopes,
      usePKCE: true,
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
          let errorData: any = {};
          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = { error: errorText };
          }
          
          log.error('Erreur lors de l\'échange du code', {
            status: tokenResponse.status,
            statusText: tokenResponse.statusText,
            error: errorData.error || errorText,
            errorDescription: errorData.error_description,
            redirectUri: redirectUri,
            clientId: clientId.substring(0, 30) + '...',
          });
          
          const errorMsg = errorData.error || 'unknown_error';
          const errorDesc = errorData.error_description || '';
          
          if (errorMsg.includes('invalid_request') || errorDesc.includes('redirect_uri')) {
            throw new Error(`Erreur de configuration: Le redirect URI (${redirectUri}) doit correspondre exactement à celui configuré dans Google Console.`);
          } else if (errorMsg.includes('invalid_client')) {
            throw new Error('Client ID Google invalide. Vérifiez la configuration dans Google Console.');
          } else if (errorMsg.includes('invalid_grant')) {
            throw new Error('Code d\'autorisation invalide ou expiré. Veuillez réessayer.');
          }
          
          throw new Error(`Impossible d'échanger le code contre un token: ${errorDesc || errorMsg}`);
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
                          ('errorCode' in result ? (result as any).errorCode :
                          ('params' in result && (result as any).params?.error ? (result as any).params.error :
                          ('message' in result ? (result as any).message : 
                          'Erreur inconnue'))));
      
      const errorDescription = 'params' in result && (result as any).params?.error_description 
        ? (result as any).params.error_description 
        : undefined;
      
      log.error('Erreur lors de l\'authentification Google', {
        error: errorDetails,
        errorDescription: errorDescription,
        resultType: result.type,
        redirectUri: redirectUri,
        clientId: clientId.substring(0, 30) + '...',
        fullResult: JSON.stringify(result, null, 2),
      });

      // Messages d'erreur plus explicites
      let errorMessage = 'Erreur lors de la connexion Google';
      const errorStr = String(errorDetails).toLowerCase();
      const descStr = errorDescription ? String(errorDescription).toLowerCase() : '';
      
      if (errorStr.includes('access_denied') || errorStr.includes('blocked')) {
        errorMessage = 'Accès bloqué. Vérifiez que l\'application est autorisée dans votre compte Google.';
      } else if (errorStr.includes('redirect_uri_mismatch') || descStr.includes('redirect_uri')) {
        errorMessage = `Erreur de configuration redirect URI. Le redirect URI utilisé (${redirectUri}) doit être configuré dans Google Console.`;
      } else if (errorStr.includes('invalid_client') || descStr.includes('invalid_client')) {
        errorMessage = 'Client ID Google invalide. Vérifiez que le Client ID est correct et configuré pour une application mobile.';
      } else if (errorStr.includes('invalid_request') || descStr.includes('invalid_request')) {
        errorMessage = `Erreur de requête invalide. Vérifiez que le Client ID et le redirect URI (${redirectUri}) sont correctement configurés dans Google Console.`;
      } else if (errorStr.includes('unauthorized_client')) {
        errorMessage = 'Client non autorisé. Vérifiez que le Client ID est configuré pour OAuth dans Google Console.';
      } else {
        errorMessage = `Erreur Google: ${errorDetails}${errorDescription ? ` - ${errorDescription}` : ''}`;
      }
      
      throw new Error(errorMessage);
    } else {
      log.info('Authentification Google annulée par l\'utilisateur');
      throw new Error('Connexion Google annulée');
    }
  } catch (error) {
    log.error('Erreur lors de la connexion Google', error as Error);
    
    // Améliorer les messages d'erreur pour les erreurs 400
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();
      
      // Si c'est une erreur 400 invalid_request, donner des instructions claires
      if (errorMessage.includes('invalid_request') || errorMessage.includes('400')) {
        const redirectUri = AuthSession.makeRedirectUri({ scheme: 'maya' });
        const enhancedError = new Error(
          `Erreur de configuration Google OAuth (400 invalid_request). ` +
          `Vérifiez que le redirect URI "${redirectUri}" est bien configuré dans Google Console. ` +
          `Allez dans Google Cloud Console > APIs & Services > Credentials > votre OAuth 2.0 Client ID ` +
          `et ajoutez "${redirectUri}" dans "Authorized redirect URIs".`
        );
        log.error('Erreur 400 invalid_request détectée', {
          redirectUri,
          originalError: error.message,
        });
        throw enhancedError;
      }
    }
    
    throw error;
  }
}

