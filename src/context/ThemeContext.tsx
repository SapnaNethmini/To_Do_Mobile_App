import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'system' | 'light' | 'dark';

type ThemeContextValue = {
  mode: ThemeMode;
  colorScheme: 'light' | 'dark';
  setMode: (mode: ThemeMode) => void;
};

const STORAGE_KEY = 'todo.theme';

const ThemeCtx = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    void AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        setModeState(stored);
      }
      setHydrated(true);
    });
  }, []);

  function setMode(next: ThemeMode) {
    setModeState(next);
    void AsyncStorage.setItem(STORAGE_KEY, next);
  }

  const colorScheme: 'light' | 'dark' =
    mode === 'system' ? (system === 'dark' ? 'dark' : 'light') : mode;

  if (!hydrated) return null;

  return (
    <ThemeCtx.Provider value={{ mode, colorScheme, setMode }}>
      {children}
    </ThemeCtx.Provider>
  );
}

export function useThemeMode(): ThemeContextValue {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error('useThemeMode must be used inside <ThemeProvider>');
  return ctx;
}
