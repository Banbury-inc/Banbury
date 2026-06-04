import type { Dispatch, SetStateAction } from 'react'
import type mapboxgl from 'mapbox-gl'
import type { RasterTileSource } from 'mapbox-gl'
import { getMapBasemapOption, mapBasemapOptions, type MapBasemapId, type MapOverlayId } from '../map-layer-options'
import {
  buildRainViewerCoverageTilesTemplate,
  buildRainViewerRadarTilesTemplate,
  buildRainViewerRadarTimeline,
  fetchRainViewerWeatherMaps,
  getRainViewerPreferredTileSize,
} from './fetchRainViewerRadarTileUrl'
import {
  clearRainViewerRadarTilesTemplateCache,
  setRainViewerRadarTilesTemplate,
} from './handleRainViewerRadarTilesUpdate'
import {
  buildTemperatureLayerPaint,
  defaultTemperatureOverlayOpacity,
  defaultTemperatureRasterArrayBand,
  temperatureRasterArrayTilesetUrl,
  temperatureRasterSourceLayer,
} from './temperatureLayerConstants'
import { windParticleLayerPaint } from './windParticleLayerConstants'

export interface ApplyMapLayerSettingsParams {
  map: mapboxgl.Map
  basemapId: MapBasemapId
  activeOverlayIds: MapOverlayId[]
  isDarkTheme: boolean
  temperatureOverlayOpacity?: number
  temperatureRasterArrayBand?: string
}

interface HandleMapBasemapChangeParams extends ApplyMapLayerSettingsParams {
  onStyleLoaded?: () => void
}

interface HandleMapBasemapSelectParams {
  map: mapboxgl.Map | null
  basemapId: string
  activeOverlayIds: MapOverlayId[]
  isDarkTheme: boolean
  setSelectedBasemapId: Dispatch<SetStateAction<MapBasemapId>>
  temperatureOverlayOpacity?: number
  temperatureRasterArrayBand?: string
}

interface HandleMapOverlayToggleParams {
  map: mapboxgl.Map | null
  overlayId: MapOverlayId
  isChecked: boolean
  basemapId: MapBasemapId
  activeOverlayIds: MapOverlayId[]
  isDarkTheme: boolean
  setActiveOverlayIds: Dispatch<SetStateAction<MapOverlayId[]>>
  temperatureOverlayOpacity?: number
  temperatureRasterArrayBand?: string
}

const trafficSourceId = 'banbury-traffic'
const trafficLayerId = 'banbury-traffic-lines'
const terrainSourceId = 'banbury-terrain'
const buildingsLayerId = 'banbury-3d-buildings'
const radarSourceId = 'banbury-radar'
const radarLayerId = 'banbury-radar-layer'
const radarCoverageSourceId = 'banbury-radar-coverage'
const radarCoverageLayerId = 'banbury-radar-coverage-layer'
/** Standard / lit styles dim rasters in night preset; full emissive restores RainViewer colors like light mode. */
const radarRasterEmissiveWhenDark = 1
const radarRasterEmissiveWhenLight = 0
const windRasterArraySourceId = 'banbury-wind-raster-array'
const windParticleLayerId = 'banbury-wind-particles'
const temperatureRasterArraySourceId = 'banbury-temperature-raster-array'
const temperatureRasterLayerId = 'banbury-temperature-raster-layer'
const RADAR_REFRESH_MS = 10 * 60 * 1000

let radarOverlayWanted = false
let radarCoverageWanted = false
let radarSyncGeneration = 0
let radarRefreshIntervalId: ReturnType<typeof setInterval> | null = null
let rainViewerPeriodicRefreshHandler: (() => void) | null = null

function isOverlayActive(activeOverlayIds: MapOverlayId[], overlayId: MapOverlayId) {
  return activeOverlayIds.includes(overlayId)
}

function isMapBasemapId(value: string): value is MapBasemapId {
  return mapBasemapOptions.some(option => option.id === value)
}

function removeLayerIfExists(map: mapboxgl.Map, layerId: string) {
  if (!map.getLayer(layerId)) return
  map.removeLayer(layerId)
}

function removeSourceIfExists(map: mapboxgl.Map, sourceId: string) {
  if (!map.getSource(sourceId)) return
  map.removeSource(sourceId)
}

function getFirstSymbolLayerId(map: mapboxgl.Map) {
  return map.getStyle().layers?.find(layer => layer.type === 'symbol')?.id
}

function applyStandardBasemapConfig({
  map,
  basemapId,
  isDarkTheme,
  isBuildingsActive,
}: Readonly<{
  map: mapboxgl.Map
  basemapId: MapBasemapId
  isDarkTheme: boolean
  isBuildingsActive: boolean
}>) {
  const basemap = getMapBasemapOption(basemapId)
  if (!basemap.supportsLightPreset) return

  try {
    map.setConfigProperty('basemap', 'lightPreset', isDarkTheme ? 'night' : 'day')
    map.setConfigProperty('basemap', 'show3dObjects', isBuildingsActive)
  } catch {
    // Some Mapbox styles do not expose the Standard basemap config API.
  }
}

function applyTrafficOverlay(map: mapboxgl.Map, isActive: boolean) {
  if (!isActive) {
    removeLayerIfExists(map, trafficLayerId)
    removeSourceIfExists(map, trafficSourceId)
    return
  }

  if (!map.getSource(trafficSourceId)) {
    map.addSource(trafficSourceId, {
      type: 'vector',
      url: 'mapbox://mapbox.mapbox-traffic-v1',
    })
  }

  if (map.getLayer(trafficLayerId)) return

  map.addLayer({
    id: trafficLayerId,
    type: 'line',
    source: trafficSourceId,
    'source-layer': 'traffic',
    minzoom: 6,
    paint: {
      'line-color': [
        'match',
        ['get', 'congestion'],
        'low',
        '#22c55e',
        'moderate',
        '#eab308',
        'heavy',
        '#f97316',
        'severe',
        '#ef4444',
        '#64748b',
      ],
      'line-opacity': 0.82,
      'line-width': [
        'interpolate',
        ['linear'],
        ['zoom'],
        6,
        1,
        12,
        3,
        16,
        6,
      ],
    },
  }, getFirstSymbolLayerId(map))
}

function applyTerrainOverlay(map: mapboxgl.Map, isActive: boolean) {
  if (!isActive) {
    map.setTerrain(null)
    removeSourceIfExists(map, terrainSourceId)
    return
  }

  if (!map.getSource(terrainSourceId)) {
    map.addSource(terrainSourceId, {
      type: 'raster-dem',
      url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
      tileSize: 512,
      maxzoom: 14,
    })
  }

  map.setTerrain({ source: terrainSourceId, exaggeration: 1.2 })
}

function applyBuildingsOverlay({
  map,
  basemapId,
  isActive,
}: Readonly<{
  map: mapboxgl.Map
  basemapId: MapBasemapId
  isActive: boolean
}>) {
  const basemap = getMapBasemapOption(basemapId)
  if (basemap.supportsLightPreset) {
    removeLayerIfExists(map, buildingsLayerId)
    return
  }

  if (!isActive) {
    removeLayerIfExists(map, buildingsLayerId)
    return
  }

  if (!map.getSource('composite') || map.getLayer(buildingsLayerId)) return

  map.addLayer({
    id: buildingsLayerId,
    type: 'fill-extrusion',
    source: 'composite',
    'source-layer': 'building',
    minzoom: 15,
    filter: ['==', ['get', 'extrude'], 'true'],
    paint: {
      'fill-extrusion-color': '#94a3b8',
      'fill-extrusion-height': ['coalesce', ['get', 'height'], 0],
      'fill-extrusion-base': ['coalesce', ['get', 'min_height'], 0],
      'fill-extrusion-opacity': 0.58,
    },
  }, getFirstSymbolLayerId(map))
}

function applyTemperatureOverlay(
  map: mapboxgl.Map,
  isActive: boolean,
  options: Readonly<{ opacity: number; rasterArrayBand: string }>,
) {
  if (!isActive) {
    removeLayerIfExists(map, temperatureRasterLayerId)
    removeSourceIfExists(map, temperatureRasterArraySourceId)
    return
  }

  if (!map.getSource(temperatureRasterArraySourceId)) {
    try {
      map.addSource(temperatureRasterArraySourceId, {
        type: 'raster-array',
        url: temperatureRasterArrayTilesetUrl,
        tileSize: 256,
      })
    } catch (error) {
      console.warn('[MapViewer] Temperature raster-array: addSource failed', error)
      return
    }
  }

  const emissive = lastRasterWeatherIsDarkTheme
    ? radarRasterEmissiveWhenDark
    : radarRasterEmissiveWhenLight
  const paint = buildTemperatureLayerPaint({
    opacity: options.opacity,
    rasterArrayBand: options.rasterArrayBand,
    rasterEmissiveStrength: emissive,
  })

  if (map.getLayer(temperatureRasterLayerId)) {
    try {
      map.setPaintProperty(temperatureRasterLayerId, 'raster-opacity', options.opacity)
      map.setPaintProperty(temperatureRasterLayerId, 'raster-array-band', options.rasterArrayBand)
      map.setPaintProperty(temperatureRasterLayerId, 'raster-emissive-strength', emissive)
    } catch {
      // Style may not support a paint property on this layer type.
    }
    return
  }

  const insertBefore = map.getLayer(windParticleLayerId)
    ? windParticleLayerId
    : getFirstSymbolLayerId(map)

  try {
    map.addLayer(
      {
        id: temperatureRasterLayerId,
        type: 'raster',
        source: temperatureRasterArraySourceId,
        'source-layer': temperatureRasterSourceLayer,
        paint,
      },
      insertBefore,
    )
  } catch (error) {
    console.warn('[MapViewer] Temperature: addLayer failed', error)
  }
}

function applyWindParticleOverlay(map: mapboxgl.Map, isActive: boolean) {
  if (!isActive) {
    removeLayerIfExists(map, windParticleLayerId)
    removeSourceIfExists(map, windRasterArraySourceId)
    return
  }

  if (!map.getSource(windRasterArraySourceId)) {
    map.addSource(windRasterArraySourceId, {
      type: 'raster-array',
      url: 'mapbox://rasterarrayexamples.gfs-winds',
      tileSize: 512,
    })
  }

  if (map.getLayer(windParticleLayerId)) return

  const beforeId = getFirstSymbolLayerId(map)

  map.addLayer(
    {
      id: windParticleLayerId,
      type: 'raster-particle',
      source: windRasterArraySourceId,
      'source-layer': '10winds',
      paint: windParticleLayerPaint,
    },
    beforeId,
  )
}

let lastRasterWeatherIsDarkTheme = false

function syncWeatherRasterEmissiveForTheme(
  map: mapboxgl.Map,
  layerId: string,
  isDarkTheme: boolean,
) {
  if (!map.getLayer(layerId)) return

  try {
    map.setPaintProperty(
      layerId,
      'raster-emissive-strength',
      isDarkTheme ? radarRasterEmissiveWhenDark : radarRasterEmissiveWhenLight,
    )
  } catch {
    // Styles without lighting may not support this paint property.
  }
}

function syncRadarRasterEmissiveForTheme(map: mapboxgl.Map, isDarkTheme: boolean) {
  syncWeatherRasterEmissiveForTheme(map, radarLayerId, isDarkTheme)
  syncWeatherRasterEmissiveForTheme(map, radarCoverageLayerId, isDarkTheme)
  syncWeatherRasterEmissiveForTheme(map, temperatureRasterLayerId, isDarkTheme)
}

function clearRadarRefreshInterval() {
  if (radarRefreshIntervalId == null) return
  clearInterval(radarRefreshIntervalId)
  radarRefreshIntervalId = null
}

function ensureRadarRefreshScheduled(map: mapboxgl.Map) {
  if (radarRefreshIntervalId != null) return

  radarRefreshIntervalId = setInterval(() => {
    if (!radarOverlayWanted) {
      clearRadarRefreshInterval()
      return
    }

    let hasSource = false
    try {
      hasSource = map.isStyleLoaded() && !!map.getSource(radarSourceId)
    } catch {
      clearRadarRefreshInterval()
      return
    }

    if (!hasSource) {
      clearRadarRefreshInterval()
      return
    }

    void (async () => {
      if (!radarOverlayWanted) return
      rainViewerPeriodicRefreshHandler?.()
    })()
  }, RADAR_REFRESH_MS)
}

let lastRainViewerRadarHost: string | null = null
let lastRainViewerRadarTileSize: 256 | 512 | null = null

function syncRadarCoverageLayer(map: mapboxgl.Map, host: string, tileSize: 256 | 512) {
  if (!radarCoverageWanted || !radarOverlayWanted) {
    removeLayerIfExists(map, radarCoverageLayerId)
    removeSourceIfExists(map, radarCoverageSourceId)
    return
  }

  if (!map.getLayer(radarLayerId)) return

  const coverageTemplate = buildRainViewerCoverageTilesTemplate(host, tileSize)

  if (!map.getSource(radarCoverageSourceId)) {
    try {
      map.addSource(radarCoverageSourceId, {
        type: 'raster',
        tiles: [coverageTemplate],
        tileSize,
        maxzoom: 7,
      })
    } catch (error) {
      console.warn('[MapViewer] RainViewer radar coverage: addSource failed', error)
      return
    }
  } else {
    const covSource = map.getSource(radarCoverageSourceId) as RasterTileSource | undefined
    if (covSource?.type === 'raster') {
      try {
        covSource.setTiles([coverageTemplate])
      } catch (error) {
        console.warn('[MapViewer] RainViewer radar coverage: setTiles failed', error)
      }
    }
  }

  if (map.getLayer(radarCoverageLayerId)) return

  try {
    map.addLayer(
      {
        id: radarCoverageLayerId,
        type: 'raster',
        source: radarCoverageSourceId,
        paint: {
          'raster-fade-duration': 0,
          'raster-opacity': 0.42,
          'raster-emissive-strength': lastRasterWeatherIsDarkTheme
            ? radarRasterEmissiveWhenDark
            : radarRasterEmissiveWhenLight,
        },
      },
      radarLayerId,
    )
  } catch (error) {
    console.warn('[MapViewer] RainViewer radar coverage: addLayer failed', error)
  }
}

async function syncRainViewerRadarToMap(map: mapboxgl.Map, syncGeneration: number) {
  if (map.getSource(radarSourceId) && map.getLayer(radarLayerId) && radarOverlayWanted) {
    if (lastRainViewerRadarHost != null && lastRainViewerRadarTileSize != null)
      syncRadarCoverageLayer(map, lastRainViewerRadarHost, lastRainViewerRadarTileSize)

    syncRadarRasterEmissiveForTheme(map, lastRasterWeatherIsDarkTheme)
    ensureRadarRefreshScheduled(map)
    return
  }

  const data = await fetchRainViewerWeatherMaps()
  if (syncGeneration !== radarSyncGeneration) return

  if (!data) {
    console.warn('[MapViewer] RainViewer radar: failed to load weather maps')
    return
  }

  if (!radarOverlayWanted) return

  if (!map.isStyleLoaded()) {
    map.once('style.load', () => {
      if (syncGeneration === radarSyncGeneration && radarOverlayWanted)
        void syncRainViewerRadarToMap(map, syncGeneration)
    })
    return
  }

  if (syncGeneration !== radarSyncGeneration) return

  const tileSize = getRainViewerPreferredTileSize()
  const timeline = buildRainViewerRadarTimeline(data.pastFrames, data.nowcastFrames)
  const latestFrame = timeline[timeline.length - 1]
  if (!latestFrame?.path) return

  const template = buildRainViewerRadarTilesTemplate(data.host, latestFrame.path, { tileSize })

  const beforeId = getFirstSymbolLayerId(map)

  if (!map.getSource(radarSourceId)) {
    try {
      map.addSource(radarSourceId, {
        type: 'raster',
        tiles: [template],
        tileSize,
        maxzoom: 7,
      })
      setRainViewerRadarTilesTemplate(map, template)
    } catch (error) {
      console.warn('[MapViewer] RainViewer radar: addSource failed', error)
      return
    }
  } else {
    const source = map.getSource(radarSourceId) as RasterTileSource | undefined
    if (source?.type === 'raster') {
      try {
        setRainViewerRadarTilesTemplate(map, template)
      } catch (error) {
        console.warn('[MapViewer] RainViewer radar: setTiles failed', error)
      }
    }
  }

  if (syncGeneration !== radarSyncGeneration) return
  if (!radarOverlayWanted) return

  if (!map.getLayer(radarLayerId)) {
    try {
      map.addLayer({
        id: radarLayerId,
        type: 'raster',
        source: radarSourceId,
        paint: {
          'raster-fade-duration': 0,
          'raster-opacity': 0.75,
          'raster-emissive-strength': lastRasterWeatherIsDarkTheme
            ? radarRasterEmissiveWhenDark
            : radarRasterEmissiveWhenLight,
        },
      }, beforeId)
    } catch (error) {
      console.warn('[MapViewer] RainViewer radar: addLayer failed', error)
      return
    }
  }

  lastRainViewerRadarHost = data.host
  lastRainViewerRadarTileSize = tileSize
  syncRadarCoverageLayer(map, data.host, tileSize)
  syncRadarRasterEmissiveForTheme(map, lastRasterWeatherIsDarkTheme)

  if (syncGeneration !== radarSyncGeneration) return

  ensureRadarRefreshScheduled(map)
}

function applyRainViewerRadarOverlay(map: mapboxgl.Map, isActive: boolean) {
  radarSyncGeneration += 1
  const syncGeneration = radarSyncGeneration
  radarOverlayWanted = isActive

  if (!isActive) {
    clearRadarRefreshInterval()
    clearRainViewerRadarTilesTemplateCache()
    lastRainViewerRadarHost = null
    lastRainViewerRadarTileSize = null
    removeLayerIfExists(map, radarCoverageLayerId)
    removeSourceIfExists(map, radarCoverageSourceId)
    removeLayerIfExists(map, radarLayerId)
    removeSourceIfExists(map, radarSourceId)
    return
  }

  void syncRainViewerRadarToMap(map, syncGeneration)
}

export function registerRainViewerPeriodicRefresh(handler: (() => void) | null): void {
  rainViewerPeriodicRefreshHandler = handler
}

export function applyMapLayerSettings({
  map,
  basemapId,
  activeOverlayIds,
  isDarkTheme,
  temperatureOverlayOpacity: temperatureOpacityArg,
  temperatureRasterArrayBand: temperatureBandArg,
}: ApplyMapLayerSettingsParams) {
  if (!map.isStyleLoaded()) {
    map.once('style.load', () => applyMapLayerSettings({
      map,
      basemapId,
      activeOverlayIds,
      isDarkTheme,
      temperatureOverlayOpacity: temperatureOpacityArg,
      temperatureRasterArrayBand: temperatureBandArg,
    }))
    return
  }

  lastRasterWeatherIsDarkTheme = isDarkTheme

  const temperatureOpacity = temperatureOpacityArg ?? defaultTemperatureOverlayOpacity
  const temperatureRasterArrayBand = temperatureBandArg ?? defaultTemperatureRasterArrayBand

  const isTrafficActive = isOverlayActive(activeOverlayIds, 'traffic')
  const isTerrainActive = isOverlayActive(activeOverlayIds, 'terrain')
  const isBuildingsActive = isOverlayActive(activeOverlayIds, 'buildings')
  const isRadarActive = isOverlayActive(activeOverlayIds, 'radar')
  const isRadarCoverageRequested = isOverlayActive(activeOverlayIds, 'radar-coverage')
  const isTemperatureActive = isOverlayActive(activeOverlayIds, 'temperature')
  const isWindActive = isOverlayActive(activeOverlayIds, 'wind')

  radarCoverageWanted = isRadarActive && isRadarCoverageRequested

  applyStandardBasemapConfig({ map, basemapId, isDarkTheme, isBuildingsActive })
  applyTrafficOverlay(map, isTrafficActive)
  applyTerrainOverlay(map, isTerrainActive)
  applyBuildingsOverlay({ map, basemapId, isActive: isBuildingsActive })
  applyRainViewerRadarOverlay(map, isRadarActive)
  applyTemperatureOverlay(map, isTemperatureActive, {
    opacity: temperatureOpacity,
    rasterArrayBand: temperatureRasterArrayBand,
  })
  applyWindParticleOverlay(map, isWindActive)
  syncRadarRasterEmissiveForTheme(map, isDarkTheme)
  map.resize()
}

export function handleMapBasemapChange({
  map,
  basemapId,
  activeOverlayIds,
  isDarkTheme,
  temperatureOverlayOpacity,
  temperatureRasterArrayBand,
  onStyleLoaded,
}: HandleMapBasemapChangeParams) {
  const center = map.getCenter()
  const zoom = map.getZoom()
  const bearing = map.getBearing()
  const pitch = map.getPitch()
  const basemap = getMapBasemapOption(basemapId)

  map.setStyle(basemap.styleUrl, basemap.supportsLightPreset
    ? {
        config: {
          basemap: {
            lightPreset: isDarkTheme ? 'night' : 'day',
          },
        },
      }
    : undefined)

  map.once('style.load', () => {
    map.jumpTo({ center, zoom, bearing, pitch })
    applyMapLayerSettings({
      map,
      basemapId,
      activeOverlayIds,
      isDarkTheme,
      temperatureOverlayOpacity,
      temperatureRasterArrayBand,
    })
    onStyleLoaded?.()
  })
}

export function handleMapBasemapSelect({
  map,
  basemapId,
  activeOverlayIds,
  isDarkTheme,
  setSelectedBasemapId,
  temperatureOverlayOpacity,
  temperatureRasterArrayBand,
}: HandleMapBasemapSelectParams) {
  if (!map || !isMapBasemapId(basemapId)) return

  setSelectedBasemapId(basemapId)
  handleMapBasemapChange({
    map,
    basemapId,
    activeOverlayIds,
    isDarkTheme,
    temperatureOverlayOpacity,
    temperatureRasterArrayBand,
  })
}

export function handleMapOverlayToggle({
  map,
  overlayId,
  isChecked,
  basemapId,
  activeOverlayIds,
  isDarkTheme,
  setActiveOverlayIds,
  temperatureOverlayOpacity,
  temperatureRasterArrayBand,
}: HandleMapOverlayToggleParams) {
  const nextOverlayIds = isChecked
    ? [...new Set([...activeOverlayIds, overlayId])]
    : activeOverlayIds.filter(activeOverlayId => activeOverlayId !== overlayId)

  const withRadarCoverageCleanup = !isChecked && overlayId === 'radar'
    ? nextOverlayIds.filter(id => id !== 'radar-coverage')
    : nextOverlayIds

  setActiveOverlayIds(withRadarCoverageCleanup)
  if (!map) return

  applyMapLayerSettings({
    map,
    basemapId,
    activeOverlayIds: withRadarCoverageCleanup,
    isDarkTheme,
    temperatureOverlayOpacity,
    temperatureRasterArrayBand,
  })
}
