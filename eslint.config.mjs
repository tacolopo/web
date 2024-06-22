import url from 'node:url';
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

import { fixupPluginRules } from '@eslint/compat';

import pluginReact from 'eslint-plugin-react';
import pluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import pluginReactHooks from 'eslint-plugin-react-hooks';

import pluginTurbo from 'eslint-plugin-turbo';
import pluginVitest from 'eslint-plugin-vitest';
import pluginStorybook from 'eslint-plugin-storybook';

import pluginImportX from 'eslint-plugin-import-x';

import pluginTailwind from 'eslint-plugin-tailwindcss';

// @ts-check
export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parser: tseslint.parser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        project: true,
      },
    },
  },

  {
    plugins: { 'import-x': pluginImportX },
    settings: {
      'import-x/parsers': { '@typescript-eslint/parser': ['.ts', '.tsx'] },
      'import-x/resolver': {
        node: true,
        typescript: {
          project: ['./packages/*/tsconfig.json', './apps/*/tsconfig.json'],
        },
      },
    },
    rules: {
      ...pluginImportX.configs.recommended.rules,
      // broken rules until import suppports v9
      'import-x/default': 'off',
      'import-x/namespace': 'off',
      'import-x/no-named-as-default-member': 'off',
      'import-x/no-named-as-default': 'off',
    },
  },

  {
    plugins: { turbo: pluginTurbo },
    rules: { ...pluginTurbo.configs.recommended.rules },
  },

  {
    files: ['**/*.stories.tsx'],
    plugins: { storybook: pluginStorybook },
    rules: { ...pluginStorybook.configs.recommended.rules },
  },

  {
    files: ['**/*.{jsx,tsx}'],
    plugins: {
      react: pluginReact,
      'react-hooks': fixupPluginRules(pluginReactHooks),
    },
    settings: {
      react: { version: '18' },
    },
    rules: {
      ...pluginReact.configs.recommended.rules,
      ...pluginReactHooks.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
    },
  },

  {
    // rules to which we should aspire
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-redeclare': 'off',
      '@typescript-eslint/no-shadow': 'off',
      'array-callback-return': 'off',
      'class-methods-use-this': 'off',
      'consistent-return': 'off',
      'consistent-this': 'off',
      'func-name-matching': 'off',
      'no-await-in-loop': 'off',
      'no-bitwise': 'off',
      'no-console': 'off',
      'no-continue': 'off',
      'no-nested-ternary': 'off',
      'no-param-reassign': 'off',
      'no-plusplus': 'off',
      'no-promise-executor-return': 'off', //['warn', { allowVoid: true }],
      'no-template-curly-in-string': 'off',
      'no-unreachable-loop': 'off',
      'no-warning-comments': 'off',
      'spaced-comment': 'off',
      complexity: 'off',
    },
  },

  {
    // import rules to which we should aspire
    rules: {
      '@typescript-eslint/consistent-type-imports': 'off',
      'import-x/named': 'off',
      'import-x/order': 'off',
    },
  },

  {
    files: ['**/*.{jsx,tsx}'],
    rules: {
      'react-hooks/exhaustive-deps': 'warn',
      'react-hooks/rules-of-hooks': 'warn',

      // jsx rules to which we should aspire
      'react/jsx-no-useless-fragment': 'off',
      'react/jsx-no-literals': 'off',
    },
  },

  {
    // for existing style in all files
    rules: {
      '@typescript-eslint/no-confusing-void-expression': ['error', { ignoreArrowShorthand: true }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-invalid-void-type': 'off', // this one is often wrong
      '@typescript-eslint/no-unnecessary-condition': [
        'error',
        { allowConstantLoopConditions: true },
      ],
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      'import-x/first': 'error',
      'import-x/no-relative-packages': 'error',
      'import-x/no-self-import': 'error',
      'import-x/no-useless-path-segments': ['error', { noUselessIndex: true }],
      'no-restricted-globals': [
        'error',
        { message: 'Use `globalThis` instead.', name: 'global' },
        { message: 'Use `globalThis` instead.', name: 'self' },
      ],
      'no-self-assign': ['error', { props: true }],
      'prefer-regex-literals': ['error', { disallowRedundantWrapping: true }],
      eqeqeq: ['error', 'smart'],
    },
  },

  // disables eslint rules that ts doesn't need
  tseslint.configs.eslintRecommended,
  // disables type rules in js files
  {
    files: ['**/*.js', '**/*.jsx', '**/*.mjs', '**/*.cjs'],
    extends: [tseslint.configs.disableTypeChecked],
  },

  // custom rule to forbid untyped 'let' declarations
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "VariableDeclaration[kind = 'let'] > VariableDeclarator[init = null]:not([id.typeAnnotation])",
          message: 'Type must be annotated at variable declaration',
        },
      ],
    },
  },

  // test config
  {
    files: ['**/*.test.ts', '**/*.test.tsx'],
    plugins: { vitest: pluginVitest },
    rules: {
      ...pluginVitest.configs.recommended.rules,

      // relax rules for tests
      'import-x/no-duplicates': 'off',
      'no-empty': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },

  {
    files: ['**/*.jsx', '**/*.tsx'],
    plugins: { tailwindcss: pluginTailwind },
    settings: {
      tailwindcss: { config: url.fileURLToPath(import.meta.resolve('@repo/tailwind-config')) },
    },
    rules: {
      ...pluginTailwind.configs.recommended.rules,
      'tailwindcss/no-custom-classname': [
        'error',
        { callees: ['cn', 'cva'], whitelist: ['toaster'] },
      ],
    },
  },

  // disable rules that prettier will handle
  pluginPrettierRecommended,

  //{ rules: { curly: ['error', 'all'] } },
);
