import { defineConfig } from 'vitest/config'
import { crx, ManifestV3Export } from '@crxjs/vite-plugin'

import manifest from './manifest.json'
import pkg from './package.json'

console.log('process.env', process.env.DEV === 'true')
const isDev = process.env.DEV === 'true'

const extensionManifest = {
  ...manifest,
  name: isDev ? `DEV: ${manifest.name}` : manifest.name,
  version: pkg.version,
}

export default defineConfig({
  plugins: [
    crx({
      manifest: extensionManifest as ManifestV3Export,
    }),
  ],
  build: {
    outDir: isDev ? 'dev' : 'dist',
  },
  test: {
    coverage: {
      reporter: ['cobertura', 'html', 'text', 'text-summary'],
    },
    globals: true, // Allows you to use 'describe' and 'it' without importing them
    environment: 'happy-dom', // Simulates the browser environment
  },
})
