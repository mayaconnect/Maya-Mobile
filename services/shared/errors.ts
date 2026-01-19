/**
 * Système de gestion d'erreurs centralisé
 * Fournit des classes d'erreurs personnalisées pour une meilleure gestion des erreurs API
 */

export enum ErrorCode {
  // Erreurs réseau
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  CONNECTION_REFUSED = 'CONNECTION_REFUSED',

  // Erreurs d'authentification
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',

  // Erreurs de validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',

  // Erreurs serveur
  SERVER_ERROR = 'SERVER_ERROR',
  BAD_GATEWAY = 'BAD_GATEWAY',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',

  // Erreurs client
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  BAD_REQUEST = 'BAD_REQUEST',

  // Erreurs inconnues
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export interface ApiErrorDetails {
  code?: string;
  field?: string;
  message: string;
  statusCode?: number;
  timestamp?: string;
  path?: string;
}

/**
 * Classe de base pour les erreurs API
 */
export class ApiError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode?: number;
  public readonly details?: ApiErrorDetails;
  public readonly timestamp: string;
  public readonly isRetryable: boolean;

  constructor(
    message: string,
    code: ErrorCode = ErrorCode.UNKNOWN_ERROR,
    statusCode?: number,
    details?: ApiErrorDetails,
    isRetryable: boolean = false
  ) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date().toISOString();
    this.isRetryable = isRetryable;

    // Maintient la stack trace pour le débogage
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }

  /**
   * Convertit l'erreur en objet JSON pour le logging
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      details: this.details,
      timestamp: this.timestamp,
      isRetryable: this.isRetryable,
      stack: this.stack,
    };
  }

  /**
   * Retourne un message utilisateur-friendly
   */
  getUserMessage(): string {
    switch (this.code) {
      case ErrorCode.NETWORK_ERROR:
      case ErrorCode.CONNECTION_REFUSED:
        return 'Problème de connexion. Vérifiez votre connexion internet.';
      case ErrorCode.TIMEOUT_ERROR:
        return 'La requête a pris trop de temps. Veuillez réessayer.';
      case ErrorCode.UNAUTHORIZED:
      case ErrorCode.INVALID_CREDENTIALS:
        return 'Identifiants incorrects. Veuillez vérifier vos informations.';
      case ErrorCode.TOKEN_EXPIRED:
        return 'Votre session a expiré. Veuillez vous reconnecter.';
      case ErrorCode.FORBIDDEN:
        return 'Vous n\'avez pas les permissions nécessaires.';
      case ErrorCode.NOT_FOUND:
        return 'Ressource non trouvée.';
      case ErrorCode.VALIDATION_ERROR:
      case ErrorCode.INVALID_INPUT:
        return this.details?.message || 'Données invalides.';
      case ErrorCode.SERVER_ERROR:
      case ErrorCode.BAD_GATEWAY:
      case ErrorCode.SERVICE_UNAVAILABLE:
        return 'Le serveur rencontre des difficultés. Veuillez réessayer plus tard.';
      case ErrorCode.CONFLICT:
        return 'Un conflit est survenu. La ressource existe déjà.';
      default:
        return this.message || 'Une erreur inattendue s\'est produite.';
    }
  }
}

/**
 * Crée une erreur API à partir d'une réponse HTTP
 */
export function createApiErrorFromResponse(
  status: number,
  statusText: string,
  errorText?: string,
  url?: string
): ApiError {
  let code: ErrorCode;
  let isRetryable = false;
  let message = statusText || 'Erreur HTTP';

  // Déterminer le code d'erreur et si c'est retryable
  switch (status) {
    case 400:
      code = ErrorCode.BAD_REQUEST;
      break;
    case 401:
      code = ErrorCode.UNAUTHORIZED;
      break;
    case 403:
      code = ErrorCode.FORBIDDEN;
      break;
    case 404:
      code = ErrorCode.NOT_FOUND;
      break;
    case 409:
      code = ErrorCode.CONFLICT;
      break;
    case 422:
      code = ErrorCode.VALIDATION_ERROR;
      break;
    case 500:
      code = ErrorCode.SERVER_ERROR;
      isRetryable = true;
      break;
    case 502:
      code = ErrorCode.BAD_GATEWAY;
      isRetryable = true;
      break;
    case 503:
      code = ErrorCode.SERVICE_UNAVAILABLE;
      isRetryable = true;
      break;
    default:
      code = status >= 500 ? ErrorCode.SERVER_ERROR : ErrorCode.UNKNOWN_ERROR;
      isRetryable = status >= 500;
  }

  // Parser le message d'erreur si disponible
  let details: ApiErrorDetails | undefined;
  if (errorText) {
    try {
      const errorData = JSON.parse(errorText);
      message = errorData.message || errorData.error || message;
      details = {
        code: errorData.code,
        message: errorData.message || errorData.error || message,
        statusCode: status,
        path: url,
      };
    } catch {
      // Si ce n'est pas du JSON, utiliser le texte brut
      message = errorText;
      details = {
        message: errorText,
        statusCode: status,
        path: url,
      };
    }
  }

  return new ApiError(message, code, status, details, isRetryable);
}

/**
 * Crée une erreur API à partir d'une erreur réseau
 */
export function createApiErrorFromNetworkError(
  error: Error | unknown,
  url?: string
): ApiError {
  if (error instanceof Error) {
    // Détecter les types d'erreurs réseau courants
    if (error.name === 'AbortError' || error.message.includes('timeout')) {
      return new ApiError(
        'La requête a expiré',
        ErrorCode.TIMEOUT_ERROR,
        undefined,
        { message: error.message, path: url },
        true
      );
    }

    if (
      error.message.includes('Failed to fetch') ||
      error.message.includes('Network') ||
      error.message.includes('ECONNREFUSED')
    ) {
      return new ApiError(
        'Impossible de se connecter au serveur',
        ErrorCode.NETWORK_ERROR,
        undefined,
        { message: error.message, path: url },
        true
      );
    }
  }

  return new ApiError(
    error instanceof Error ? error.message : 'Erreur réseau inconnue',
    ErrorCode.NETWORK_ERROR,
    undefined,
    { path: url },
    true
  );
}

/**
 * Vérifie si une erreur est une erreur API
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/**
 * Vérifie si une erreur peut être retentée
 */
export function isRetryableError(error: unknown): boolean {
  return isApiError(error) && error.isRetryable;
}

