import { buildRainViewerRadarTilesTemplate } from './fetchRainViewerRadarTileUrl'
import type { RainViewerRadarFrame } from './fetchRainViewerRadarTileUrl'

const RAINVIEWER_MAX_ZOOM = 7

function clampRadarZoom(z: number): number {
  return Math.max(0, Math.min(RAINVIEWER_MAX_ZOOM, Math.floor(z)))
}

/** Web Mercator tile containing the point at zoom `z`. */
function lngLatToRadarTileXY(lng: number, lat: number, z: number): { x: number; y: number } {
  const scale = 2 ** z
  const x = Math.floor(((lng + 180) / 360) * scale)
  const latRad = (lat * Math.PI) / 180
  const worldY = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * scale
  const y = Math.floor(worldY)
  return { x, y }
}

function instantiateRadarTileUrl(template: string, z: number, x: number, y: number): string {
  return template.replaceAll('{z}', String(z)).replaceAll('{x}', String(x)).replaceAll('{y}', String(y))
}

function collectPreloadUrlsForFrame(
  template: string,
  lng: number,
  lat: number,
  zoom: number,
  gridRadius: number,
): string[] {
  const z = clampRadarZoom(zoom)
  const { x: cx, y: cy } = lngLatToRadarTileXY(lng, lat, z)
  const scale = 2 ** z
  const urls: string[] = []
  for (let dy = -gridRadius; dy <= gridRadius; dy++) {
    for (let dx = -gridRadius; dx <= gridRadius; dx++) {
      const x = cx + dx
      const y = cy + dy
      if (x < 0 || y < 0 || x >= scale || y >= scale) continue
      urls.push(instantiateRadarTileUrl(template, z, x, y))
    }
  }
  return urls
}

function preloadImage(url: string, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException('Aborted', 'AbortError'))
      return
    }
    const img = new Image()
    const onAbort = () => {
      cleanup()
      img.src = ''
      reject(new DOMException('Aborted', 'AbortError'))
    }
    function cleanup() {
      signal.removeEventListener('abort', onAbort)
      img.onload = null
      img.onerror = null
    }
    signal.addEventListener('abort', onAbort, { once: true })
    img.onload = () => {
      cleanup()
      resolve()
    }
    img.onerror = () => {
      cleanup()
      resolve()
    }
    img.src = url
  })
}

async function drainUrlQueue(urls: string[], maxConcurrent: number, signal: AbortSignal): Promise<void> {
  if (!urls.length) return
  const queue = [...urls]
  const worker = async () => {
    while (queue.length) {
      if (signal.aborted) return
      const url = queue.shift()
      if (!url) return
      try {
        await preloadImage(url, signal)
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') return
      }
    }
  }
  const n = Math.max(1, Math.min(maxConcurrent, urls.length || 1))
  await Promise.all(Array.from({ length: n }, () => worker()))
}

export interface PreloadRainViewerRadarFramesParams {
  host: string
  timeline: RainViewerRadarFrame[]
  tileSize: 256 | 512
  center: { lng: number; lat: number }
  zoom: number
  /** 0 = center tile only; 1 = 3×3 around viewport center (default). */
  gridRadius?: number
  maxConcurrent?: number
  signal: AbortSignal
}

/** Warm HTTP cache for RainViewer tiles Mapbox will request while animating radar frames. */
export async function preloadRainViewerRadarFrames(params: PreloadRainViewerRadarFramesParams): Promise<void> {
  const { host, timeline, tileSize, center, zoom, signal } = params
  const gridRadius = params.gridRadius ?? 1
  const maxConcurrent = params.maxConcurrent ?? 8
  if (!timeline.length || signal.aborted) return

  const urls: string[] = []
  for (const frame of timeline) {
    if (!frame?.path) continue
    if (signal.aborted) return
    const template = buildRainViewerRadarTilesTemplate(host, frame.path, { tileSize })
    urls.push(...collectPreloadUrlsForFrame(template, center.lng, center.lat, zoom, gridRadius))
  }

  await drainUrlQueue(urls, maxConcurrent, signal)
}
