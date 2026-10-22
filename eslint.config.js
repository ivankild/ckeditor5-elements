import js from '@eslint/js';
import prettier from 'eslint-config-prettier/flat';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig(
	globalIgnores(['**/dist/', '**/node_modules/', 'docs/api/', 'docs/.vitepress/cache/']),
	js.configs.recommended,
	tseslint.configs.strictTypeChecked,
	tseslint.configs.stylisticTypeChecked,
	{
		languageOptions: {
			globals: globals.browser,
			parserOptions: {
				projectService: true,
				tsconfigRootDir: import.meta.dirname
			}
		}
	},
	prettier,
	{
		rules: {
			curly: ['error', 'all'],
			eqeqeq: ['error', 'always'],
			'no-console': 'error',
			'prefer-const': 'error',
			'object-shorthand': 'error'
		}
	},
	{
		files: ['**/*.ts'],
		rules: {
			'@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
			'@typescript-eslint/consistent-type-exports': 'error',
			'@typescript-eslint/explicit-member-accessibility': ['error', { overrides: { constructors: 'no-public' } }],
			'@typescript-eslint/explicit-function-return-type': ['error', { allowExpressions: true }],
			'@typescript-eslint/switch-exhaustiveness-check': 'error'
		}
	},
	{
		files: ['**/*.js'],
		extends: [tseslint.configs.disableTypeChecked]
	},
	{
		// Tests may assert that values exist, e.g. elements of rendered views.
		files: ['**/tests/**/*.ts'],
		rules: {
			'@typescript-eslint/no-non-null-assertion': 'off'
		}
	}
);
