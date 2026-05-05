// Source of truth: ../To_do_web/client/tailwind.config.cjs and client/src/index.css.
// Web uses vanilla Tailwind defaults (Slate / Indigo / Violet / Emerald / Red) +
// component recipes (.btn, .card, .badge, .input). Mobile mirrors the palette
// and recipe shapes; utility classes are not used on mobile.

export const palette = {
  slate: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617',
  },
  indigo: {
    200: '#c7d2fe',
    300: '#a5b4fc',
    400: '#818cf8',
    500: '#6366f1',
    600: '#4f46e5',
    700: '#4338ca',
    800: '#3730a3',
    950: '#1e1b4b',
  },
  violet: {
    500: '#8b5cf6',
    600: '#7c3aed',
  },
  emerald: {
    50: '#ecfdf5',
    200: '#a7f3d0',
    300: '#6ee7b7',
    700: '#047857',
    800: '#065f46',
    950: '#022c22',
  },
  red: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
    950: '#450a0a',
  },
} as const;
