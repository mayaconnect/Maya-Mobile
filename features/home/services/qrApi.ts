import { API_BASE_URL, AuthService } from '@/services/auth.service';
import { ApiClient } from '@/services/shared/api-client';
import { log } from '@/utils/logger';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
    log.error('Erreur lors de la sauvegarde du QR token', error as Error);
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
    log.error('Erreur lors du chargement du QR token', error as Error);
    return null;
  }
};

const clearQrToken = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(QR_TOKEN_STORAGE_KEY);
  } catch (error) {
    log.error('Erreur lors de la suppression du QR token', error as Error);
  }
};

const QR_API_BASE_URL = API_BASE_URL.includes('/api/v1')
  ? API_BASE_URL.replace('/api/v1', '/api')
  : API_BASE_URL;

export const QrApi = {
  /**
   * Génère un nouveau token QR via l'API
   * @param forceRefresh - Force la génération d'un nouveau token même si un token valide existe
   */
  issueQrToken: async (forceRefresh: boolean = false): Promise<QrTokenData> => {
    log.info('Génération du token QR', { forceRefresh });

    // Vérifier le cache si pas de refresh forcé
    if (!forceRefresh) {
      const existing = await loadQrToken();
      if (existing) {
        const expiry = new Date(existing.expiresAt).getTime();
        if (expiry > Date.now() + 60 * 1000) {
          return existing;
        }
      }
    }

    let response: any;
    try {
      response = await ApiClient.post<QrTokenData>(
        '/qr/issue-token-frontend',
        {},
        {
          baseUrlOverride: QR_API_BASE_URL,
        }
      );

      if (response) {
        log.info('Token QR généré avec succès', {
          hasToken: !!response?.token,
          hasExpiresAt: !!response?.expiresAt,
        });
      }
    } catch (error) {
      log.error('Erreur lors de l\'appel API pour le token QR', error as Error);

      if (error instanceof Error && error.message.includes('HTTP 403')) {
        log.warn('Accès refusé (403), utilisation d\'un QR local de fallback');
        const fallback: QrTokenData = {
          token: `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        };
        await saveQrToken(fallback);
        return fallback;
      }
      throw error;
    }

    // Parser la réponse
    let qrData: QrTokenData;
    if (typeof response === 'string') {
      try {
        qrData = JSON.parse(response);
      } catch {
        qrData = {
          token: response,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        };
      }
    } else {
      qrData = {
        token: response?.token,
        expiresAt: response?.expiresAt ?? new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      };
    }

    // Valider les données
    if (!qrData?.token) {
      throw new Error('Réponse invalide du serveur pour le QR token');
    }

    // Sauvegarder le token
    await saveQrToken(qrData);

    return qrData;
  },

  getStoredQrToken: async (): Promise<QrTokenData | null> => {
    const cached = await loadQrToken();
    if (!cached) {
      return null;
    }

    const expiry = new Date(cached.expiresAt).getTime();
    const isExpired = expiry <= Date.now();

    if (isExpired) {
      await clearQrToken();
      return null;
    }

    return cached;
  },

  clearStoredQrToken: async (): Promise<void> => {
    await clearQrToken();
  },

  /**
   * Récupère le QR Code actuel avec token et image base64 (Client)
   */
  getCurrentQrCode: async (): Promise<QrCodeResponse> => {
    try {
      const response = await ApiClient.get<QrCodeResponse>('/qr/current', {
        baseUrlOverride: QR_API_BASE_URL,
      });

      const qrData: QrCodeResponse = {
        token: response?.token,
        expiresAt: response?.expiresAt ?? new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        imageBase64: response?.imageBase64,
        qrCodeUrl: response?.qrCodeUrl,
      };

      if (qrData.token) {
        await saveQrToken({
          token: qrData.token,
          expiresAt: qrData.expiresAt,
        });
      }

      return qrData;
    } catch (error) {
      log.error('Erreur lors de la récupération du QR Code actuel', error as Error);
      throw error;
    }
  },

  /**
   * Valide un QR Code scanné (côté partenaire)
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
    if (!qrToken || qrToken.trim() === '') {
      throw new Error('Token QR requis');
    }

    // Nettoyer le token si il contient du texte supplémentaire
    let cleanToken = qrToken.trim();
    if (qrToken.includes('Token:')) {
      const tokenMatch = qrToken.match(/Token:\s*([^\s\n]+)/);
      if (tokenMatch && tokenMatch[1]) {
        cleanToken = tokenMatch[1].trim();
      }
    }

    // Si le token contient un préfixe, extraire seulement le token
    if (cleanToken.includes(':') && !cleanToken.includes('Token:')) {
      const parts = cleanToken.split(':');
      if (parts.length > 1) {
        cleanToken = parts[parts.length - 1].trim();
      }
    }

    // Essayer de récupérer les IDs manquants depuis l'utilisateur connecté
    let finalPartnerId = partnerId;
    let finalOperatorUserId = operatorUserId;

    if (!finalPartnerId || !finalOperatorUserId) {
      try {
        const userInfo = await AuthService.getCurrentUserInfo();
        if (!finalPartnerId) {
          finalPartnerId = (userInfo as any)?.partnerId || userInfo.id;
        }
        if (!finalOperatorUserId) {
          finalOperatorUserId = userInfo.id;
        }
      } catch (error) {
        log.warn('Impossible de récupérer les IDs depuis l\'utilisateur', { error: error instanceof Error ? error.message : String(error) });
      }
    }

    // Validation finale des paramètres requis
    if (!finalPartnerId) {
      throw new Error('ID du partenaire requis');
    }
    if (!storeId) {
      throw new Error('ID du magasin requis');
    }
    if (!finalOperatorUserId) {
      throw new Error('ID de l\'opérateur requis');
    }

    const requestBody = {
      partnerId: finalPartnerId,
      storeId: storeId,
      operatorUserId: finalOperatorUserId,
      qrToken: cleanToken,
      amountGross: amountGross ?? 0,
      personsCount: personsCount ?? 0,
      discountPercent: discountPercent ?? 10,
    };

    try {
      return await ApiClient.post<any>('/qr/validate', requestBody, {
        baseUrlOverride: QR_API_BASE_URL,
      });
    } catch (error) {
      log.error('Erreur lors de la validation du token QR', error as Error);

      if (error instanceof Error) {
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

