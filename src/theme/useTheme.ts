import { useThemeMode } from '@/context/ThemeContext';
import { themes, type Theme } from './theme';

export function useTheme(): Theme {
  const { colorScheme } = useThemeMode();
  return themes[colorScheme];
}
