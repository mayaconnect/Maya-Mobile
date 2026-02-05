/**
 * Tests pour services/shared/errors.ts
 */

import {
  ApiError,
  ErrorCode,
  createApiErrorFromResponse,
  createApiErrorFromNetworkError,
  isRetryableError,
} from '@/services/shared/errors';

describe('errors', () => {
  describe('ApiError', () => {
    it('devrait créer une erreur avec les propriétés de base', () => {
      const error = new ApiError('Test error', ErrorCode.NETWORK_ERROR, 500);

      expect(error.message).toBe('Test error');
      expect(error.code).toBe(ErrorCode.NETWORK_ERROR);
      expect(error.statusCode).toBe(500);
      expect(error.name).toBe('ApiError');
      expect(error.timestamp).toBeDefined();
    });

    it('devrait avoir isRetryable par défaut à false', () => {
      const error = new ApiError('Test error');
      expect(error.isRetryable).toBe(false);
    });

    it('devrait accepter isRetryable personnalisé', () => {
      const error = new ApiError('Test error', ErrorCode.NETWORK_ERROR, undefined, undefined, true);
      expect(error.isRetryable).toBe(true);
    });

    it('devrait convertir en JSON', () => {
      const error = new ApiError('Test error', ErrorCode.NETWORK_ERROR, 500);
      const json = error.toJSON();

      expect(json.message).toBe('Test error');
      expect(json.code).toBe(ErrorCode.NETWORK_ERROR);
      expect(json.statusCode).toBe(500);
    });

    it('devrait retourner un message utilisateur-friendly', () => {
      const networkError = new ApiError('Network error', ErrorCode.NETWORK_ERROR);
      expect(networkError.getUserMessage()).toContain('connexion');

      const unauthorizedError = new ApiError('Unauthorized', ErrorCode.UNAUTHORIZED);
      expect(unauthorizedError.getUserMessage()).toContain('authentification');

      const notFoundError = new ApiError('Not found', ErrorCode.NOT_FOUND);
      expect(notFoundError.getUserMessage()).toContain('trouvé');
    });
  });

  describe('createApiErrorFromResponse', () => {
    it('devrait créer une erreur à partir d\'une réponse 404', () => {
      const error = createApiErrorFromResponse(404, 'Not Found', 'Resource not found', '/test');

      expect(error.statusCode).toBe(404);
      expect(error.code).toBe(ErrorCode.NOT_FOUND);
      expect(error.message).toContain('Not Found');
    });

    it('devrait créer une erreur à partir d\'une réponse 401', () => {
      const error = createApiErrorFromResponse(401, 'Unauthorized', 'Invalid token', '/test');

      expect(error.statusCode).toBe(401);
      expect(error.code).toBe(ErrorCode.UNAUTHORIZED);
    });

    it('devrait créer une erreur à partir d\'une réponse 500', () => {
      const error = createApiErrorFromResponse(500, 'Internal Server Error', 'Server error', '/test');

      expect(error.statusCode).toBe(500);
      expect(error.code).toBe(ErrorCode.SERVER_ERROR);
      expect(error.isRetryable).toBe(true);
    });

    it('devrait parser un JSON d\'erreur', () => {
      const errorJson = JSON.stringify({ message: 'Custom error', code: 'CUSTOM_ERROR' });
      const error = createApiErrorFromResponse(400, 'Bad Request', errorJson, '/test');

      expect(error.message).toContain('Custom error');
    });
  });

  describe('createApiErrorFromNetworkError', () => {
    it('devrait créer une erreur réseau à partir d\'une erreur de timeout', () => {
      const networkError = new Error('Request timeout');
      networkError.name = 'AbortError';
      const error = createApiErrorFromNetworkError(networkError, '/test');

      expect(error.code).toBe(ErrorCode.TIMEOUT_ERROR);
      expect(error.isRetryable).toBe(true);
    });

    it('devrait créer une erreur réseau générique', () => {
      const networkError = new Error('Network request failed');
      const error = createApiErrorFromNetworkError(networkError, '/test');

      expect(error.code).toBe(ErrorCode.NETWORK_ERROR);
      expect(error.isRetryable).toBe(true);
    });
  });

  describe('isRetryableError', () => {
    it('devrait retourner true pour les erreurs retryables', () => {
      const error = new ApiError('Network error', ErrorCode.NETWORK_ERROR, undefined, undefined, true);
      expect(isRetryableError(error)).toBe(true);
    });

    it('devrait retourner false pour les erreurs non retryables', () => {
      const error = new ApiError('Bad request', ErrorCode.BAD_REQUEST, 400);
      expect(isRetryableError(error)).toBe(false);
    });

    it('devrait retourner true pour les erreurs 500', () => {
      const error = new ApiError('Server error', ErrorCode.SERVER_ERROR, 500);
      expect(isRetryableError(error)).toBe(true);
    });

    it('devrait retourner false pour les erreurs 400', () => {
      const error = new ApiError('Bad request', ErrorCode.BAD_REQUEST, 400);
      expect(isRetryableError(error)).toBe(false);
    });
  });
});

