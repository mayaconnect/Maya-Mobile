/**
 * Configuration centralisée pour l'API
 */

export const API_CONFIG = {
  // URL de base de l'API
  BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.example.com',

  // Timeouts
  TIMEOUT: {
    DEFAULT: 30000, // 30 secondes
    UPLOAD: 60000, // 60 secondes pour les uploads
    DOWNLOAD: 120000, // 120 secondes pour les téléchargements
  },

  // Retry configuration
  RETRY: {
    MAX_ATTEMPTS: 3,
    DELAY: 1000, // 1 seconde entre les tentatives
    BACKOFF_MULTIPLIER: 2, // Multiplie le délai à chaque tentative
  },

  // Endpoints
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/auth/login',
      REGISTER: '/auth/register',
      REFRESH: '/auth/refresh',
      LOGOUT: '/auth/logout',
      FORGOT_PASSWORD: '/auth/forgot-password',
      RESET_PASSWORD: '/auth/reset-password',
    },
    USERS: {
      BASE: '/users',
      PROFILE: '/users/profile',
      UPDATE: '/users/profile',
    },
    PARTNERS: {
      BASE: '/partners',
      SEARCH: '/partners/search',
      BY_ID: (id: string) => `/partners/${id}`,
    },
    STORES: {
      BASE: '/stores',
      SEARCH: '/stores/search',
      BY_ID: (id: string) => `/stores/${id}`,
      MY_STORES: '/stores/me',
    },
    TRANSACTIONS: {
      BASE: '/transactions',
      BY_ID: (id: string) => `/transactions/${id}`,
      HISTORY: '/transactions/history',
    },
    QR: {
      GENERATE: '/qr/generate',
      VALIDATE: '/qr/validate',
    },
    SUBSCRIPTIONS: {
      BASE: '/subscriptions',
      MY_SUBSCRIPTION: '/subscriptions/me',
    },
    PAYMENTS: {
      BASE: '/payments',
      PROCESS: '/payments/process',
    },
  },

  // Headers par défaut
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },

  // Configuration de logging
  LOGGING: {
    ENABLED: __DEV__,
    LOG_REQUESTS: __DEV__,
    LOG_RESPONSES: __DEV__,
    LOG_ERRORS: true,
  },
} as const;

/**
 * Obtient l'URL complète pour un endpoint
 */
export function getApiUrl(endpoint: string, baseUrlOverride?: string): string {
  const baseUrl = baseUrlOverride || API_CONFIG.BASE_URL;
  // S'assurer que l'endpoint commence par /
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  // S'assurer que la base URL ne se termine pas par /
  const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  return `${normalizedBaseUrl}${normalizedEndpoint}`;
}

/**
 * Obtient le timeout approprié selon le type de requête
 */
export function getTimeout(type: 'default' | 'upload' | 'download' = 'default'): number {
  return API_CONFIG.TIMEOUT[type.toUpperCase() as keyof typeof API_CONFIG.TIMEOUT] || API_CONFIG.TIMEOUT.DEFAULT;
}

