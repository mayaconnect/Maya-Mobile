/**
 * Tests pour services/shared/api-client.ts
 */

import { ApiClient } from '@/services/shared/api-client';
import { AuthService } from '@/services/auth.service';
import { createApiErrorFromNetworkError } from '@/services/shared/errors';

jest.mock('@/services/auth.service');
jest.mock('@/services/shared/errors');
jest.mock('@/config/api.config', () => ({
  API_CONFIG: {
    BASE_URL: 'https://api.example.com',
    DEFAULT_HEADERS: {
      'Content-Type': 'application/json',
    },
    RETRY: {
      DELAY: 1000,
      BACKOFF_MULTIPLIER: 2,
    },
    LOGGING: {
      LOG_REQUESTS: false,
      LOG_RESPONSES: false,
      LOG_ERRORS: false,
    },
  },
  getApiUrl: (endpoint: string) => `https://api.example.com${endpoint}`,
  getTimeout: () => 5000,
}));

describe('ApiClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AuthService.getAccessToken as jest.Mock).mockResolvedValue('test-token');
    global.fetch = jest.fn();
  });

  describe('request', () => {
    it('devrait effectuer une requête GET réussie', async () => {
      const mockData = { id: 1, name: 'Test' };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: jest.fn().mockResolvedValueOnce(mockData),
      });

      const result = await ApiClient.request('/test');

      expect(result).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('devrait gérer les erreurs HTTP', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        text: jest.fn().mockResolvedValueOnce('Not found'),
        headers: new Headers(),
      });

      await expect(ApiClient.request('/test')).rejects.toThrow();
    });

    it('devrait gérer les réponses 204 No Content', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 204,
        headers: new Headers(),
      });

      const result = await ApiClient.request('/test');
      expect(result).toBeUndefined();
    });

    it('devrait gérer les réponses texte', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'text/plain' }),
        text: jest.fn().mockResolvedValueOnce('Plain text'),
      });

      const result = await ApiClient.request('/test');
      expect(result).toBe('Plain text');
    });

    it('devrait ajouter le token d\'authentification', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: jest.fn().mockResolvedValueOnce({}),
      });

      await ApiClient.request('/test');

      expect(AuthService.getAccessToken).toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      );
    });

    it('devrait skip l\'authentification si skipAuth est true', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: jest.fn().mockResolvedValueOnce({}),
      });

      await ApiClient.request('/test', { skipAuth: true });

      expect(AuthService.getAccessToken).not.toHaveBeenCalled();
    });

    it('devrait gérer les timeouts', async () => {
      jest.useFakeTimers();
      (global.fetch as jest.Mock).mockImplementationOnce(
        () => new Promise(() => {}) // Ne résout jamais
      );

      const requestPromise = ApiClient.request('/test', { timeout: 100 });

      jest.advanceTimersByTime(100);

      await expect(requestPromise).rejects.toThrow();
      jest.useRealTimers();
    });
  });

  describe('get', () => {
    it('devrait effectuer une requête GET', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: jest.fn().mockResolvedValueOnce({ data: 'test' }),
      });

      const result = await ApiClient.get('/test');
      expect(result).toEqual({ data: 'test' });
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: 'GET' })
      );
    });
  });

  describe('post', () => {
    it('devrait effectuer une requête POST avec body', async () => {
      const postData = { name: 'Test' };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 201,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: jest.fn().mockResolvedValueOnce({ id: 1, ...postData }),
      });

      const result = await ApiClient.post('/test', postData);
      expect(result).toEqual({ id: 1, ...postData });
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(postData),
        })
      );
    });
  });

  describe('put', () => {
    it('devrait effectuer une requête PUT avec body', async () => {
      const putData = { name: 'Updated' };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: jest.fn().mockResolvedValueOnce(putData),
      });

      const result = await ApiClient.put('/test', putData);
      expect(result).toEqual(putData);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: 'PUT' })
      );
    });
  });

  describe('patch', () => {
    it('devrait effectuer une requête PATCH avec body', async () => {
      const patchData = { name: 'Patched' };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: jest.fn().mockResolvedValueOnce(patchData),
      });

      const result = await ApiClient.patch('/test', patchData);
      expect(result).toEqual(patchData);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: 'PATCH' })
      );
    });
  });

  describe('delete', () => {
    it('devrait effectuer une requête DELETE', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 204,
        headers: new Headers(),
      });

      const result = await ApiClient.delete('/test');
      expect(result).toBeUndefined();
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });
});

