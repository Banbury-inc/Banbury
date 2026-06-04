import type mapboxgl from 'mapbox-gl'
import type { RasterTileSource } from 'mapbox-gl'

/** Must match `radarSourceId` in handleMapLayerChange.ts */
const RADAR_SOURCE_ID = 'banbury-radar'

export function setRainViewerRadarTilesTemplate(
  map: mapboxgl.Map | null,
  template: string | null,
): boolean {
  if (!template) return false

  const mapInstance = map
  if (!mapInstance?.isStyleLoaded()) return false

  const source = mapInstance.getSource(RADAR_SOURCE_ID) as RasterTileSource | undefined
  if (source?.type !== 'raster') return false

  try {
    source.setTiles([template])
    // Force raster tiles to reload; otherwise some GL setups keep showing tiles from earlier frames.
    source.reload()
    return true
  } catch {
    return false
  }
}

/** Cleared when radar overlay is removed; reserved for future tile URL cache. */
export function clearRainViewerRadarTilesTemplateCache(): void {
  /* no-op */
}
