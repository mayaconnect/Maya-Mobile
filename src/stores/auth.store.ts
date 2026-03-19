/**
 * Maya Connect V2 — Auth Store (Zustand)
 *
 * Holds user session, tokens, profile, and auth actions.
 */
import { create } from 'zustand';
import { SecureStoreAdapter } from '../utils/storage';
import { STORAGE_KEYS } from '../constants/config';
import { authApi } from '../api/auth.api';
import type { UserProfile, TokenPair, AppRole } from '../types';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface AuthState {
  /** Current user profile (null when logged-out) */
  user: UserProfile | null;
  /** JWT tokens */
  accessToken: string | null;
  refreshToken: string | null;
  /** Derived */
  isAuthenticated: boolean;
  /** Primary role shortcut */
  role: AppRole | null;
  /** Has completed onboarding */
  hasOnboarded: boolean;
  /** Loading flag for hydration */
  isHydrating: boolean;
}

interface AuthActions {
  /** Persist tokens + user after login / register */
  setSession: (tokens: TokenPair, user: UserProfile) => Promise<void>;
  /** Update profile without touching tokens */
  setUser: (user: UserProfile) => void;
  /** Update just the access token (after refresh) */
  setAccessToken: (token: string) => Promise<void>;
  /** Update both tokens after a refresh (token rotation) */
  setTokens: (accessToken: string, refreshToken: string) => Promise<void>;
  /** Full logout */
  logout: () => Promise<void>;
  /** Mark onboarding done */
  completeOnboarding: () => Promise<void>;
  /** Rehydrate from SecureStore on cold-start */
  hydrate: () => Promise<void>;
}

export type AuthStore = AuthState & AuthActions;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
const primaryRole = (user: UserProfile | null): AppRole | null => {
  if (!user) return null;

  // 1. Check the singular `role` string returned by GET /auth/me
  if (user.role) {
    const mapped = user.role.toLowerCase() as string;
    // API returns "Partner" | "StoreOperator" | "Client" | "Admin"
    if (mapped === 'admin') return 'admin';
    if (mapped === 'partner') return 'partner';
    if (mapped === 'storeoperator') return 'storeOperator';
    if (mapped === 'client') return 'client';
  }

  // 2. Fallback: check the `roles` array (backward-compat)
  if (user.roles?.length) {
    const priorities: AppRole[] = ['admin', 'partner', 'storeOperator', 'client'];
    for (const r of priorities) {
      if (user.roles.some((role) => role.name.toLowerCase() === r.toLowerCase())) return r;
    }
    return user.roles[0].name.toLowerCase() as AppRole;
  }

  return null;
};

/* ------------------------------------------------------------------ */
/*  Store                                                              */
/* ------------------------------------------------------------------ */
export const useAuthStore = create<AuthStore>((set, get) => ({
  // Initial state
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  role: null,
  hasOnboarded: false,
  isHydrating: true,

  /* ----- actions -------------------------------------------------- */

  setSession: async (tokens, user) => {
    await Promise.all([
      SecureStoreAdapter.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken),
      SecureStoreAdapter.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken),
      SecureStoreAdapter.setItemAsync(STORAGE_KEYS.USER, JSON.stringify(user)),
    ]);

    set({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user,
      isAuthenticated: true,
      role: primaryRole(user),
    });
  },

  setUser: (user) => {
    // Fire-and-forget persist
    SecureStoreAdapter.setItemAsync(STORAGE_KEYS.USER, JSON.stringify(user)).catch(
      () => {},
    );
    set({ user, role: primaryRole(user) });
  },

  setAccessToken: async (token) => {
    await SecureStoreAdapter.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, token);
    set({ accessToken: token });
  },

  setTokens: async (accessToken, refreshToken) => {
    await Promise.all([
      SecureStoreAdapter.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, accessToken),
      SecureStoreAdapter.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, refreshToken),
    ]);
    set({ accessToken, refreshToken });
  },

  logout: async () => {
    await Promise.all([
      SecureStoreAdapter.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN),
      SecureStoreAdapter.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN),
      SecureStoreAdapter.deleteItemAsync(STORAGE_KEYS.USER),
    ]).catch(() => {});

    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      role: null,
    });
  },

  completeOnboarding: async () => {
    await SecureStoreAdapter.setItemAsync(STORAGE_KEYS.HAS_ONBOARDED, 'true');
    set({ hasOnboarded: true });
  },

  hydrate: async () => {
    try {
      const [accessToken, refreshToken, userJson, onboarded] =
        await Promise.all([
          SecureStoreAdapter.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN),
          SecureStoreAdapter.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN),
          SecureStoreAdapter.getItemAsync(STORAGE_KEYS.USER),
          SecureStoreAdapter.getItemAsync(STORAGE_KEYS.HAS_ONBOARDED),
        ]);

      const cachedUser: UserProfile | null = userJson
        ? JSON.parse(userJson)
        : null;

      // Set cached data immediately so the app can render
      set({
        accessToken,
        refreshToken,
        user: cachedUser,
        isAuthenticated: !!(accessToken && cachedUser),
        role: primaryRole(cachedUser),
        hasOnboarded: onboarded === 'true',
        isHydrating: false,
      });

      // If we have a token, refresh the profile from the server
      // to ensure role and user data are always up-to-date
      if (accessToken && cachedUser) {
        try {
          const response = await authApi.getProfile();
          const freshUser = response.data;
          if (freshUser) {
            await SecureStoreAdapter.setItemAsync(
              STORAGE_KEYS.USER,
              JSON.stringify(freshUser),
            );
            set({ user: freshUser, role: primaryRole(freshUser) });
          }
        } catch {
          // If the token is expired the interceptor will handle refresh
          // or logout — no action needed here
        }
      }
    } catch {
      set({ isHydrating: false });
    }
  },
}));
