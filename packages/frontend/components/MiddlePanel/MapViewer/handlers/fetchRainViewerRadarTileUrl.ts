/** RainViewer public Weather Maps API — see https://www.rainviewer.com/api/weather-maps-api.html */

export const RAINVIEWER_WEATHER_MAPS_URL = 'https://api.rainviewer.com/public/weather-maps.json'

const DEFAULT_RADAR_COLOR_SCHEME = 2

export interface RainViewerRadarFrame {
  time: number
  path: string
}

export interface RainViewerWeatherMapsResult {
  version?: string
  generated: number
  host: string
  pastFrames: RainViewerRadarFrame[]
  nowcastFrames: RainViewerRadarFrame[]
}

interface RainViewerWeatherMapsResponse {
  version?: string
  generated?: number
  host?: string
  radar?: {
    past?: RainViewerRadarFrame[]
    nowcast?: RainViewerRadarFrame[]
  }
}

export interface BuildRainViewerRadarTilesOptions {
  tileSize: number
  colorScheme?: number
  smooth?: 0 | 1
  snow?: 0 | 1
  /**
   * When true (default in the browser), tile URLs use `/rainviewer-tiles/...` so Next.js can
   * rewrite to RainViewer’s CDN. The CDN does not send CORS headers; Mapbox GL loads tiles in a
   * way that triggers the browser CORS check when the template is absolute cross-origin.
   */
  useSameOriginTileProxy?: boolean
}

export function getRainViewerPreferredTileSize(): 256 | 512 {
  if (typeof window === 'undefined') return 256
  return window.devicePixelRatio >= 2 ? 512 : 256
}

function normalizeRadarOptions(smooth: 0 | 1, snow: 0 | 1): string {
  return `${smooth}_${snow}`
}

function shouldUseRainViewerTileProxy(options: { useSameOriginTileProxy?: boolean }): boolean {
  if (options.useSameOriginTileProxy === false) return false
  if (options.useSameOriginTileProxy === true) return true
  return typeof window !== 'undefined'
}

export function buildRainViewerRadarTilesTemplate(
  host: string,
  framePath: string,
  options: BuildRainViewerRadarTilesOptions,
): string {
  const normalizedPath = framePath.startsWith('/') ? framePath : `/${framePath}`
  const zxy = '{z}/{x}/{y}'
  const colorScheme = options.colorScheme ?? DEFAULT_RADAR_COLOR_SCHEME
  const smooth = options.smooth ?? 1
  const snow = options.snow ?? 1
  const tail = `/${options.tileSize}/${zxy}/${colorScheme}/${normalizeRadarOptions(smooth, snow)}.png`
  if (shouldUseRainViewerTileProxy(options))
    return `/rainviewer-tiles${normalizedPath}${tail}`
  const normalizedHost = host.replace(/\/$/, '')
  return `${normalizedHost}${normalizedPath}${tail}`
}

export function buildRainViewerCoverageTilesTemplate(
  host: string,
  tileSize: number,
  options?: Pick<BuildRainViewerRadarTilesOptions, 'useSameOriginTileProxy'>,
): string {
  const zxy = '{z}/{x}/{y}'
  const path = `/v2/coverage/0/${tileSize}/${zxy}/0/0_0.png`
  if (shouldUseRainViewerTileProxy(options ?? {}))
    return `/rainviewer-tiles${path}`
  const normalizedHost = host.replace(/\/$/, '')
  return `${normalizedHost}${path}`
}

/** Merged past + nowcast, sorted by `time`, deduped by `path`.
 *  Dedupe must use `path` (unique per mosaic), not `time`: RainViewer nowcast/past can repeat the same
 *  UNIX `time` for multiple frames; using `time` as the Map key collapses the timeline to a handful of entries.
 */
export function buildRainViewerRadarTimeline(
  pastFrames: RainViewerRadarFrame[],
  nowcastFrames: RainViewerRadarFrame[],
): RainViewerRadarFrame[] {
  const byPath = new Map<string, RainViewerRadarFrame>()
  for (const frame of [...pastFrames, ...nowcastFrames]) {
    if (!frame?.path || !Number.isFinite(frame.time)) continue
    byPath.set(frame.path, frame)
  }
  return [...byPath.values()].sort((a, b) => a.time - b.time)
}

export async function fetchRainViewerWeatherMaps(): Promise<RainViewerWeatherMapsResult | null> {
  let response: Response
  try {
    response = await fetch(RAINVIEWER_WEATHER_MAPS_URL)
  } catch {
    return null
  }

  if (!response.ok) return null

  let data: RainViewerWeatherMapsResponse
  try {
    data = (await response.json()) as RainViewerWeatherMapsResponse
  } catch {
    return null
  }

  if (!data.host || typeof data.host !== 'string') return null

  const pastFrames = Array.isArray(data.radar?.past) ? data.radar.past.filter(f => f?.path) : []
  const nowcastFrames = Array.isArray(data.radar?.nowcast) ? data.radar.nowcast.filter(f => f?.path) : []

  if (!pastFrames.length && !nowcastFrames.length) return null

  const generated = typeof data.generated === 'number' ? data.generated : 0

  return {
    version: data.version,
    generated,
    host: data.host,
    pastFrames,
    nowcastFrames,
  }
}

/** Latest composite URL using most recent frame in `past` only (RainViewer convention for “current” mosaic). */
export async function fetchRainViewerRadarTilesTemplate(): Promise<string | null> {
  const data = await fetchRainViewerWeatherMaps()
  if (!data) return null

  const past = data.pastFrames
  if (!past.length) return null

  const latest = past[past.length - 1]
  const tileSize = getRainViewerPreferredTileSize()
  return buildRainViewerRadarTilesTemplate(data.host, latest.path, { tileSize })
}
