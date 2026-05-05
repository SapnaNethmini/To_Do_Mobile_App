// Sprint 1 stub. Real implementation (mode persistence + override) lands in Sprint 5.
// For now, tracks the system color scheme via useColorScheme().

import { createContext, useContext, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

type ThemeContextValue = {
  scheme: 'light' | 'dark';
};

const ThemeCtx = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const scheme: 'light' | 'dark' = system === 'dark' ? 'dark' : 'light';
  return <ThemeCtx.Provider value={{ scheme }}>{children}</ThemeCtx.Provider>;
}

export function useThemeMode(): ThemeContextValue {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error('useThemeMode must be used inside <ThemeProvider>');
  return ctx;
}
