/**
 * Maya Connect V2 — Storage Helpers
 *
 * Wraps expo-secure-store and AsyncStorage for a unified API.
 * On web, falls back to localStorage since SecureStore and AsyncStorage are native-only.
 * Fully compatible with Expo Go — no NitroModules / bare-workflow code.
 */
import { Platform } from 'react-native';

/* ------------------------------------------------------------------ */
/*  Secure Store Abstraction (web-safe)                                */
/* ------------------------------------------------------------------ */
const createSecureAdapter = () => {
  if (Platform.OS === 'web') {
    return {
      getItemAsync: async (key: string): Promise<string | null> =>
        localStorage.getItem(key),
      setItemAsync: async (key: string, value: string): Promise<void> => {
        localStorage.setItem(key, value);
      },
      deleteItemAsync: async (key: string): Promise<void> => {
        localStorage.removeItem(key);
      },
    };
  }
  // Native: use expo-secure-store
  const SecureStore = require('expo-secure-store');
  return {
    getItemAsync: (key: string) => SecureStore.getItemAsync(key) as Promise<string | null>,
    setItemAsync: (key: string, value: string) => SecureStore.setItemAsync(key, value) as Promise<void>,
    deleteItemAsync: (key: string) => SecureStore.deleteItemAsync(key) as Promise<void>,
  };
};

export const SecureStoreAdapter = createSecureAdapter();

/* ------------------------------------------------------------------ */
/*  Cache Abstraction (Expo Go / web / native safe)                    */
/*                                                                     */
/*  On web → localStorage.                                             */
/*  On native (Expo Go or dev-client) → AsyncStorage-backed cache      */
/*  with a synchronous in-memory mirror so the API stays sync.         */
/*  To switch to MMKV for production bare-workflow builds, swap the    */
/*  native branch back to react-native-mmkv.                           */
/* ------------------------------------------------------------------ */
const createCacheAdapter = () => {
  if (Platform.OS === 'web') {
    return {
      getString: (key: string): string | undefined =>
        localStorage.getItem(key) ?? undefined,
      setString: (key: string, value: string) =>
        localStorage.setItem(key, value),
      getNumber: (key: string): number | undefined => {
        const v = localStorage.getItem(key);
        return v != null ? Number(v) : undefined;
      },
      setNumber: (key: string, value: number) =>
        localStorage.setItem(key, String(value)),
      getBoolean: (key: string): boolean | undefined => {
        const v = localStorage.getItem(key);
        return v != null ? v === 'true' : undefined;
      },
      setBoolean: (key: string, value: boolean) =>
        localStorage.setItem(key, String(value)),
      getJSON: <T>(key: string): T | null => {
        const raw = localStorage.getItem(key);
        if (!raw) return null;
        try { return JSON.parse(raw) as T; } catch { return null; }
      },
      setJSON: (key: string, value: unknown) =>
        localStorage.setItem(key, JSON.stringify(value)),
      delete: (key: string) => localStorage.removeItem(key),
      clear: () => localStorage.clear(),
    };
  }

  // Native: in-memory Map backed by AsyncStorage for persistence.
  // Keeps the same synchronous API that the rest of the app expects.
  const AsyncStorage =
    require('@react-native-async-storage/async-storage').default;
  const CACHE_PREFIX = '@maya_cache:';
  const mem = new Map<string, string>();

  // Hydrate in-memory cache from AsyncStorage (fire-and-forget).
  AsyncStorage.getAllKeys()
    .then((keys: string[]) => {
      const cacheKeys = keys.filter((k: string) => k.startsWith(CACHE_PREFIX));
      if (cacheKeys.length === 0) return;
      return AsyncStorage.multiGet(cacheKeys).then(
        (entries: [string, string | null][]) => {
          for (const [k, v] of entries) {
            if (v != null) mem.set(k.replace(CACHE_PREFIX, ''), v);
          }
        },
      );
    })
    .catch(() => {});

  const persist = (key: string, value: string) => {
    mem.set(key, value);
    AsyncStorage.setItem(`${CACHE_PREFIX}${key}`, value).catch(() => {});
  };

  return {
    getString: (key: string): string | undefined => mem.get(key),
    setString: (key: string, value: string) => persist(key, value),
    getNumber: (key: string): number | undefined => {
      const v = mem.get(key);
      return v != null ? Number(v) : undefined;
    },
    setNumber: (key: string, value: number) => persist(key, String(value)),
    getBoolean: (key: string): boolean | undefined => {
      const v = mem.get(key);
      return v != null ? v === 'true' : undefined;
    },
    setBoolean: (key: string, value: boolean) => persist(key, String(value)),
    getJSON: <T>(key: string): T | null => {
      const raw = mem.get(key);
      if (!raw) return null;
      try { return JSON.parse(raw) as T; } catch { return null; }
    },
    setJSON: (key: string, value: unknown) =>
      persist(key, JSON.stringify(value)),
    delete: (key: string) => {
      mem.delete(key);
      AsyncStorage.removeItem(`${CACHE_PREFIX}${key}`).catch(() => {});
    },
    clear: () => {
      const keys = [...mem.keys()].map((k) => `${CACHE_PREFIX}${k}`);
      mem.clear();
      if (keys.length > 0) AsyncStorage.multiRemove(keys).catch(() => {});
    },
  };
};

export const cache = createCacheAdapter();

/* ------------------------------------------------------------------ */
/*  Convenience secure store API                                       */
/* ------------------------------------------------------------------ */
export const secure = {
  get: (key: string) => SecureStoreAdapter.getItemAsync(key),
  set: (key: string, value: string) => SecureStoreAdapter.setItemAsync(key, value),
  delete: (key: string) => SecureStoreAdapter.deleteItemAsync(key),
};
