const expoConfig = require('eslint-config-expo/flat');
const tsPlugin = require('@typescript-eslint/eslint-plugin');

module.exports = [
  ...expoConfig,
  {
    ignores: ['node_modules', '.expo', 'dist', 'web-build', 'ios', 'android'],
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
];
