import type { Feature, FeatureCollection, Geometry, GeoJsonProperties } from 'geojson'
import type {
  MapDrawingCoordinates,
  MapDrawingFeature,
  MapDrawingFeatureCollection,
  MapDrawingGeometry,
  MapDrawingGeometryType,
  MapDrawingProperties,
} from '../../../../pages/Workspaces/types'
import { getMapDrawingMeasurement, getMapDrawingTypeLabel } from './mapDrawingMeasurements'

export const emptyMapDrawingFeatureCollection: MapDrawingFeatureCollection = {
  type: 'FeatureCollection',
  features: [],
}

function isPosition(value: unknown): value is [number, number] {
  return Array.isArray(value)
    && typeof value[0] === 'number'
    && typeof value[1] === 'number'
    && Number.isFinite(value[0])
    && Number.isFinite(value[1])
}

function isPositionArray(value: unknown): value is [number, number][] {
  return Array.isArray(value) && value.every(isPosition)
}

function isPolygonCoordinates(value: unknown): value is [number, number][][] {
  return Array.isArray(value) && value.every(isPositionArray)
}

function normalizeCoordinates(
  type: MapDrawingGeometryType,
  coordinates: unknown,
): MapDrawingCoordinates | null {
  if (type === 'Point') return isPosition(coordinates) ? coordinates : null
  if (type === 'LineString') return isPositionArray(coordinates) ? coordinates : null
  if (type === 'Polygon') return isPolygonCoordinates(coordinates) ? coordinates : null

  return null
}

function getFeatureId(feature: Feature<Geometry, GeoJsonProperties>, fallbackIndex: number) {
  if (typeof feature.id === 'string' && feature.id.trim()) return feature.id
  if (typeof feature.id === 'number') return String(feature.id)

  const propertyId = feature.properties?.id
  if (typeof propertyId === 'string' && propertyId.trim()) return propertyId
  if (typeof propertyId === 'number') return String(propertyId)

  return `drawing-${fallbackIndex + 1}`
}

function normalizeProperties(
  properties: GeoJsonProperties,
  id: string,
  fallbackLabel: string,
): MapDrawingProperties {
  const nextProperties: MapDrawingProperties = {
    ...(properties ?? {}),
    id,
  }

  if (typeof nextProperties.label !== 'string' || !nextProperties.label.trim())
    nextProperties.label = fallbackLabel

  return nextProperties
}

function normalizeFeature(
  feature: Feature<Geometry, GeoJsonProperties>,
  index: number,
): MapDrawingFeature | null {
  const type = feature.geometry?.type
  if (type !== 'Point' && type !== 'LineString' && type !== 'Polygon') return null

  const coordinates = normalizeCoordinates(type, feature.geometry.coordinates)
  if (!coordinates) return null

  const id = getFeatureId(feature, index)
  const geometry: MapDrawingGeometry = { type, coordinates }
  const normalizedFeature: MapDrawingFeature = {
    id,
    type: 'Feature',
    geometry,
    properties: normalizeProperties(feature.properties, id, `${type} ${index + 1}`),
  }
  const measurement = getMapDrawingMeasurement(normalizedFeature)

  return {
    ...normalizedFeature,
    properties: {
      ...normalizedFeature.properties,
      measurement,
    },
  }
}

export function normalizeMapDrawingFeatureCollection(
  collection?: FeatureCollection | MapDrawingFeatureCollection | null,
): MapDrawingFeatureCollection {
  if (!collection || collection.type !== 'FeatureCollection' || !Array.isArray(collection.features))
    return emptyMapDrawingFeatureCollection

  return {
    type: 'FeatureCollection',
    features: collection.features
      .map((feature, index) => normalizeFeature(feature as Feature<Geometry, GeoJsonProperties>, index))
      .filter((feature): feature is MapDrawingFeature => feature !== null),
  }
}

export function createMapDrawingLabel(feature: MapDrawingFeature, index: number) {
  const label = feature.properties.label
  if (typeof label === 'string' && label.trim()) return label

  return `${getMapDrawingTypeLabel(feature)} ${index + 1}`
}

export function toDrawFeatureCollection(collection: MapDrawingFeatureCollection): FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: collection.features.map(feature => ({
      ...feature,
      geometry: feature.geometry as Geometry,
      properties: feature.properties,
    })),
  }
}

export function getMapDrawingFeatureCoordinatePreview(feature: MapDrawingFeature) {
  const coordinates = feature.geometry.coordinates
  const position = feature.geometry.type === 'Point'
    ? coordinates
    : feature.geometry.type === 'LineString'
      ? coordinates[0]
      : coordinates[0]?.[0]

  if (!isPosition(position)) return ''

  return `${position[1].toFixed(5)}, ${position[0].toFixed(5)}`
}

export function updateMapDrawingFeatureLabel(
  collection: MapDrawingFeatureCollection,
  featureId: string,
  label: string,
): MapDrawingFeatureCollection {
  return {
    type: 'FeatureCollection',
    features: collection.features.map(feature => {
      const id = feature.id ?? feature.properties.id
      if (id !== featureId) return feature

      return {
        ...feature,
        properties: {
          ...feature.properties,
          label: label.trim() || createMapDrawingLabel(feature, 0),
        },
      }
    }),
  }
}

export function downloadMapDrawingGeoJson(collection: MapDrawingFeatureCollection, filename = 'map-drawings.geojson') {
  const blob = new Blob([JSON.stringify(collection, null, 2)], { type: 'application/geo+json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}
