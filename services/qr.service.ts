import AsyncStorage from '@react-native-async-storage/async-storage';

import { API_BASE_URL, AuthService } from './auth.service';
import { apiCall } from './shared/api';

const QR_TOKEN_STORAGE_KEY = '@maya_partner_qr_token';

export type QrTokenData = {
  token: string;
  expiresAt: string;
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
  issueQrToken: async (forceRefresh: boolean = false): Promise<QrTokenData> => {
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
      const token = await AuthService.getAccessToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      response = await apiCall<any>(
        '/qr/issue-token-frontend',
        {
          method: 'POST',
          headers,
        },
        0,
        QR_API_BASE_URL,
      );
    } catch (error) {
      if (error instanceof Error && error.message.includes('HTTP 403')) {
        console.warn('⚠️ Accès refusé pour la génération distante, utilisation d\'un QR local');
        const fallback: QrTokenData = {
          token: `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        };
        await saveQrToken(fallback);
        return fallback;
      }
      throw error;
    }

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
        expiresAt:
          response?.expiresAt ?? new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      };
    }

    if (!qrData?.token) {
      throw new Error('Réponse invalide du serveur pour le QR token');
    }

    await saveQrToken(qrData);
    return qrData;
  },

  getStoredQrToken: async (): Promise<QrTokenData | null> => {
    const cached = await loadQrToken();
    if (!cached) {
      return null;
    }

    if (new Date(cached.expiresAt).getTime() <= Date.now()) {
      await clearQrToken();
      return null;
    }

    return cached;
  },

  clearStoredQrToken: async (): Promise<void> => {
    await clearQrToken();
  },
};

