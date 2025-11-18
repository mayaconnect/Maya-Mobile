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
        console.log('📦 [QR Service] Token en cache trouvé', {
          token: existing.token.substring(0, 20) + '...',
          expiresAt: existing.expiresAt,
          timeUntilExpiry: Math.round(timeUntilExpiry / 1000) + 's',
        });

        if (expiry > Date.now() + 60 * 1000) {
          console.log('✅ [QR Service] Utilisation du token en cache (valide)');
          return existing;
        } else {
          console.log('⏰ [QR Service] Token en cache expiré, génération d\'un nouveau');
        }
      } else {
        console.log('📦 [QR Service] Aucun token en cache');
      }
    } else {
      console.log('🔄 [QR Service] Refresh forcé demandé');
    }

    // Générer un nouveau token via l'API
    console.log('🌐 [QR Service] Appel API: POST /api/qr/issue-token-frontend');
    console.log('🌐 [QR Service] Base URL:', QR_API_BASE_URL);

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
    console.log('📦 [QR Service] Token en cache trouvé', {
      token: cached.token.substring(0, 20) + '...',
      expiresAt: cached.expiresAt,
      isExpired,
      timeUntilExpiry: isExpired ? 'expiré' : Math.round((expiry - Date.now()) / 1000) + 's',
    });

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
    console.log('🔍 [QR Service] getCurrentQrCode appelé');
    console.log('🌐 [QR Service] Appel API: GET /api/qr/current');
    console.log('🌐 [QR Service] Base URL:', QR_API_BASE_URL);

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

    try {
      const startTime = Date.now();
      const response = await apiCall<any>('/qr/current', {
        method: 'GET',
        headers,
      }, 0, QR_API_BASE_URL);
      const duration = Date.now() - startTime;

      console.log('✅ [QR Service] Réponse API reçue', {
        duration: duration + 'ms',
        hasToken: !!response?.token,
        hasExpiresAt: !!response?.expiresAt,
        hasImageBase64: !!response?.imageBase64,
        hasQrCodeUrl: !!response?.qrCodeUrl,
      });

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
   * @param partnerId - ID du partenaire (optionnel, peut être récupéré depuis le token utilisateur)
   * @param storeId - ID du magasin (optionnel)
   * @param operatorUserId - ID de l'opérateur (optionnel, peut être récupéré depuis le token utilisateur)
   * @param amountGross - Montant brut de la transaction (optionnel)
   * @param personsCount - Nombre de personnes (optionnel)
   */
  validateQrToken: async (
    qrToken: string,
    partnerId?: string,
    storeId?: string,
    operatorUserId?: string,
    amountGross?: number,
    personsCount?: number
  ): Promise<any> => {
    console.log('✅ [QR Service] validateQrToken appelé');
    
    if (!qrToken) {
      console.error('❌ [QR Service] Token QR manquant');
      throw new Error('Token QR requis');
    }

    // Nettoyer le token si il contient du texte supplémentaire (ex: "Mon QR Code Maya\n\nToken: xxx")
    let cleanToken = qrToken;
    if (qrToken.includes('Token:')) {
      const tokenMatch = qrToken.match(/Token:\s*([^\s\n]+)/);
      if (tokenMatch && tokenMatch[1]) {
        cleanToken = tokenMatch[1];
        console.log('🧹 [QR Service] Token nettoyé depuis le texte partagé');
      }
    }

    console.log('🔍 [QR Service] Validation du token QR', {
      originalToken: qrToken.substring(0, 30) + '...',
      cleanToken: cleanToken.substring(0, 30) + '...',
      tokenLength: cleanToken.length,
      hasPartnerId: !!partnerId,
      hasStoreId: !!storeId,
    });

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

    // Préparer le body selon l'API
    const requestBody: any = {
      qrToken: cleanToken,
    };

    // Ajouter les paramètres optionnels s'ils sont fournis
    if (partnerId) {
      requestBody.partnerId = partnerId;
    }
    if (storeId) {
      requestBody.storeId = storeId;
    }
    if (operatorUserId) {
      requestBody.operatorUserId = operatorUserId;
    }
    if (amountGross !== undefined) {
      requestBody.amountGross = amountGross;
    }
    if (personsCount !== undefined) {
      requestBody.personsCount = personsCount;
    }

    console.log('📤 [QR Service] Body de la requête:', {
      hasQrToken: !!requestBody.qrToken,
      hasPartnerId: !!requestBody.partnerId,
      hasStoreId: !!requestBody.storeId,
      hasOperatorUserId: !!requestBody.operatorUserId,
      amountGross: requestBody.amountGross,
      personsCount: requestBody.personsCount,
    });

    console.log('🌐 [QR Service] Appel API: POST /api/qr/validate');
    console.log('🌐 [QR Service] Base URL:', QR_API_BASE_URL);

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

      console.log('✅ [QR Service] Validation réussie', {
        duration: duration + 'ms',
        response: JSON.stringify(response, null, 2),
      });

      return response;
    } catch (error) {
      console.error('❌ [QR Service] Erreur lors de la validation du token QR:', error);
      if (error instanceof Error) {
        console.error('❌ [QR Service] Détails de l\'erreur:', {
          message: error.message,
          name: error.name,
        });
      }
      throw error;
    }
  },
};

