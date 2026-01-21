/**
 * Gestion de la réinitialisation de mot de passe
 */

import { ApiClient } from '../shared/api-client';
import { log } from '@/utils/logger';

/**
 * Étape 1 - Vérifier l'existence de l'email et déclencher la procédure de reset
 */
export async function requestPasswordReset(email: string): Promise<void> {
  log.info('Demande de réinitialisation de mot de passe', { email });

  try {
    await ApiClient.post('/auth/request-password-reset', {
      email,
    });

    log.info('Email vérifié, procédure de reset démarrée');
  } catch (error) {
    log.error('Erreur lors de la vérification de l\'email', error as Error);

    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();

      if (errorMessage.includes('http 500') || errorMessage.includes('server error')) {
        throw new Error('Erreur serveur. Veuillez réessayer plus tard.');
      }

      if (errorMessage.includes('http 404') || errorMessage.includes('http 400') ||
          errorMessage.includes('not found') || errorMessage.includes('bad request')) {
        throw new Error('Adresse email inconnue');
      }

      if (errorMessage.includes('timeout') || errorMessage.includes('TIMEOUT_ERROR')) {
        throw new Error('Le serveur met trop de temps à répondre. Veuillez réessayer.');
      }

      if (errorMessage.includes('email') && (errorMessage.includes('inconnu') ||
          errorMessage.includes('unknown') || errorMessage.includes('not found'))) {
        throw new Error('Adresse email inconnue');
      }

      throw error;
    }

    throw new Error('Erreur lors de la vérification de l\'email');
  }
}

/**
 * Étape 2 - Envoyer un code de réinitialisation
 */
export async function requestPasswordResetCode(
  email: string,
  phoneNumber?: string,
  channel: 'email' | 'sms' = 'email'
): Promise<void> {
  log.info('Demande de code de réinitialisation', { email, channel });

  try {
    const payload: Record<string, string> = {
      email,
      channel,
    };

    if (phoneNumber) {
      payload.phoneNumber = phoneNumber;
    }

    await ApiClient.post('/auth/request-password-reset-code', payload);

    log.info(`Code de reset envoyé via ${channel}`);
  } catch (error) {
    log.error('Erreur lors de l\'envoi du code', error as Error);
    throw new Error('Impossible d\'envoyer le code de vérification');
  }
}

/**
 * Étape 3 - Vérifier le code de réinitialisation
 */
export async function verifyPasswordResetCode(
  email: string,
  code: string
): Promise<string | undefined> {
  log.info('Vérification du code de réinitialisation', { email });

  try {
    const response = await ApiClient.post<any>('/auth/verify-password-reset-code', {
      email,
      code,
    });

    log.info('Code de reset vérifié', { hasToken: !!response?.token });

    return response?.token;
  } catch (error) {
    log.error('Code invalide', error as Error);
    throw new Error('Code de vérification invalide');
  }
}

/**
 * Réinitialiser le mot de passe
 */
export async function resetPassword(token: string, newPassword: string): Promise<void> {
  log.info('Réinitialisation du mot de passe');

  try {
    await ApiClient.post('/auth/reset-password', {
      token,
      newPassword,
    });

    log.info('Mot de passe réinitialisé avec succès');
  } catch (error) {
    log.error('Erreur lors de la réinitialisation', error as Error);
    throw new Error('Impossible de réinitialiser le mot de passe');
  }
}

