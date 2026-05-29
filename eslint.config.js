import js from '@eslint/js'
import globals from 'globals'
import reactPlugin from 'eslint-plugin-react'
import reactHooksPlugin from 'eslint-plugin-react-hooks'

export default [
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx}'],
    ignores: ['dist/**', 'node_modules/**'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2022,
        ...globals.node,
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react/display-name': 'off',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', destructuredArrayIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
      // react-hooks v7 strict rules: off — conflict with intentional ref-over-state
      // pattern in App.jsx (documented in CLAUDE.md) and Math.random in animations
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/refs': 'off',
      // empty catch blocks are intentional in tts.js / useSpeechRecognition.js
      'no-empty': ['error', { allowEmptyCatch: true }],
      // prose text in JSX contains natural quotes; escaping adds noise
      'react/no-unescaped-entities': 'off',
    },
    settings: {
      react: { version: 'detect' },
    },
  },
  {
    // Test files can use Vitest globals
    files: ['src/**/*.test.{js,jsx}'],
    languageOptions: {
      globals: { ...globals.browser, describe: true, it: true, expect: true, beforeEach: true },
    },
  },
]
