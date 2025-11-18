module.exports = {
  root: true,
  env: { 
    browser: true, 
    es2020: true, 
    node: true 
  },
  extends: [
    'eslint:recommended',
<<<<<<< HEAD
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs', 'vite.config.ts'],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'react-refresh'],
=======
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs', 'vite.config.ts'],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'react-refresh', 'react', 'react-hooks'],
>>>>>>> 238a3aa (chore: initial commit - production build, type safety, and cleanup (Nov 17, 2025))
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
<<<<<<< HEAD
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    'no-undef': 'off',
    'no-unused-vars': 'off',
    'no-redeclare': 'warn'
=======
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
    'no-undef': 'off',
    'no-unused-vars': 'off',
    'no-redeclare': 'warn',
    'react-hooks/exhaustive-deps': 'warn',
    'no-empty': ['warn', { 'allowEmptyCatch': true }],
  },
  settings: {
    react: {
      version: 'detect',
    },
>>>>>>> 238a3aa (chore: initial commit - production build, type safety, and cleanup (Nov 17, 2025))
  },
}