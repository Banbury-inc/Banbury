import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../frontend'),
      'frontend': path.resolve(__dirname, '../frontend'),
      'backend': path.resolve(__dirname, '../backend'),
    }
  },
  esbuild: {
    jsxInject: `import React from 'react'`,
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  }
})

