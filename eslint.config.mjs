import js from '@eslint/js'
import globals from 'globals'

export default [
  {
    ignores: ['.netlify/**', 'dist/**', 'dev/**'],
  },
  js.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        global: 'writable',
        chrome: 'readonly',
      },
      // parserOptions: {
      //   projectService: true,
      //   tsconfigRootDir: import.meta.dirname,
      // },
    },
  },
]
