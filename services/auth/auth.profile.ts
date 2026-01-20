/**
 * Gestion du profil utilisateur (mise à jour, upload avatar)
 */

import { apiCall } from '@/services/shared/api';
import { log } from '@/utils/logger';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, USER_STORAGE_KEY } from './auth.config';
import { PublicUser } from './auth.types';
import { getTokens } from './auth.tokens';

/**
 * Met à jour le profil de l'utilisateur actuel (PUT /auth/me)
 */
export async function updateCurrentUser(updates: Partial<Omit<PublicUser, 'id' | 'createdAt'>>): Promise<PublicUser> {
  try {
    log.debug('Mise à jour du profil', { fields: Object.keys(updates) });

    const response = await apiCall<any>('/auth/me', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });

    const userData: PublicUser = response?.user ?? response;

    // Mettre à jour le cache local
    await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
    log.info('Profil mis à jour', { userId: userData.id });

    return userData;
  } catch (error) {
    log.error('Erreur lors de la mise à jour du profil', error as Error);
    throw error;
  }
}

/**
 * Upload un avatar (POST /auth/upload-avatar, multipart, max 5MB)
 * @param imageUri - URI locale de l'image à uploader
 * @returns L'utilisateur mis à jour avec le nouvel avatar
 * @throws Error si l'upload échoue
 */
export async function uploadAvatar(imageUri: string): Promise<PublicUser> {
  try {
    log.info('Début de l\'upload d\'avatar', { imageUri: imageUri.substring(0, 50) + '...' });

    // Récupérer le token d'authentification
    const tokens = await getTokens();
    
    if (!tokens?.accessToken) {
      log.error('Aucun token d\'authentification disponible pour l\'upload');
      throw new Error('Utilisateur non authentifié');
    }

    // Créer un FormData pour l'upload multipart
    const formData = new FormData();
    
    // Extraire le nom du fichier de l'URI
    const filename = imageUri.split('/').pop() || 'avatar.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    // Ajouter le fichier au FormData
    // Note: Pour React Native, le format est { uri, name, type }
    formData.append('file', {
      uri: imageUri,
      name: filename,
      type: type,
    } as any);

    log.debug('FormData créé', { filename, type, hasToken: !!tokens.accessToken });

    // Appel API avec FormData
    // Important: Ne pas mettre Content-Type pour FormData, le navigateur le fait automatiquement
    const url = `${API_BASE_URL}/auth/upload-avatar`;
    
    log.debug('Appel API upload-avatar', { url, filename });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokens.accessToken}`,
        // Ne pas mettre Content-Type pour FormData, fetch le fait automatiquement avec boundary
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorData.error || errorMessage;
        log.error('Erreur API lors de l\'upload', new Error(errorMessage), { 
          status: response.status,
          errorData 
        });
      } catch {
        log.error('Erreur API lors de l\'upload', new Error(errorText), { 
          status: response.status 
        });
      }
      
      throw new Error(errorMessage);
    }

    // Vérifier le Content-Type de la réponse
    const contentType = response.headers.get('content-type');
    log.debug('Content-Type de la réponse', { contentType });
    
    let responseData: any;
    try {
      // Essayer de parser la réponse en JSON
      const responseText = await response.text();
      log.debug('Réponse texte brute', { 
        length: responseText.length,
        preview: responseText.substring(0, 200),
      });
      
      if (!responseText || responseText.trim().length === 0) {
        log.error('Réponse vide', new Error('La réponse de l\'API est vide'));
        throw new Error('La réponse de l\'API est vide');
      }
      
      responseData = JSON.parse(responseText);
    } catch (parseError) {
      log.error('Erreur lors du parsing JSON', parseError as Error, {
        contentType,
        status: response.status,
      });
      throw new Error('Impossible de parser la réponse de l\'API en JSON');
    }
    
    // Logger la réponse complète pour déboguer
    log.debug('Réponse API parsée', { 
      hasUser: !!responseData?.user,
      hasData: !!responseData?.data,
      hasUrl: !!responseData?.url,
      responseKeys: Object.keys(responseData || {}),
      responseType: typeof responseData,
      responsePreview: JSON.stringify(responseData).substring(0, 200),
    });

    // Essayer différents formats de réponse possibles
    let userData: PublicUser | null = null;
    
    // Format 1: { user: {...} }
    if (responseData?.user && typeof responseData.user === 'object' && responseData.user.id) {
      userData = responseData.user as PublicUser;
      log.debug('Données utilisateur trouvées dans responseData.user');
    }
    // Format 2: { data: { user: {...} } }
    else if (responseData?.data?.user && typeof responseData.data.user === 'object' && responseData.data.user.id) {
      userData = responseData.data.user as PublicUser;
      log.debug('Données utilisateur trouvées dans responseData.data.user');
    }
    // Format 3: { data: {...} } (les données sont directement dans data)
    else if (responseData?.data && typeof responseData.data === 'object' && responseData.data.id) {
      userData = responseData.data as PublicUser;
      log.debug('Données utilisateur trouvées dans responseData.data');
    }
    // Format 4: La réponse est directement l'utilisateur
    else if (responseData && typeof responseData === 'object' && responseData.id) {
      userData = responseData as PublicUser;
      log.debug('Données utilisateur trouvées directement dans la réponse');
    }
    // Format 5: { url: "..." } - L'API retourne juste l'URL, on doit récupérer les infos utilisateur
    else if (responseData?.url && typeof responseData.url === 'string') {
      log.info('L\'API a retourné l\'URL de l\'avatar, récupération des informations utilisateur complètes', { 
        avatarUrl: responseData.url,
      });

      // Récupérer les informations utilisateur complètes après l'upload
      try {
        const meResponse = await apiCall<any>('/auth/me', {
          method: 'GET',
        });

        const maybeUser: PublicUser | undefined = meResponse?.user ?? meResponse;
        if (maybeUser && maybeUser.id) {
          userData = maybeUser;
          log.debug('Informations utilisateur récupérées après upload', { userId: userData.id });
        } else {
          throw new Error('Aucune donnée utilisateur dans la réponse /auth/me');
        }
      } catch (fetchError) {
        log.error('Erreur lors de la récupération des informations utilisateur après upload', fetchError as Error);
        throw new Error('Upload réussi mais impossible de récupérer les informations utilisateur mises à jour');
      }
    }

    if (!userData || !userData.id) {
      log.error('Réponse API invalide', new Error('Aucune donnée utilisateur dans la réponse'), {
        responseData,
        responseKeys: Object.keys(responseData || {}),
        hasUser: !!responseData?.user,
        hasData: !!responseData?.data,
        hasUrl: !!responseData?.url,
      });
      throw new Error(`Réponse API invalide: format de réponse non reconnu. Réponse reçue: ${JSON.stringify(responseData).substring(0, 200)}`);
    }

    // Mettre à jour le cache local
    await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
    log.info('Avatar uploadé avec succès', { 
      userId: userData.id,
      hasAvatar: !!userData.avatarBase64 
    });

    return userData;
  } catch (error) {
    log.error('Erreur lors de l\'upload de l\'avatar', error as Error);
    
    // Messages d'erreur plus explicites
    if (error instanceof Error) {
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        throw new Error('Session expirée. Veuillez vous reconnecter.');
      }
      if (error.message.includes('413') || error.message.includes('too large')) {
        throw new Error('L\'image est trop volumineuse. Taille maximale: 5MB');
      }
      if (error.message.includes('415') || error.message.includes('Unsupported Media Type')) {
        throw new Error('Format d\'image non supporté. Utilisez JPG, PNG ou GIF');
      }
    }
    
    throw error;
  }
}

