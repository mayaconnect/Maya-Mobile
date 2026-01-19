/**
 * Configuration de l'authentification
 */

const normalizeBaseUrl = (raw?: string | null) => {
  if (!raw) {
    return undefined;
  }
  const trimmed = raw.trim();
  if (!trimmed) {
    return undefined;
  }
  return trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
};

const ENV_API_BASE = normalizeBaseUrl(process.env.EXPO_PUBLIC_API_BASE_URL);

export const API_BASE_URL = ENV_API_BASE || 'https://fc554a95db2c.ngrok-free.app/api/v1';

export const USER_STORAGE_KEY = '@maya_current_user';

