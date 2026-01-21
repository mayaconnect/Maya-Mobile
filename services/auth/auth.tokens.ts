/**
 * Gestion des tokens d'authentification
 */

import { log } from '@/utils/logger';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TokenData } from './auth.types';

const TOKEN_STORAGE_KEY = '@maya_tokens';

/**
 * Sauvegarde les tokens dans AsyncStorage
 */
export async function saveTokens(tokens: TokenData): Promise<void> {
  try {
    await AsyncStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokens));
    log.info('Tokens sauvegardés localement');
  } catch (error) {
    log.error('Erreur lors de la sauvegarde des tokens', error as Error);
  }
}

/**
 * Récupère les tokens depuis AsyncStorage
 */
export async function getTokens(): Promise<TokenData | null> {
  try {
    const tokensJson = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
    return tokensJson ? JSON.parse(tokensJson) : null;
  } catch (error) {
    log.error('Erreur lors de la récupération des tokens', error as Error);
    return null;
  }
}

/**
 * Supprime les tokens du stockage
 */
export async function clearTokens(): Promise<void> {
  try {
    await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
    log.info('Tokens supprimés');
  } catch (error) {
    log.error('Erreur lors de la suppression des tokens', error as Error);
  }
}

/**
 * Vérifie si un token est valide (non expiré)
 */
export function isTokenValid(tokenData: TokenData | null): boolean {
  if (!tokenData || !tokenData.expiresAt) {
    return false;
  }

  const expiresAt = new Date(tokenData.expiresAt).getTime();
  const now = Date.now();
  
  // Considérer le token valide s'il expire dans plus de 5 minutes
  return expiresAt > now + 5 * 60 * 1000;
}

