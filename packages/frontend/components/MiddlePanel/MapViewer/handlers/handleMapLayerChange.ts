import type { Dispatch, SetStateAction } from 'react'
import type mapboxgl from 'mapbox-gl'
import { getMapBasemapOption, mapBasemapOptions, type MapBasemapId, type MapOverlayId } from '../map-layer-options'

interface ApplyMapLayerSettingsParams {
  map: mapboxgl.Map
  basemapId: MapBasemapId
  activeOverlayIds: MapOverlayId[]
  isDarkTheme: boolean
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
}

interface HandleMapOverlayToggleParams {
  map: mapboxgl.Map | null
  overlayId: MapOverlayId
  isChecked: boolean
  basemapId: MapBasemapId
  activeOverlayIds: MapOverlayId[]
  isDarkTheme: boolean
  setActiveOverlayIds: Dispatch<SetStateAction<MapOverlayId[]>>
}

const trafficSourceId = 'banbury-traffic'
const trafficLayerId = 'banbury-traffic-lines'
const terrainSourceId = 'banbury-terrain'
const buildingsLayerId = 'banbury-3d-buildings'

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

export function applyMapLayerSettings({
  map,
  basemapId,
  activeOverlayIds,
  isDarkTheme,
}: ApplyMapLayerSettingsParams) {
  if (!map.isStyleLoaded()) {
    map.once('style.load', () => applyMapLayerSettings({
      map,
      basemapId,
      activeOverlayIds,
      isDarkTheme,
    }))
    return
  }

  const isTrafficActive = isOverlayActive(activeOverlayIds, 'traffic')
  const isTerrainActive = isOverlayActive(activeOverlayIds, 'terrain')
  const isBuildingsActive = isOverlayActive(activeOverlayIds, 'buildings')

  applyStandardBasemapConfig({ map, basemapId, isDarkTheme, isBuildingsActive })
  applyTrafficOverlay(map, isTrafficActive)
  applyTerrainOverlay(map, isTerrainActive)
  applyBuildingsOverlay({ map, basemapId, isActive: isBuildingsActive })
  map.resize()
}

export function handleMapBasemapChange({
  map,
  basemapId,
  activeOverlayIds,
  isDarkTheme,
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
    applyMapLayerSettings({ map, basemapId, activeOverlayIds, isDarkTheme })
    onStyleLoaded?.()
  })
}

export function handleMapBasemapSelect({
  map,
  basemapId,
  activeOverlayIds,
  isDarkTheme,
  setSelectedBasemapId,
}: HandleMapBasemapSelectParams) {
  if (!map || !isMapBasemapId(basemapId)) return

  setSelectedBasemapId(basemapId)
  handleMapBasemapChange({
    map,
    basemapId,
    activeOverlayIds,
    isDarkTheme,
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
}: HandleMapOverlayToggleParams) {
  const nextOverlayIds = isChecked
    ? [...new Set([...activeOverlayIds, overlayId])]
    : activeOverlayIds.filter(activeOverlayId => activeOverlayId !== overlayId)

  setActiveOverlayIds(nextOverlayIds)
  if (!map) return

  applyMapLayerSettings({
    map,
    basemapId,
    activeOverlayIds: nextOverlayIds,
    isDarkTheme,
  })
}
