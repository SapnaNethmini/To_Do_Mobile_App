import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { authApi } from '@/api/auth.api';
import { tokenStorage } from '@/services/token.storage';
import { queryClient } from '@/config/queryClient';
import type { User } from '@/types/user';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

type AuthContextValue = {
  status: AuthStatus;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (input: { username: string; email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthCtx = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    void (async () => {
      const token = await tokenStorage.get();
      if (!token) {
        setStatus('unauthenticated');
        return;
      }
      try {
        const me = await authApi.me();
        setUser(me);
        setStatus('authenticated');
      } catch {
        await tokenStorage.clear();
        setStatus('unauthenticated');
      }
    })();
  }, []);

  const login: AuthContextValue['login'] = async (email, password) => {
    const { user: loggedInUser, token } = await authApi.login({ email, password });
    await tokenStorage.set(token);
    setUser(loggedInUser);
    setStatus('authenticated');
  };

  const register: AuthContextValue['register'] = async (input) => {
    await authApi.register(input);
    await login(input.email, input.password);
  };

  const logout: AuthContextValue['logout'] = async () => {
    try {
      await authApi.logout();
    } catch {
      // best-effort — always clear local state
    }
    await tokenStorage.clear();
    queryClient.clear();
    setUser(null);
    setStatus('unauthenticated');
  };

  return (
    <AuthCtx.Provider value={{ status, user, login, register, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
