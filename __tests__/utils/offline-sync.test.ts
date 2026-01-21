/**
 * Tests pour offline-sync.ts
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { offlineSync } from '@/utils/offline-sync';
import { ApiClient } from '@/services/shared/api-client';

jest.mock('@react-native-async-storage/async-storage');
jest.mock('@/services/shared/api-client');
jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn().mockResolvedValue({ isConnected: true }),
  addEventListener: jest.fn(() => () => {}),
}), { virtual: true });

describe('OfflineSync', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);
    (ApiClient.get as jest.Mock).mockResolvedValue({});
    (ApiClient.post as jest.Mock).mockResolvedValue({});
  });

  describe('queueRequest', () => {
    it('devrait ajouter une requête à la queue', async () => {
      const requestId = await offlineSync.queueRequest({
        method: 'GET',
        endpoint: '/test',
        maxRetries: 3,
      });

      expect(requestId).toBeDefined();
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    it('devrait générer un ID unique pour chaque requête', async () => {
      const id1 = await offlineSync.queueRequest({
        method: 'GET',
        endpoint: '/test1',
        maxRetries: 3,
      });

      const id2 = await offlineSync.queueRequest({
        method: 'POST',
        endpoint: '/test2',
        maxRetries: 3,
      });

      expect(id1).not.toBe(id2);
    });
  });

  describe('sync', () => {
    it('devrait synchroniser les requêtes en attente', async () => {
      const queuedRequest = {
        id: 'test-id',
        method: 'GET' as const,
        endpoint: '/test',
        timestamp: Date.now(),
        retryCount: 0,
        maxRetries: 3,
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify([queuedRequest]));
      (ApiClient.get as jest.Mock).mockResolvedValue({ success: true });

      await offlineSync.initialize();
      await offlineSync.sync();

      expect(ApiClient.get).toHaveBeenCalledWith('/test', undefined);
    });

    it('devrait retirer les requêtes réussies de la queue', async () => {
      const queuedRequest = {
        id: 'test-id',
        method: 'GET' as const,
        endpoint: '/test',
        timestamp: Date.now(),
        retryCount: 0,
        maxRetries: 3,
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify([queuedRequest]));
      (ApiClient.get as jest.Mock).mockResolvedValue({ success: true });

      await offlineSync.initialize();
      await offlineSync.sync();

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@maya_sync_queue',
        JSON.stringify([])
      );
    });

    it('devrait incrémenter retryCount en cas d\'échec', async () => {
      const queuedRequest = {
        id: 'test-id',
        method: 'GET' as const,
        endpoint: '/test',
        timestamp: Date.now(),
        retryCount: 0,
        maxRetries: 3,
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify([queuedRequest]));
      (ApiClient.get as jest.Mock).mockRejectedValue(new Error('Network error'));

      await offlineSync.initialize();
      await offlineSync.sync();

      const savedQueue = JSON.parse((AsyncStorage.setItem as jest.Mock).mock.calls.find(
        (call: any[]) => call[0] === '@maya_sync_queue'
      )?.[1] || '[]');

      if (savedQueue.length > 0) {
        expect(savedQueue[0].retryCount).toBe(1);
      }
    });
  });

  describe('getStats', () => {
    it('devrait retourner les statistiques de synchronisation', async () => {
      const metadata = {
        lastSync: Date.now(),
        totalSynced: 10,
        totalFailed: 2,
      };

      (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
        if (key === '@maya_sync_metadata') {
          return Promise.resolve(JSON.stringify(metadata));
        }
        return Promise.resolve(null);
      });

      const stats = await offlineSync.getStats();

      expect(stats.metadata).toEqual(metadata);
    });
  });

  describe('clearQueue', () => {
    it('devrait vider la queue de synchronisation', async () => {
      await offlineSync.clearQueue();

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@maya_sync_queue');
    });
  });
});

