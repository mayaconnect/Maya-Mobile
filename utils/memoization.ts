/**
 * Utilitaires de memoization pour optimiser les performances
 */

/**
 * Cache LRU (Least Recently Used) simple
 */
export class LRUCache<K, V> {
  private cache: Map<K, V>;
  private readonly maxSize: number;

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
    this.cache = new Map();
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // Déplacer à la fin (most recently used)
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Supprimer le premier élément (least recently used)
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

/**
 * Fonction de memoization avec cache LRU
 */
export function memoize<Args extends unknown[], Return>(
  fn: (...args: Args) => Return,
  maxSize: number = 100
): (...args: Args) => Return {
  const cache = new LRUCache<string, Return>(maxSize);

  return ((...args: Args): Return => {
    const key = JSON.stringify(args);
    const cached = cache.get(key);
    if (cached !== undefined) {
      return cached;
    }

    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as (...args: Args) => Return;
}

/**
 * Memoization avec TTL (Time To Live)
 */
export function memoizeWithTTL<Args extends unknown[], Return>(
  fn: (...args: Args) => Return,
  ttl: number = 5 * 60 * 1000, // 5 minutes par défaut
  maxSize: number = 100
): (...args: Args) => Return {
  const cache = new Map<string, { value: Return; timestamp: number }>();

  return ((...args: Args): Return => {
    const key = JSON.stringify(args);
    const cached = cache.get(key);

    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.value;
    }

    const result = fn(...args);
    cache.set(key, { value: result, timestamp: Date.now() });

    // Nettoyer les entrées expirées si le cache est trop grand
    if (cache.size > maxSize) {
      const now = Date.now();
      for (const [k, v] of cache.entries()) {
        if (now - v.timestamp >= ttl) {
          cache.delete(k);
        }
      }
    }

    return result;
  }) as (...args: Args) => Return;
}

/**
 * Debounce avec memoization
 */
export function memoizedDebounce<Args extends unknown[], Return>(
  fn: (...args: Args) => Return,
  delay: number = 300
): (...args: Args) => Return {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastArgs: Args | null = null;
  let lastResult: Return | null = null;

  return ((...args: Args): Return => {
    lastArgs = args;

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    return new Promise<Return>((resolve) => {
      timeoutId = setTimeout(() => {
        if (lastArgs && JSON.stringify(lastArgs) === JSON.stringify(args)) {
          if (lastResult === null) {
            lastResult = fn(...args);
          }
          resolve(lastResult);
        } else {
          lastResult = fn(...args);
          resolve(lastResult);
        }
        timeoutId = null;
      }, delay);
    }) as Return;
  }) as (...args: Args) => Return;
}

