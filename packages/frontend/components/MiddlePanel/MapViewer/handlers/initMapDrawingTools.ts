import type MapboxDraw from '@mapbox/mapbox-gl-draw'
import type mapboxgl from 'mapbox-gl'
import type { MapDrawingFeatureCollection } from '../../../../pages/Workspaces/types'
import {
  normalizeMapDrawingFeatureCollection,
  toDrawFeatureCollection,
} from './mapDrawingGeoJson'

export type MapDrawingControl = MapboxDraw
export type MapDrawingMode = 'select' | 'edit' | 'point' | 'line' | 'polygon'

export interface InitMapDrawingToolsParams {
  map: mapboxgl.Map
  initialDrawings?: MapDrawingFeatureCollection | null
  onChange: (collection: MapDrawingFeatureCollection) => void
  onModeChange: (mode: MapDrawingMode) => void
  onSelectionChange: (featureIds: string[]) => void
}

export interface MapDrawingToolsInstance {
  draw: MapDrawingControl
  cleanup: () => void
}

interface DrawSelectionEvent {
  features?: Array<{
    id?: string | number
    properties?: {
      id?: string | number
    } | null
  }>
}

function getSelectedFeatureIds(event: DrawSelectionEvent) {
  return (event.features ?? [])
    .map(feature => feature.id ?? feature.properties?.id)
    .filter((id): id is string | number => typeof id === 'string' || typeof id === 'number')
    .map(String)
}

function toDrawingMode(mode: string): MapDrawingMode {
  if (mode === 'direct_select') return 'edit'
  if (mode === 'draw_point') return 'point'
  if (mode === 'draw_line_string') return 'line'
  if (mode === 'draw_polygon') return 'polygon'

  return 'select'
}

export async function initMapDrawingTools({
  map,
  initialDrawings,
  onChange,
  onModeChange,
  onSelectionChange,
}: InitMapDrawingToolsParams): Promise<MapDrawingToolsInstance> {
  const MapboxDrawModule = await import('@mapbox/mapbox-gl-draw')
  const MapboxDrawConstructor = MapboxDrawModule.default
  const draw = new MapboxDrawConstructor({
    displayControlsDefault: false,
    controls: {},
    userProperties: true,
  })

  map.addControl(draw)

  const normalizedInitialDrawings = normalizeMapDrawingFeatureCollection(initialDrawings)
  if (normalizedInitialDrawings.features.length > 0)
    draw.set(toDrawFeatureCollection(normalizedInitialDrawings))

  function syncDrawings() {
    onChange(normalizeMapDrawingFeatureCollection(draw.getAll()))
  }

  function syncSelection(event: DrawSelectionEvent) {
    onSelectionChange(getSelectedFeatureIds(event))
  }

  function syncMode() {
    onModeChange(toDrawingMode(draw.getMode()))
  }

  map.on('draw.create', syncDrawings)
  map.on('draw.update', syncDrawings)
  map.on('draw.delete', syncDrawings)
  map.on('draw.selectionchange', syncSelection)
  map.on('draw.modechange', syncMode)

  syncDrawings()
  syncMode()

  return {
    draw,
    cleanup: () => {
      map.off('draw.create', syncDrawings)
      map.off('draw.update', syncDrawings)
      map.off('draw.delete', syncDrawings)
      map.off('draw.selectionchange', syncSelection)
      map.off('draw.modechange', syncMode)
      map.removeControl(draw)
    },
  }
}

export function handleMapDrawingModeChange(
  draw: MapDrawingControl | null,
  mode: MapDrawingMode,
  selectedFeatureId?: string,
) {
  if (!draw) return

  if (mode === 'point') {
    draw.changeMode('draw_point')
    return
  }

  if (mode === 'line') {
    draw.changeMode('draw_line_string')
    return
  }

  if (mode === 'polygon') {
    draw.changeMode('draw_polygon')
    return
  }

  if (mode === 'edit' && selectedFeatureId) {
    draw.changeMode('direct_select', { featureId: selectedFeatureId })
    return
  }

  draw.changeMode('simple_select', selectedFeatureId ? { featureIds: [selectedFeatureId] } : undefined)
}

export function handleMapDrawingDeleteSelected(draw: MapDrawingControl | null) {
  if (!draw) return
  draw.trash()
}

export function handleMapDrawingClear(draw: MapDrawingControl | null) {
  if (!draw) return
  draw.deleteAll()
  draw.changeMode('simple_select')
}

export function handleMapDrawingSelectFeature(draw: MapDrawingControl | null, featureId: string) {
  if (!draw) return
  draw.changeMode('simple_select', { featureIds: [featureId] })
}

export function handleMapDrawingLabelChange(
  draw: MapDrawingControl | null,
  featureId: string,
  label: string,
) {
  if (!draw) return
  draw.setFeatureProperty(featureId, 'label', label.trim())
}
