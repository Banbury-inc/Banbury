/**
 * Copies Mapbox GL CSP worker into `public/` so `workerUrl` can be same-origin as the app.
 * Run from `postinstall` so the file stays aligned with the installed `mapbox-gl` version.
 */
const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..')
const src = path.join(root, 'node_modules', 'mapbox-gl', 'dist', 'mapbox-gl-csp-worker.js')
const dest = path.join(root, 'public', 'mapbox-gl-csp-worker.js')

if (!fs.existsSync(src)) {
  console.warn('[sync-mapbox-worker] mapbox-gl not installed yet, skipping worker copy')
  process.exit(0)
}

fs.mkdirSync(path.dirname(dest), { recursive: true })
fs.copyFileSync(src, dest)
console.log('[sync-mapbox-worker] synced public/mapbox-gl-csp-worker.js from mapbox-gl')
