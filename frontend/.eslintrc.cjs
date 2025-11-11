module.exports = {
  root: true,
  env: { 
    browser: true, 
    es2020: true, 
    node: true 
  },
  extends: [
    'eslint:recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs', 'vite.config.ts'],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'react-refresh'],
  globals: {
    NodeJS: 'readonly',
    RequestInit: 'readonly',
    ImportMeta: 'writable',
    global: 'writable',
    process: 'readonly',
    screen: 'readonly',
    Notification: 'readonly'
  },
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
    'no-undef': 'error',
    'no-unused-vars': 'warn',
    'no-redeclare': 'warn'
  },
}