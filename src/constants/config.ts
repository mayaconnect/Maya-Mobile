/**
 * Maya Connect V2 — App Configuration
 */

export const config = {
  api: {
    baseUrl: process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.mayaconnect.fr',
    timeout: 30_000,
    retryAttempts: 3,
    retryDelay: 1_000,
  },
  google: {
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '',
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '',
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '',
  },
  stripe: {
    publishableKey: process.env.EXPO_PUBLIC_STRIPE_PK || '',
  },
  deepLink: {
    scheme: 'maya',
    subscriptionSuccess: 'maya://subscription/success',
    subscriptionCancel: 'maya://subscription/cancel',
  },
  pagination: {
    defaultPageSize: 20,
    partnerPageSize: 20,
    transactionPageSize: 15,
  },
} as const;

/** Single source of truth for all storage keys */
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'maya_access_token',
  REFRESH_TOKEN: 'maya_refresh_token',
  USER: 'maya_user',
  HAS_ONBOARDED: 'maya_onboarding_seen',
} as const;

/** QR Code config */
export const QR_CONFIG = {
  refreshInterval: 4 * 60 * 1000, // 4 minutes
  tokenValidityMinutes: 5,
} as const;
