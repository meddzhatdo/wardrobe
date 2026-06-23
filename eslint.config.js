import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', '.claude/']),
  {
    files: ['**/*.{js,jsx}'],
    plugins: {
      'react-hooks': reactHooks,
    },
    extends: [
      js.configs.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // Core React hooks rules only — skip the React Compiler rules added in v7
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      // Non-blocking: common patterns in this codebase that aren't real bugs
      'no-empty': ['error', { allowEmptyCatch: true }],
      'no-unused-vars': 'warn',
      'react-refresh/only-export-components': 'warn',
    },
  },
  // Node.js globals for API handlers and tests
  {
    files: ['api/**/*.{js,jsx}'],
    languageOptions: {
      globals: globals.node,
    },
  },
  // Chrome extension globals
  {
    files: ['extension/**/*.{js,jsx}'],
    languageOptions: {
      globals: globals.webextensions,
    },
  },
])
