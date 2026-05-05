// Sprint 1 stub. Real implementation lands in Sprint 3 (spec §11, blueprint §10.2).
// Exposes a fake toggle so the navigation gating in Sprint 1 Task 8 is testable.

import { createContext, useContext, useState, type ReactNode } from 'react';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

type AuthContextValue = {
  status: AuthStatus;
  fakeLogin: () => void;
  fakeLogout: () => void;
};

const AuthCtx = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('unauthenticated');

  const value: AuthContextValue = {
    status,
    fakeLogin: () => setStatus('authenticated'),
    fakeLogout: () => setStatus('unauthenticated'),
  };

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
