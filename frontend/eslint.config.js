import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'public', 'dev-dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      // This codebase carries a large amount of pre-existing `any` usage and
      // unused imports. Both are downgraded to warnings so `npm run lint` is
      // usable today and surfaces the debt, rather than emitting hundreds of
      // errors that would just be ignored. Tighten these to "error" once the
      // existing warnings have been worked through.
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' },
      ],

      // eslint-plugin-react-hooks v7 ships the React Compiler rules. They are
      // valuable but flag a large number of pre-existing patterns here, and
      // resolving them means real component refactors rather than mechanical
      // edits - so they report as warnings for now. The two genuinely
      // correctness-critical hook rules stay errors: rules-of-hooks caught an
      // actual crash bug in ProfileSection (a useState placed after an early
      // return), and exhaustive-deps guards against stale closures.
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/static-components': 'warn',

      // Ternary-as-statement is used deliberately in a few places for concise
      // side effects (e.g. Set add/delete toggles); not worth churning.
      '@typescript-eslint/no-unused-expressions': 'warn',
    },
  }
);
