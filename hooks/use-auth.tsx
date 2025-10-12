import { AuthService, PublicUser } from '@/services/auth.service';
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

type AuthUser = PublicUser;

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  signIn: (params: { email: string; password: string }) => Promise<void>;
  signUp: (params: { email: string; password: string; name?: string }) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(false);

  const signIn = useCallback(async ({ email, password }: { email: string; password: string }) => {
    setLoading(true);
    try {
      if (!email || !password) {
        throw new Error('MISSING_CREDENTIALS');
      }
      const authenticatedUser = await AuthService.signIn(email, password);
      setUser(authenticatedUser);
    } catch (error) {
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const signUp = useCallback(async ({ email, password, name }: { email: string; password: string; name?: string }) => {
    setLoading(true);
    try {
      if (!email || !password) {
        throw new Error('MISSING_CREDENTIALS');
      }
      const newUser = await AuthService.signUp(email, password, name);
      setUser(newUser);
    } catch (error) {
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, signIn, signUp, signOut }),
    [user, loading, signIn, signUp, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};


