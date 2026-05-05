import { useColorScheme } from 'react-native';
import { themes, type Theme } from './theme';

export function useTheme(): Theme {
  const scheme = useColorScheme();
  return themes[scheme === 'dark' ? 'dark' : 'light'];
}
