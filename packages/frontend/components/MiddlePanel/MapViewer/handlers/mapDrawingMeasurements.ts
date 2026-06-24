import area from '@turf/area'
import length from '@turf/length'
import type { Feature, LineString, Polygon } from 'geojson'
import type {
  MapDrawingFeature,
  MapDrawingMeasurement,
} from '../../../../pages/Workspaces/types'

function formatDistance(kilometers: number): MapDrawingMeasurement {
  if (kilometers < 1) {
    const meters = kilometers * 1000
    return {
      label: `${meters.toFixed(0)} m`,
      value: meters,
      unit: 'm',
    }
  }

  return {
    label: `${kilometers.toFixed(2)} km`,
    value: kilometers,
    unit: 'km',
  }
}

function formatArea(squareMeters: number): MapDrawingMeasurement {
  if (squareMeters < 1000000) {
    return {
      label: `${squareMeters.toFixed(0)} m^2`,
      value: squareMeters,
      unit: 'm2',
    }
  }

  const squareKilometers = squareMeters / 1000000
  return {
    label: `${squareKilometers.toFixed(2)} km^2`,
    value: squareKilometers,
    unit: 'km2',
  }
}

export function getMapDrawingMeasurement(feature: MapDrawingFeature): MapDrawingMeasurement | undefined {
  if (feature.geometry.type === 'LineString') {
    const line = feature as Feature<LineString>
    return formatDistance(length(line, { units: 'kilometers' }))
  }

  if (feature.geometry.type === 'Polygon') {
    const polygon = feature as Feature<Polygon>
    return formatArea(area(polygon))
  }

  return undefined
}

export function getMapDrawingTypeLabel(feature: MapDrawingFeature) {
  if (feature.geometry.type === 'LineString') return 'Line'
  return feature.geometry.type
}
