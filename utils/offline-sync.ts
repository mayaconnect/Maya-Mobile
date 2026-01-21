/**
 * Système de synchronisation offline pour React Native
 * Stocke les requêtes en attente et les synchronise automatiquement quand la connexion revient
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { log } from './logger';
import { ApiClient } from '@/services/shared/api-client';

// NetInfo optionnel (nécessite @react-native-community/netinfo)
let NetInfo: any = null;
try {
  NetInfo = require('@react-native-community/netinfo');
} catch {
  log.warn('NetInfo non disponible, la détection de réseau sera limitée');
}

const SYNC_QUEUE_KEY = '@maya_sync_queue';
const SYNC_METADATA_KEY = '@maya_sync_metadata';

export interface QueuedRequest {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  endpoint: string;
  body?: any;
  headers?: Record<string, string>;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  options?: {
    baseUrlOverride?: string;
    retry?: { maxAttempts: number; delay: number };
  };
}

interface SyncMetadata {
  lastSync: number;
  totalSynced: number;
  totalFailed: number;
}

/**
 * Classe pour gérer la synchronisation offline
 */
class OfflineSync {
  private syncQueue: QueuedRequest[] = [];
  private isSyncing = false;
  private networkListener: any = null;
  private syncInterval: NodeJS.Timeout | null = null;

  /**
   * Initialise le système de synchronisation
   */
  async initialize(): Promise<void> {
    // Charger la queue depuis AsyncStorage
    await this.loadQueue();

    if (NetInfo) {
      // Écouter les changements de réseau
      this.networkListener = NetInfo.addEventListener((state: any) => {
        if (state.isConnected && !this.isSyncing) {
          log.info('Connexion réseau détectée, démarrage de la synchronisation');
          this.sync();
        }
      });

      // Synchroniser périodiquement (toutes les 30 secondes si connecté)
      this.syncInterval = setInterval(async () => {
        try {
          const state = await NetInfo.fetch();
          if (state.isConnected && !this.isSyncing && this.syncQueue.length > 0) {
            this.sync();
          }
        } catch (error) {
          log.error('Erreur lors de la vérification du réseau', error as Error);
        }
      }, 30000);

      // Synchroniser immédiatement si connecté
      try {
        const state = await NetInfo.fetch();
        if (state.isConnected && this.syncQueue.length > 0) {
          this.sync();
        }
      } catch (error) {
        log.error('Erreur lors de la vérification initiale du réseau', error as Error);
      }
    } else {
      // Sans NetInfo, synchroniser périodiquement sans vérifier la connexion
      this.syncInterval = setInterval(() => {
        if (!this.isSyncing && this.syncQueue.length > 0) {
          this.sync();
        }
      }, 30000);
    }

    log.info('Système de synchronisation offline initialisé', {
      queuedRequests: this.syncQueue.length,
      netInfoAvailable: !!NetInfo,
    });
  }

  /**
   * Ajoute une requête à la queue de synchronisation
   */
  async queueRequest(request: Omit<QueuedRequest, 'id' | 'timestamp' | 'retryCount'>): Promise<string> {
    const queuedRequest: QueuedRequest = {
      ...request,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: request.maxRetries || 3,
    };

    this.syncQueue.push(queuedRequest);
    await this.saveQueue();

    log.info('Requête ajoutée à la queue', {
      id: queuedRequest.id,
      method: queuedRequest.method,
      endpoint: queuedRequest.endpoint,
      queueSize: this.syncQueue.length,
    });

    // Essayer de synchroniser immédiatement si connecté
    if (NetInfo) {
      try {
        const state = await NetInfo.fetch();
        if (state.isConnected) {
          this.sync();
        }
      } catch (error) {
        log.error('Erreur lors de la vérification du réseau', error as Error);
      }
    } else {
      // Sans NetInfo, essayer de synchroniser directement
      this.sync();
    }

    return queuedRequest.id;
  }

  /**
   * Synchronise toutes les requêtes en attente
   */
  async sync(): Promise<void> {
    if (this.isSyncing || this.syncQueue.length === 0) {
      return;
    }

    this.isSyncing = true;
    log.info('Démarrage de la synchronisation', { queueSize: this.syncQueue.length });

    if (NetInfo) {
      try {
        const state = await NetInfo.fetch();
        if (!state.isConnected) {
          log.warn('Pas de connexion réseau, synchronisation annulée');
          this.isSyncing = false;
          return;
        }
      } catch (error) {
        log.error('Erreur lors de la vérification du réseau', error as Error);
        this.isSyncing = false;
        return;
      }
    }

    const requestsToSync = [...this.syncQueue];
    let successCount = 0;
    let failureCount = 0;

    for (const request of requestsToSync) {
      try {
        await this.executeRequest(request);
        this.removeFromQueue(request.id);
        successCount++;
        log.info('Requête synchronisée avec succès', { id: request.id });
      } catch (error) {
        request.retryCount++;
        
        if (request.retryCount >= request.maxRetries) {
          log.error('Échec définitif de la synchronisation', error as Error, { id: request.id });
          this.removeFromQueue(request.id);
          failureCount++;
        } else {
          log.warn('Échec de la synchronisation, nouvelle tentative prévue', {
            id: request.id,
            retryCount: request.retryCount,
            maxRetries: request.maxRetries,
          });
        }
      }
    }

    await this.saveQueue();
    await this.updateMetadata(successCount, failureCount);

    this.isSyncing = false;
    log.info('Synchronisation terminée', {
      successCount,
      failureCount,
      remainingQueue: this.syncQueue.length,
    });
  }

  /**
   * Exécute une requête de la queue
   */
  private async executeRequest(request: QueuedRequest): Promise<void> {
    const options: any = {
      ...request.options,
    };

    if (request.options?.baseUrlOverride) {
      options.baseUrlOverride = request.options.baseUrlOverride;
    }

    switch (request.method) {
      case 'GET':
        await ApiClient.get(request.endpoint, options);
        break;
      case 'POST':
        await ApiClient.post(request.endpoint, request.body || {}, options);
        break;
      case 'PUT':
        await ApiClient.put(request.endpoint, request.body || {}, options);
        break;
      case 'PATCH':
        await ApiClient.patch(request.endpoint, request.body || {}, options);
        break;
      case 'DELETE':
        await ApiClient.delete(request.endpoint, options);
        break;
    }
  }

  /**
   * Retire une requête de la queue
   */
  private removeFromQueue(id: string): void {
    this.syncQueue = this.syncQueue.filter(req => req.id !== id);
  }

  /**
   * Charge la queue depuis AsyncStorage
   */
  private async loadQueue(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
      if (stored) {
        this.syncQueue = JSON.parse(stored);
        log.info('Queue chargée depuis le stockage', { count: this.syncQueue.length });
      }
    } catch (error) {
      log.error('Erreur lors du chargement de la queue', error as Error);
      this.syncQueue = [];
    }
  }

  /**
   * Sauvegarde la queue dans AsyncStorage
   */
  private async saveQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(this.syncQueue));
    } catch (error) {
      log.error('Erreur lors de la sauvegarde de la queue', error as Error);
    }
  }

  /**
   * Met à jour les métadonnées de synchronisation
   */
  private async updateMetadata(successCount: number, failureCount: number): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(SYNC_METADATA_KEY);
      const metadata: SyncMetadata = stored
        ? JSON.parse(stored)
        : { lastSync: 0, totalSynced: 0, totalFailed: 0 };

      metadata.lastSync = Date.now();
      metadata.totalSynced += successCount;
      metadata.totalFailed += failureCount;

      await AsyncStorage.setItem(SYNC_METADATA_KEY, JSON.stringify(metadata));
    } catch (error) {
      log.error('Erreur lors de la mise à jour des métadonnées', error as Error);
    }
  }

  /**
   * Récupère les statistiques de synchronisation
   */
  async getStats(): Promise<{
    queueSize: number;
    metadata: SyncMetadata | null;
  }> {
    try {
      const stored = await AsyncStorage.getItem(SYNC_METADATA_KEY);
      const metadata = stored ? JSON.parse(stored) : null;
      return {
        queueSize: this.syncQueue.length,
        metadata,
      };
    } catch (error) {
      log.error('Erreur lors de la récupération des stats', error as Error);
      return {
        queueSize: this.syncQueue.length,
        metadata: null,
      };
    }
  }

  /**
   * Vide la queue de synchronisation
   */
  async clearQueue(): Promise<void> {
    this.syncQueue = [];
    await AsyncStorage.removeItem(SYNC_QUEUE_KEY);
    log.info('Queue de synchronisation vidée');
  }

  /**
   * Nettoie les ressources
   */
  cleanup(): void {
    if (this.networkListener) {
      this.networkListener();
      this.networkListener = null;
    }
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }
}

// Instance singleton
export const offlineSync = new OfflineSync();

