/**
 * Système de cache persistant utilisant AsyncStorage pour React Native
 * Alternative à IndexedDB pour les applications mobiles
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { log } from './logger';

const CACHE_PREFIX = '@maya_cache:';
const CACHE_METADATA_KEY = '@maya_cache_metadata';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  key: string;
}

interface CacheMetadata {
  keys: string[];
  lastCleanup: number;
}

/**
 * Classe pour gérer le cache persistant
 */
class PersistentCache {
  private memoryCache: Map<string, CacheEntry<any>> = new Map();
  private maxMemoryEntries = 50; // Limite d'entrées en mémoire
  private defaultTTL = 5 * 60 * 1000; // 5 minutes par défaut

  /**
   * Récupère une entrée du cache (mémoire puis AsyncStorage)
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      // Vérifier d'abord le cache mémoire
      const memoryEntry = this.memoryCache.get(key);
      if (memoryEntry && Date.now() < memoryEntry.expiresAt) {
        log.debug('Cache hit (memory)', { key });
        return memoryEntry.data as T;
      }

      // Si pas en mémoire ou expiré, chercher dans AsyncStorage
      const storageKey = `${CACHE_PREFIX}${key}`;
      const stored = await AsyncStorage.getItem(storageKey);
      
      if (!stored) {
        log.debug('Cache miss', { key });
        return null;
      }

      const entry: CacheEntry<T> = JSON.parse(stored);
      
      // Vérifier si l'entrée est expirée
      if (Date.now() >= entry.expiresAt) {
        log.debug('Cache entry expired', { key });
        await this.delete(key);
        return null;
      }

      // Mettre en cache mémoire pour les prochaines requêtes
      this.setMemoryCache(key, entry);
      
      log.debug('Cache hit (storage)', { key });
      return entry.data;
    } catch (error) {
      log.error('Erreur lors de la récupération du cache', error as Error, { key });
      return null;
    }
  }

  /**
   * Stocke une entrée dans le cache (mémoire et AsyncStorage)
   */
  async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    try {
      const expiresAt = Date.now() + (ttl || this.defaultTTL);
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        expiresAt,
        key,
      };

      // Stocker en mémoire
      this.setMemoryCache(key, entry);

      // Stocker dans AsyncStorage
      const storageKey = `${CACHE_PREFIX}${key}`;
      await AsyncStorage.setItem(storageKey, JSON.stringify(entry));

      // Mettre à jour les métadonnées
      await this.updateMetadata(key);

      log.debug('Cache entry stored', { key, expiresAt: new Date(expiresAt).toISOString() });
    } catch (error) {
      log.error('Erreur lors du stockage du cache', error as Error, { key });
    }
  }

  /**
   * Supprime une entrée du cache
   */
  async delete(key: string): Promise<void> {
    try {
      // Supprimer de la mémoire
      this.memoryCache.delete(key);

      // Supprimer d'AsyncStorage
      const storageKey = `${CACHE_PREFIX}${key}`;
      await AsyncStorage.removeItem(storageKey);

      // Mettre à jour les métadonnées
      await this.removeFromMetadata(key);

      log.debug('Cache entry deleted', { key });
    } catch (error) {
      log.error('Erreur lors de la suppression du cache', error as Error, { key });
    }
  }

  /**
   * Vide tout le cache
   */
  async clear(): Promise<void> {
    try {
      this.memoryCache.clear();

      // Récupérer toutes les clés de cache
      const metadata = await this.getMetadata();
      if (metadata) {
        for (const key of metadata.keys) {
          const storageKey = `${CACHE_PREFIX}${key}`;
          await AsyncStorage.removeItem(storageKey);
        }
      }

      // Réinitialiser les métadonnées
      await AsyncStorage.removeItem(CACHE_METADATA_KEY);

      log.info('Cache cleared');
    } catch (error) {
      log.error('Erreur lors du vidage du cache', error as Error);
    }
  }

  /**
   * Nettoie les entrées expirées
   */
  async cleanup(): Promise<number> {
    try {
      const metadata = await this.getMetadata();
      if (!metadata) {
        return 0;
      }

      const now = Date.now();
      let cleanedCount = 0;

      for (const key of [...metadata.keys]) {
        const storageKey = `${CACHE_PREFIX}${key}`;
        const stored = await AsyncStorage.getItem(storageKey);
        
        if (stored) {
          const entry: CacheEntry<any> = JSON.parse(stored);
          if (now >= entry.expiresAt) {
            await AsyncStorage.removeItem(storageKey);
            this.memoryCache.delete(key);
            await this.removeFromMetadata(key);
            cleanedCount++;
          }
        }
      }

      if (cleanedCount > 0) {
        log.info('Cache cleanup completed', { cleanedCount });
      }

      // Mettre à jour la date de dernier nettoyage
      metadata.lastCleanup = now;
      await AsyncStorage.setItem(CACHE_METADATA_KEY, JSON.stringify(metadata));

      return cleanedCount;
    } catch (error) {
      log.error('Erreur lors du nettoyage du cache', error as Error);
      return 0;
    }
  }

  /**
   * Récupère les métadonnées du cache
   */
  private async getMetadata(): Promise<CacheMetadata | null> {
    try {
      const stored = await AsyncStorage.getItem(CACHE_METADATA_KEY);
      return stored ? JSON.parse(stored) : { keys: [], lastCleanup: 0 };
    } catch {
      return null;
    }
  }

  /**
   * Met à jour les métadonnées avec une nouvelle clé
   */
  private async updateMetadata(key: string): Promise<void> {
    try {
      const metadata = await this.getMetadata() || { keys: [], lastCleanup: 0 };
      if (!metadata.keys.includes(key)) {
        metadata.keys.push(key);
        await AsyncStorage.setItem(CACHE_METADATA_KEY, JSON.stringify(metadata));
      }
    } catch (error) {
      log.error('Erreur lors de la mise à jour des métadonnées', error as Error);
    }
  }

  /**
   * Retire une clé des métadonnées
   */
  private async removeFromMetadata(key: string): Promise<void> {
    try {
      const metadata = await this.getMetadata();
      if (metadata) {
        metadata.keys = metadata.keys.filter(k => k !== key);
        await AsyncStorage.setItem(CACHE_METADATA_KEY, JSON.stringify(metadata));
      }
    } catch (error) {
      log.error('Erreur lors de la suppression des métadonnées', error as Error);
    }
  }

  /**
   * Stocke dans le cache mémoire avec limite de taille
   */
  private setMemoryCache(key: string, entry: CacheEntry<any>): void {
    // Si on dépasse la limite, supprimer la plus ancienne entrée
    if (this.memoryCache.size >= this.maxMemoryEntries) {
      const oldestKey = Array.from(this.memoryCache.keys())[0];
      this.memoryCache.delete(oldestKey);
    }
    this.memoryCache.set(key, entry);
  }

  /**
   * Configure le TTL par défaut
   */
  setDefaultTTL(ttl: number): void {
    this.defaultTTL = ttl;
  }
}

// Instance singleton
export const persistentCache = new PersistentCache();

// Nettoyer automatiquement toutes les heures
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    persistentCache.cleanup();
  }, 60 * 60 * 1000); // 1 heure
}

