/**
 * Gestion de la réinitialisation de mot de passe
 */

import { ApiClient } from '../shared/api-client';
import { log } from '@/utils/logger';

/**
 * Étape 1 - Vérifier l'existence de l'email et déclencher la procédure de reset
 * POST /api/v1/auth/request-password-reset
 * Body: { "email": "string" }
 */
export async function requestPasswordReset(email: string): Promise<void> {
  log.info('Demande de réinitialisation de mot de passe', { email });

  try {
    await ApiClient.post('/auth/request-password-reset', {
      email,
    }, {
      skipAuth: true, // Pas besoin d'authentification pour cette route
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
 * POST /api/v1/auth/request-password-reset-code
 * Body: { "email": "string", "phoneNumber": "string", "channel": "string" }
 */
export async function requestPasswordResetCode(
  email: string,
  phoneNumber?: string,
  channel: 'email' | 'sms' = 'email'
): Promise<void> {
  log.info('Demande de code de réinitialisation', { email, channel, phoneNumber });

  try {
    const payload: Record<string, string> = {
      email,
      channel,
    };

    if (phoneNumber) {
      payload.phoneNumber = phoneNumber;
    }

    await ApiClient.post('/auth/request-password-reset-code', payload, {
      skipAuth: true, // Pas besoin d'authentification pour cette route
    });

    log.info(`Code de reset envoyé via ${channel}`);
  } catch (error) {
    log.error('Erreur lors de l\'envoi du code', error as Error);
    
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();
      
      if (errorMessage.includes('http 400') || errorMessage.includes('bad request')) {
        throw new Error('Données invalides. Vérifiez votre email et numéro de téléphone.');
      }
      
      if (errorMessage.includes('http 404') || errorMessage.includes('not found')) {
        throw new Error('Email ou numéro de téléphone introuvable.');
      }
      
      if (errorMessage.includes('timeout') || errorMessage.includes('TIMEOUT_ERROR')) {
        throw new Error('Le serveur met trop de temps à répondre. Veuillez réessayer.');
      }
    }
    
    throw new Error('Impossible d\'envoyer le code de vérification');
  }
}

/**
 * Étape 3 - Vérifier le code de réinitialisation
 * POST /api/v1/auth/verify-password-reset-code
 * Body: { "email": "string", "code": "string" }
 * Returns: Token de réinitialisation (si disponible)
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
    }, {
      skipAuth: true, // Pas besoin d'authentification pour cette route
    });

    log.info('Code de reset vérifié', { hasToken: !!response?.token, hasResetToken: !!response?.resetToken });

    // Le token peut être dans response.token ou response.resetToken selon l'API
    return response?.token || response?.resetToken;
  } catch (error) {
    log.error('Code invalide', error as Error);
    
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();
      
      if (errorMessage.includes('http 400') || errorMessage.includes('bad request')) {
        throw new Error('Code de vérification invalide ou expiré');
      }
      
      if (errorMessage.includes('http 404') || errorMessage.includes('not found')) {
        throw new Error('Code de vérification introuvable');
      }
      
      if (errorMessage.includes('expired') || errorMessage.includes('expiré')) {
        throw new Error('Code de vérification expiré. Veuillez en demander un nouveau.');
      }
    }
    
    throw new Error('Code de vérification invalide');
  }
}

/**
 * Réinitialiser le mot de passe avec le token
 * POST /api/v1/auth/reset-password
 * Body: { "token": "string", "newPassword": "string" }
 */
export async function resetPassword(token: string, newPassword: string): Promise<void> {
  log.info('Réinitialisation du mot de passe');

  try {
    await ApiClient.post('/auth/reset-password', {
      token,
      newPassword,
    }, {
      skipAuth: true, // Pas besoin d'authentification pour cette route
    });

    log.info('Mot de passe réinitialisé avec succès');
  } catch (error) {
    log.error('Erreur lors de la réinitialisation', error as Error);
    
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();
      
      if (errorMessage.includes('http 400') || errorMessage.includes('bad request')) {
        throw new Error('Token invalide ou expiré. Veuillez recommencer la procédure.');
      }
      
      if (errorMessage.includes('http 404') || errorMessage.includes('not found')) {
        throw new Error('Token introuvable. Veuillez recommencer la procédure.');
      }
      
      if (errorMessage.includes('expired') || errorMessage.includes('expiré')) {
        throw new Error('Token expiré. Veuillez recommencer la procédure.');
      }
      
      if (errorMessage.includes('password') && (errorMessage.includes('weak') || errorMessage.includes('faible'))) {
        throw new Error('Le mot de passe est trop faible. Veuillez en choisir un plus fort.');
      }
    }
    
    throw new Error('Impossible de réinitialiser le mot de passe');
  }
}

