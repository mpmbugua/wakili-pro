module.exports = {
  root: true,
  env: { 
    browser: true, 
    es2020: true, 
    node: true 
  },
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs', 'vite.config.ts'],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
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
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
    'no-undef': 'error',
    'no-unused-vars': 'warn',
    'no-redeclare': 'warn'
  },
}