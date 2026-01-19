/**
 * Utilitaires de performance et monitoring
 */

import { log } from './logger';

/**
 * Mesure le temps d'exécution d'une fonction
 */
export async function measurePerformance<T>(
  name: string,
  fn: () => Promise<T> | T
): Promise<T> {
  const start = performance.now();
  try {
    const result = await fn();
    const duration = performance.now() - start;
    log.debug(`Performance: ${name}`, { duration: `${duration.toFixed(2)}ms` });
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    log.error(`Performance error: ${name}`, error, { duration: `${duration.toFixed(2)}ms` });
    throw error;
  }
}

/**
 * Crée un wrapper de performance pour une fonction
 */
export function withPerformance<T extends (...args: unknown[]) => unknown>(
  name: string,
  fn: T
): T {
  return ((...args: Parameters<T>) => {
    return measurePerformance(name, () => fn(...args));
  }) as T;
}

/**
 * Délai pour éviter les re-renders trop fréquents
 */
export function requestIdleCallback(callback: () => void, timeout?: number): number {
  if (typeof requestIdleCallback !== 'undefined' && typeof window !== 'undefined') {
    return window.requestIdleCallback(callback, { timeout });
  }
  // Fallback pour React Native
  return setTimeout(callback, timeout || 0) as unknown as number;
}

/**
 * Annule un requestIdleCallback
 */
export function cancelIdleCallback(id: number): void {
  if (typeof cancelIdleCallback !== 'undefined' && typeof window !== 'undefined') {
    window.cancelIdleCallback(id);
  } else {
    clearTimeout(id);
  }
}

/**
 * Batch les mises à jour pour éviter les re-renders multiples
 */
export class UpdateBatcher {
  private updates: Map<string, unknown> = new Map();
  private timeoutId: NodeJS.Timeout | null = null;
  private readonly batchDelay: number;

  constructor(batchDelay: number = 16) {
    this.batchDelay = batchDelay;
  }

  add(key: string, value: unknown, callback: (updates: Map<string, unknown>) => void): void {
    this.updates.set(key, value);

    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    this.timeoutId = setTimeout(() => {
      callback(new Map(this.updates));
      this.updates.clear();
      this.timeoutId = null;
    }, this.batchDelay);
  }

  flush(callback: (updates: Map<string, unknown>) => void): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    if (this.updates.size > 0) {
      callback(new Map(this.updates));
      this.updates.clear();
    }
  }
}

/**
 * Lazy load un module
 */
export async function lazyLoad<T>(loader: () => Promise<{ default: T }>): Promise<T> {
  const start = performance.now();
  try {
    const module = await loader();
    const duration = performance.now() - start;
    log.debug('Module lazy loaded', { duration: `${duration.toFixed(2)}ms` });
    return module.default;
  } catch (error) {
    log.error('Erreur lors du lazy load', error);
    throw error;
  }
}

/**
 * Vérifie si le code s'exécute sur le thread principal
 */
export function isMainThread(): boolean {
  // En React Native, on est toujours sur le thread principal pour JS
  return true;
}

/**
 * Crée un pool de workers pour les tâches lourdes (si disponible)
 */
export class TaskPool {
  private tasks: Array<() => Promise<unknown>> = [];
  private running = 0;
  private readonly maxConcurrent: number;

  constructor(maxConcurrent: number = 4) {
    this.maxConcurrent = maxConcurrent;
  }

  async add<T>(task: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.tasks.push(async () => {
        try {
          const result = await task();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      this.process();
    });
  }

  private async process(): Promise<void> {
    if (this.running >= this.maxConcurrent || this.tasks.length === 0) {
      return;
    }

    this.running++;
    const task = this.tasks.shift();
    if (task) {
      try {
        await task();
      } finally {
        this.running--;
        this.process();
      }
    }
  }

  async wait(): Promise<void> {
    while (this.tasks.length > 0 || this.running > 0) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }
}

