import AsyncStorage from '@react-native-async-storage/async-storage';

import { API_BASE_URL, AuthService } from './auth.service';
import { apiCall } from './shared/api';

const QR_TOKEN_STORAGE_KEY = '@maya_partner_qr_token';

export type QrTokenData = {
  token: string;
  expiresAt: string;
};

export type QrCodeResponse = {
  token: string;
  expiresAt: string;
  imageBase64?: string;
  qrCodeUrl?: string;
};

const saveQrToken = async (token: QrTokenData): Promise<void> => {
  try {
    await AsyncStorage.setItem(QR_TOKEN_STORAGE_KEY, JSON.stringify(token));
  } catch (error) {
    console.error('❌ Erreur lors de la sauvegarde du QR token:', error);
  }
};

const loadQrToken = async (): Promise<QrTokenData | null> => {
  try {
    const stored = await AsyncStorage.getItem(QR_TOKEN_STORAGE_KEY);
    if (!stored) {
      return null;
    }

    const parsed: QrTokenData = JSON.parse(stored);
    if (!parsed?.token || !parsed?.expiresAt) {
      return null;
    }

    return parsed;
  } catch (error) {
    console.error('❌ Erreur lors du chargement du QR token:', error);
    return null;
  }
};

const clearQrToken = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(QR_TOKEN_STORAGE_KEY);
  } catch (error) {
    console.error('❌ Erreur lors de la suppression du QR token:', error);
  }
};

const QR_API_BASE_URL = API_BASE_URL.includes('/api/v1')
  ? API_BASE_URL.replace('/api/v1', '/api')
  : API_BASE_URL;

export const QrService = {
  /**
   * Génère un nouveau token QR via l'API
   * @param forceRefresh - Force la génération d'un nouveau token même si un token valide existe
   */
  issueQrToken: async (forceRefresh: boolean = false): Promise<QrTokenData> => {
    console.log('🔐 [QR Service] issueQrToken appelé', { forceRefresh });

    // Vérifier le cache si pas de refresh forcé
    if (!forceRefresh) {
      console.log('📦 [QR Service] Vérification du cache...');
      const existing = await loadQrToken();
      if (existing) {
        const expiry = new Date(existing.expiresAt).getTime();
        const timeUntilExpiry = expiry - Date.now();
      

        if (expiry > Date.now() + 60 * 1000) {
          return existing;
        } else {
        }
      } else {
        console.log('📦 [QR Service] Aucun token en cache');
      }
    } else {
      console.log('🔄 [QR Service] Refresh forcé demandé');
    }

   

    let response: any;
    try {
      const token = await AuthService.getAccessToken();
      console.log('🔑 [QR Service] Token d\'authentification:', token ? token.substring(0, 20) + '...' : 'Aucun');

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
        console.log('✅ [QR Service] Header Authorization ajouté');
      } else {
        console.warn('⚠️ [QR Service] Aucun token d\'authentification disponible');
      }

      const startTime = Date.now();
      response = await apiCall<any>(
        '/qr/issue-token-frontend',
        {
          method: 'POST',
          headers,
        },
        0,
        QR_API_BASE_URL,
      );
      const duration = Date.now() - startTime;
      console.log('✅ [QR Service] Réponse API reçue', {
        duration: duration + 'ms',
        responseType: typeof response,
        hasToken: !!response?.token,
        hasExpiresAt: !!response?.expiresAt,
      });

      if (response) {
        console.log('📄 [QR Service] Contenu de la réponse:', {
          token: response?.token ? response.token.substring(0, 30) + '...' : 'undefined',
          expiresAt: response?.expiresAt || 'undefined',
          fullResponse: JSON.stringify(response, null, 2),
        });
      }
    } catch (error) {
      console.error('❌ [QR Service] Erreur lors de l\'appel API:', error);
      if (error instanceof Error) {
        console.error('❌ [QR Service] Détails de l\'erreur:', {
          message: error.message,
          name: error.name,
          stack: error.stack?.substring(0, 200),
        });

        if (error.message.includes('HTTP 403')) {
          console.warn('⚠️ [QR Service] Accès refusé (403), utilisation d\'un QR local de fallback');
        const fallback: QrTokenData = {
          token: `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        };
        await saveQrToken(fallback);
          console.log('💾 [QR Service] Token de fallback sauvegardé');
        return fallback;
        }
      }
      throw error;
    }

    // Parser la réponse
    console.log('🔄 [QR Service] Parsing de la réponse...');
    let qrData: QrTokenData;
    if (typeof response === 'string') {
      console.log('📝 [QR Service] Réponse est une string, tentative de parsing JSON...');
      try {
        qrData = JSON.parse(response);
        console.log('✅ [QR Service] Parsing JSON réussi');
      } catch {
        console.log('⚠️ [QR Service] Parsing JSON échoué, utilisation de la string comme token');
        qrData = {
          token: response,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        };
      }
    } else {
      console.log('📦 [QR Service] Réponse est un objet');
      qrData = {
        token: response?.token,
        expiresAt:
          response?.expiresAt ?? new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      };
    }

    // Valider les données
    if (!qrData?.token) {
      console.error('❌ [QR Service] Token manquant dans la réponse', {
        qrData,
        response,
      });
      throw new Error('Réponse invalide du serveur pour le QR token');
    }

    console.log('✅ [QR Service] Token valide généré', {
      token: qrData.token.substring(0, 30) + '...',
      expiresAt: qrData.expiresAt,
      expiresIn: Math.round((new Date(qrData.expiresAt).getTime() - Date.now()) / 1000) + 's',
    });

    // Sauvegarder le token
    await saveQrToken(qrData);
    console.log('💾 [QR Service] Token sauvegardé en cache');

    return qrData;
  },

  getStoredQrToken: async (): Promise<QrTokenData | null> => {
    console.log('📦 [QR Service] getStoredQrToken appelé');
    const cached = await loadQrToken();
    if (!cached) {
      console.log('📦 [QR Service] Aucun token en cache');
      return null;
    }

    const expiry = new Date(cached.expiresAt).getTime();
    const isExpired = expiry <= Date.now();
  

    if (isExpired) {
      console.log('🗑️ [QR Service] Token expiré, suppression du cache');
      await clearQrToken();
      return null;
    }

    console.log('✅ [QR Service] Token en cache valide retourné');
    return cached;
  },

  clearStoredQrToken: async (): Promise<void> => {
    console.log('🗑️ [QR Service] clearStoredQrToken appelé');
    await clearQrToken();
    console.log('✅ [QR Service] Token supprimé du cache');
  },

  /**
   * Récupère le QR Code actuel avec token et image base64 (Client)
   */
  getCurrentQrCode: async (): Promise<QrCodeResponse> => {
   

    const token = await AuthService.getAccessToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn('⚠️ [QR Service] Aucun token d\'authentification disponible');
    }

    try {
      const startTime = Date.now();
    const response = await apiCall<any>('/qr/current', {
      method: 'GET',
      headers,
    }, 0, QR_API_BASE_URL);
      const duration = Date.now() - startTime;

      

      if (response) {
        console.log('📄 [QR Service] Contenu de la réponse:', {
          token: response?.token ? response.token.substring(0, 30) + '...' : 'undefined',
          expiresAt: response?.expiresAt || 'undefined',
          imageBase64Length: response?.imageBase64 ? response.imageBase64.length + ' caractères' : 'undefined',
          qrCodeUrl: response?.qrCodeUrl || 'undefined',
        });
      }

    const qrData: QrCodeResponse = {
      token: response?.token,
      expiresAt: response?.expiresAt ?? new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      imageBase64: response?.imageBase64,
      qrCodeUrl: response?.qrCodeUrl,
    };

    if (qrData.token) {
        console.log('💾 [QR Service] Sauvegarde du token en cache');
      await saveQrToken({
        token: qrData.token,
        expiresAt: qrData.expiresAt,
      });
        console.log('✅ [QR Service] Token sauvegardé');
      } else {
        console.warn('⚠️ [QR Service] Aucun token dans la réponse, pas de sauvegarde');
      }

      console.log('✅ [QR Service] QR Code actuel récupéré avec succès', {
        hasToken: !!qrData.token,
        hasImage: !!qrData.imageBase64,
        hasUrl: !!qrData.qrCodeUrl,
      });

    return qrData;
    } catch (error) {
      console.error('❌ [QR Service] Erreur lors de la récupération du QR Code actuel:', error);
      if (error instanceof Error) {
        console.error('❌ [QR Service] Détails de l\'erreur:', {
          message: error.message,
          name: error.name,
        });
      }
      throw error;
    }
  },

  /**
   * Valide un QR Code scanné (côté partenaire)
   * @param qrToken - Le token QR à valider (peut être extrait d'un texte partagé)
   * @param partnerId - ID du partenaire (requis selon l'API)
   * @param storeId - ID du magasin (requis selon l'API)
   * @param operatorUserId - ID de l'opérateur (requis selon l'API)
   * @param amountGross - Montant brut de la transaction (défaut: 0)
   * @param personsCount - Nombre de personnes (défaut: 0)
   */
  validateQrToken: async (
    qrToken: string,
    partnerId?: string,
    storeId?: string,
    operatorUserId?: string,
    amountGross: number = 0,
    personsCount: number = 0,
    discountPercent: number = 10
  ): Promise<any> => {
    console.log('✅ [QR Service] validateQrToken appelé');
    
    // Validation des paramètres requis
    if (!qrToken || qrToken.trim() === '') {
      console.error('❌ [QR Service] Token QR manquant ou vide');
      throw new Error('Token QR requis');
    }

    // Nettoyer le token si il contient du texte supplémentaire (ex: "Mon QR Code Maya\n\nToken: xxx")
    let cleanToken = qrToken.trim();
    if (qrToken.includes('Token:')) {
      const tokenMatch = qrToken.match(/Token:\s*([^\s\n]+)/);
      if (tokenMatch && tokenMatch[1]) {
        cleanToken = tokenMatch[1].trim();
      }
    }

    // Si le token contient un préfixe (ex: "maya:token:xxx"), extraire seulement le token
    if (cleanToken.includes(':') && !cleanToken.includes('Token:')) {
      const parts = cleanToken.split(':');
      if (parts.length > 1) {
        cleanToken = parts[parts.length - 1].trim();
      }
    }

    console.log('🔍 [QR Service] Validation du token QR', {
      originalToken: qrToken.substring(0, 30) + '...',
      cleanToken: cleanToken.substring(0, 30) + '...',
      tokenLength: cleanToken.length,
      hasPartnerId: !!partnerId,
      hasStoreId: !!storeId,
      hasOperatorUserId: !!operatorUserId,
      amountGross,
      personsCount,
      discountPercent,
    });

    // Récupérer le token d'authentification
    const token = await AuthService.getAccessToken();
    if (!token) {
      console.error('❌ [QR Service] Aucun token d\'authentification disponible');
      throw new Error('Authentification requise. Veuillez vous reconnecter.');
    }
    console.log('🔑 [QR Service] Token d\'authentification:', token.substring(0, 20) + '...');

    // Essayer de récupérer les IDs manquants depuis l'utilisateur connecté
    let finalPartnerId = partnerId;
    let finalOperatorUserId = operatorUserId;
    
    if (!finalPartnerId || !finalOperatorUserId) {
      try {
        console.log('🔄 [QR Service] Récupération des IDs manquants depuis l\'utilisateur...');
        const userInfo = await AuthService.getCurrentUserInfo();
        if (!finalPartnerId) {
          finalPartnerId = (userInfo as any)?.partnerId || userInfo.id;
          console.log('✅ [QR Service] partnerId récupéré:', finalPartnerId ? finalPartnerId.substring(0, 20) + '...' : 'undefined');
        }
        if (!finalOperatorUserId) {
          finalOperatorUserId = userInfo.id;
          console.log('✅ [QR Service] operatorUserId récupéré:', finalOperatorUserId ? finalOperatorUserId.substring(0, 20) + '...' : 'undefined');
        }
      } catch (error) {
        console.warn('⚠️ [QR Service] Impossible de récupérer les IDs depuis l\'utilisateur:', error);
      }
    }

    // Validation finale des paramètres requis
    if (!finalPartnerId) {
      console.error('❌ [QR Service] partnerId manquant');
      throw new Error('ID du partenaire requis');
    }
    if (!storeId) {
      console.error('❌ [QR Service] storeId manquant');
      throw new Error('ID du magasin requis');
    }
    if (!finalOperatorUserId) {
      console.error('❌ [QR Service] operatorUserId manquant');
      throw new Error('ID de l\'opérateur requis');
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };

    // Préparer le body selon les spécifications de l'API
    // Tous les champs sont requis selon la documentation
    const requestBody = {
      partnerId: finalPartnerId,
      storeId: storeId,
      operatorUserId: finalOperatorUserId,
      qrToken: cleanToken,
      amountGross: amountGross ?? 0,
      personsCount: personsCount ?? 0,
      discountPercent: discountPercent ?? 10, // Réduction spécifique du magasin
    };

    

    

    try {
      const startTime = Date.now();
      const response = await apiCall<any>(
        '/qr/validate',
        {
          method: 'POST',
          headers,
          body: JSON.stringify(requestBody),
        },
        0,
        QR_API_BASE_URL,
      );
      const duration = Date.now() - startTime;


      return response;
    } catch (error) {
      console.error('❌ [QR Service] Erreur lors de la validation du token QR:', error);
      if (error instanceof Error) {
        console.error('❌ [QR Service] Détails de l\'erreur:', {
          message: error.message,
          name: error.name,
          stack: error.stack?.substring(0, 300),
        });
        
        // Améliorer les messages d'erreur selon le type
        if (error.message.includes('HTTP 400')) {
          throw new Error('Requête invalide. Vérifiez que tous les paramètres sont corrects.');
        } else if (error.message.includes('HTTP 401')) {
          throw new Error('Authentification requise. Veuillez vous reconnecter.');
        } else if (error.message.includes('HTTP 403')) {
          throw new Error('Accès refusé. Vous n\'avez pas les permissions nécessaires.');
        } else if (error.message.includes('HTTP 404')) {
          throw new Error('QR Code non trouvé ou expiré.');
        } else if (error.message.includes('HTTP 500')) {
          throw new Error('Erreur serveur. Veuillez réessayer plus tard.');
        }
      }
      throw error;
    }
  },
};

