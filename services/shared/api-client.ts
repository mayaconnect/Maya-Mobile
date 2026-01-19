/**
 * Client API amélioré avec retry, timeout et gestion d'erreurs
 */

import { API_CONFIG, getApiUrl, getTimeout } from '@/config/api.config';
import { ApiError, createApiErrorFromNetworkError, createApiErrorFromResponse, isRetryableError } from './errors';
import { log } from '@/utils/logger';
import { retry } from '@/utils/helpers';
import { AuthService } from '../auth.service';

export interface ApiClientOptions extends RequestInit {
  timeout?: number;
  retry?: {
    maxAttempts?: number;
    delay?: number;
    backoffMultiplier?: number;
  };
  skipAuth?: boolean;
  baseUrlOverride?: string;
}

/**
 * Client API avec gestion avancée des erreurs, retry et timeout
 */
export class ApiClient {
  /**
   * Effectue une requête API avec gestion d'erreurs, retry et timeout
   */
  static async request<T>(
    endpoint: string,
    options: ApiClientOptions = {}
  ): Promise<T> {
    const {
      timeout,
      retry: retryConfig,
      skipAuth = false,
      baseUrlOverride,
      ...fetchOptions
    } = options;

    const url = getApiUrl(endpoint, baseUrlOverride);
    const method = fetchOptions.method || 'GET';
    const requestTimeout = timeout || getTimeout('default');

    // Construire les headers
    const headers = await this.buildHeaders(fetchOptions.headers, skipAuth);

    // Options de requête finales
    const finalOptions: RequestInit = {
      ...fetchOptions,
      headers,
    };

    // Log de la requête
    if (API_CONFIG.LOGGING.LOG_REQUESTS) {
      log.api.request(method, url, finalOptions);
    }

    const startTime = Date.now();

    try {
      // Créer un AbortController pour le timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), requestTimeout);

      // Fonction de requête avec retry
      const makeRequest = async (): Promise<T> => {
        try {
          const response = await fetch(url, {
            ...finalOptions,
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          const duration = Date.now() - startTime;

          // Log de la réponse
          if (API_CONFIG.LOGGING.LOG_RESPONSES) {
            log.api.response(method, url, response.status, duration);
          }

          // Gérer les erreurs HTTP
          if (!response.ok) {
            const errorText = await response.text().catch(() => '');
            const apiError = createApiErrorFromResponse(
              response.status,
              response.statusText,
              errorText,
              url
            );

            // Log de l'erreur
            if (API_CONFIG.LOGGING.LOG_ERRORS) {
              log.api.error(method, url, response.status, apiError);
            }

            throw apiError;
          }

          // Gérer les réponses vides (204 No Content)
          if (response.status === 204) {
            return undefined as T;
          }

          // Parser la réponse
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const jsonData = await response.json();
            return jsonData as T;
          }

          // Réponse texte
          const textData = await response.text();
          return textData as T;
        } catch (error) {
          clearTimeout(timeoutId);

          // Si c'est une erreur d'abort (timeout), créer une erreur appropriée
          if (error instanceof Error && error.name === 'AbortError') {
            throw createApiErrorFromNetworkError(
              new Error('Request timeout'),
              url
            );
          }

          throw error;
        }
      };

      // Appliquer le retry si configuré
      if (retryConfig && retryConfig.maxAttempts && retryConfig.maxAttempts > 1) {
        return await retry(
          makeRequest,
          retryConfig.maxAttempts,
          retryConfig.delay || API_CONFIG.RETRY.DELAY,
          retryConfig.backoffMultiplier || API_CONFIG.RETRY.BACKOFF_MULTIPLIER
        );
      }

      return await makeRequest();
    } catch (error) {
      const duration = Date.now() - startTime;

      // Log de l'erreur
      if (API_CONFIG.LOGGING.LOG_ERRORS) {
        log.api.error(method, url, 0, error);
      }

      // Convertir les erreurs réseau en ApiError
      if (!(error instanceof ApiError)) {
        throw createApiErrorFromNetworkError(error, url);
      }

      throw error;
    }
  }

  /**
   * Construit les headers de la requête
   */
  private static async buildHeaders(
    customHeaders?: HeadersInit,
    skipAuth: boolean = false
  ): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      ...API_CONFIG.DEFAULT_HEADERS,
    };

    // Ajouter les headers personnalisés
    if (customHeaders) {
      if (customHeaders instanceof Headers) {
        customHeaders.forEach((value, key) => {
          headers[key] = value;
        });
      } else if (Array.isArray(customHeaders)) {
        customHeaders.forEach(([key, value]) => {
          headers[key] = value;
        });
      } else {
        Object.assign(headers, customHeaders);
      }
    }

    // Ajouter le token d'authentification si nécessaire
    if (!skipAuth && !headers.Authorization) {
      try {
        const token = await AuthService.getAccessToken();
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        log.warn('Impossible de récupérer le token d\'authentification', { error });
      }
    }

    return headers;
  }

  /**
   * Méthodes HTTP simplifiées
   */
  static get<T>(endpoint: string, options?: ApiClientOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  static post<T>(endpoint: string, data?: unknown, options?: ApiClientOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  static put<T>(endpoint: string, data?: unknown, options?: ApiClientOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  static patch<T>(endpoint: string, data?: unknown, options?: ApiClientOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  static delete<T>(endpoint: string, options?: ApiClientOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

/**
 * Export de la fonction apiCall améliorée pour compatibilité avec l'ancien code
 */
export const apiCall = async <T>(
  endpoint: string,
  options: RequestInit = {},
  retryCount: number = 0,
  baseUrlOverride?: string
): Promise<T> => {
  // Convertir les anciennes options vers les nouvelles
  const apiOptions: ApiClientOptions = {
    ...options,
    baseUrlOverride,
    retry: retryCount > 0 ? {
      maxAttempts: retryCount + 1,
      delay: API_CONFIG.RETRY.DELAY,
      backoffMultiplier: API_CONFIG.RETRY.BACKOFF_MULTIPLIER,
    } : undefined,
  };

  return ApiClient.request<T>(endpoint, apiOptions);
};

