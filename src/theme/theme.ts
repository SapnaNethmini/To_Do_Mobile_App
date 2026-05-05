import { palette } from './palette';

export type Theme = {
  bg: string;
  surface: string;
  surfaceMuted: string;
  border: string;
  borderStrong: string;
  text: string;
  textMuted: string;
  textSubtle: string;
  primary: string;
  primaryGradient: readonly [string, string];
  primaryRing: string;
  danger: string;
  dangerBg: string;
  dangerBorder: string;
  success: string;
  successBg: string;
  successBorder: string;
};

const light: Theme = {
  bg: '#bbb8b8',
  surface: '#ffffff',
  surfaceMuted: palette.slate[50],
  border: palette.slate[200],
  borderStrong: palette.slate[300],
  text: palette.slate[900],
  textMuted: palette.slate[600],
  textSubtle: palette.slate[400],
  primary: palette.indigo[600],
  primaryGradient: [palette.indigo[600], palette.violet[600]],
  primaryRing: 'rgba(99,102,241,0.30)',
  danger: palette.red[700],
  dangerBg: palette.red[50],
  dangerBorder: palette.red[200],
  success: palette.emerald[700],
  successBg: palette.emerald[50],
  successBorder: palette.emerald[200],
};

const dark: Theme = {
  bg: '#000000',
  surface: 'rgba(30,41,59,0.80)',
  surfaceMuted: palette.slate[800],
  border: palette.slate[700],
  borderStrong: palette.slate[600],
  text: palette.slate[200],
  textMuted: palette.slate[300],
  textSubtle: palette.slate[500],
  primary: palette.indigo[400],
  primaryGradient: [palette.indigo[500], palette.violet[500]],
  primaryRing: 'rgba(129,140,248,0.30)',
  danger: palette.red[300],
  dangerBg: 'rgba(69,10,10,0.40)',
  dangerBorder: 'rgba(127,29,29,0.60)',
  success: palette.emerald[300],
  successBg: 'rgba(2,44,34,0.40)',
  successBorder: palette.emerald[800],
};

export const themes = { light, dark } as const;
