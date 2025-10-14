import { AuthService, LoginRequest, PublicUser, RegisterRequest } from '@/services/auth.service';
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

type AuthUser = PublicUser;

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  signIn: (params: LoginRequest) => Promise<void>;
  signUp: (params: RegisterRequest) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(false);

  const signIn = useCallback(async (loginData: LoginRequest) => {
    setLoading(true);
    try {
      if (!loginData.email || !loginData.password) {
        throw new Error('MISSING_CREDENTIALS');
      }
      const authenticatedUser = await AuthService.signIn(loginData);
      setUser(authenticatedUser);
    } catch (error) {
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const signUp = useCallback(async (registerData: RegisterRequest) => {
    setLoading(true);
    try {
      if (!registerData.email || !registerData.password) {
        throw new Error('MISSING_CREDENTIALS');
      }
      const newUser = await AuthService.signUp(registerData);
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


