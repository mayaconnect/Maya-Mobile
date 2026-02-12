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

// Pour React Native, utiliser l'adresse IP au lieu de localhost
// IMPORTANT: Dans React Native, localhost ne fonctionne pas !
// Options selon votre environnement :
// - Appareil physique sur WiFi : http://VOTRE_IP_LOCALE:61802/api/v1
// - Android Emulator : http://10.0.2.2:61802/api/v1
// - iOS Simulator : http://localhost:61802/api/v1 (fonctionne uniquement sur iOS)
// 
// Pour trouver votre IP locale : ipconfig (Windows) ou ifconfig (Mac/Linux)
const ENV_API_BASE = normalizeBaseUrl(process.env.EXPO_PUBLIC_API_BASE_URL);

export const API_BASE_URL = ENV_API_BASE || 'https://7cce-92-169-41-164.ngrok-free.app /api/v1'; // ⚠️ Remplacez par votre IP locale

export const USER_STORAGE_KEY = '@maya_current_user';

