/**
 * Tests pour persistent-cache.ts
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { persistentCache } from '@/utils/persistent-cache';

jest.mock('@react-native-async-storage/async-storage');

describe('PersistentCache', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);
  });

  describe('get', () => {
    it('devrait retourner null si la clé n\'existe pas', async () => {
      const result = await persistentCache.get('non-existent-key');
      expect(result).toBeNull();
    });

    it('devrait retourner les données si elles existent et ne sont pas expirées', async () => {
      const testData = { id: 1, name: 'Test' };
      const entry = {
        data: testData,
        timestamp: Date.now(),
        expiresAt: Date.now() + 60000, // 1 minute
        key: 'test-key',
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(entry));

      const result = await persistentCache.get('test-key');
      expect(result).toEqual(testData);
    });

    it('devrait retourner null si les données sont expirées', async () => {
      const testData = { id: 1, name: 'Test' };
      const entry = {
        data: testData,
        timestamp: Date.now() - 120000, // 2 minutes ago
        expiresAt: Date.now() - 60000, // expired 1 minute ago
        key: 'test-key',
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(entry));

      const result = await persistentCache.get('test-key');
      expect(result).toBeNull();
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@maya_cache:test-key');
    });
  });

  describe('set', () => {
    it('devrait sauvegarder les données avec TTL par défaut', async () => {
      const testData = { id: 1, name: 'Test' };
      await persistentCache.set('test-key', testData);

      expect(AsyncStorage.setItem).toHaveBeenCalled();
      const callArgs = (AsyncStorage.setItem as jest.Mock).mock.calls[0];
      expect(callArgs[0]).toBe('@maya_cache:test-key');
      
      const savedEntry = JSON.parse(callArgs[1]);
      expect(savedEntry.data).toEqual(testData);
      expect(savedEntry.expiresAt).toBeGreaterThan(Date.now());
    });

    it('devrait sauvegarder les données avec TTL personnalisé', async () => {
      const testData = { id: 1, name: 'Test' };
      const customTTL = 10000; // 10 secondes
      await persistentCache.set('test-key', testData, customTTL);

      const callArgs = (AsyncStorage.setItem as jest.Mock).mock.calls[0];
      const savedEntry = JSON.parse(callArgs[1]);
      expect(savedEntry.expiresAt).toBeGreaterThanOrEqual(Date.now() + customTTL - 1000);
      expect(savedEntry.expiresAt).toBeLessThanOrEqual(Date.now() + customTTL + 1000);
    });
  });

  describe('delete', () => {
    it('devrait supprimer une entrée du cache', async () => {
      await persistentCache.delete('test-key');
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@maya_cache:test-key');
    });
  });

  describe('clear', () => {
    it('devrait vider tout le cache', async () => {
      const metadata = {
        keys: ['key1', 'key2', 'key3'],
        lastCleanup: Date.now(),
      };

      (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
        if (key === '@maya_cache_metadata') {
          return Promise.resolve(JSON.stringify(metadata));
        }
        return Promise.resolve(null);
      });

      await persistentCache.clear();

      expect(AsyncStorage.removeItem).toHaveBeenCalledTimes(4); // 3 keys + metadata
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@maya_cache:key1');
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@maya_cache:key2');
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@maya_cache:key3');
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@maya_cache_metadata');
    });
  });

  describe('cleanup', () => {
    it('devrait nettoyer les entrées expirées', async () => {
      const expiredEntry = {
        data: { id: 1 },
        timestamp: Date.now() - 120000,
        expiresAt: Date.now() - 60000, // expired
        key: 'expired-key',
      };

      const validEntry = {
        data: { id: 2 },
        timestamp: Date.now(),
        expiresAt: Date.now() + 60000, // valid
        key: 'valid-key',
      };

      const metadata = {
        keys: ['expired-key', 'valid-key'],
        lastCleanup: Date.now() - 3600000,
      };

      (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
        if (key === '@maya_cache_metadata') {
          return Promise.resolve(JSON.stringify(metadata));
        }
        if (key === '@maya_cache:expired-key') {
          return Promise.resolve(JSON.stringify(expiredEntry));
        }
        if (key === '@maya_cache:valid-key') {
          return Promise.resolve(JSON.stringify(validEntry));
        }
        return Promise.resolve(null);
      });

      const cleanedCount = await persistentCache.cleanup();

      expect(cleanedCount).toBe(1);
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@maya_cache:expired-key');
      expect(AsyncStorage.removeItem).not.toHaveBeenCalledWith('@maya_cache:valid-key');
    });
  });
});

