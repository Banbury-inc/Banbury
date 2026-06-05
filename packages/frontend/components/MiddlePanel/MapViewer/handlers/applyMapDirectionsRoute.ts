import type { MutableRefObject } from 'react'
import type mapboxgl from 'mapbox-gl'
import type { Feature, LineString } from 'geojson'
import type { MapPlaceLocation } from '../../../../pages/Workspaces/types'
import type { MapboxDirectionsRoute } from './fetchMapboxDirections'

const directionsRouteSourceId = 'banbury-directions-route'
const directionsRouteCasingLayerId = 'banbury-directions-route-casing'
const directionsRouteLayerId = 'banbury-directions-route-line'

export interface MapDirectionsMarkerRefs {
  originMarkerRef: MutableRefObject<mapboxgl.Marker | null>
  destinationMarkerRef: MutableRefObject<mapboxgl.Marker | null>
}

interface ApplyMapDirectionsRouteParams extends MapDirectionsMarkerRefs {
  map: mapboxgl.Map
  mapbox: typeof mapboxgl
  route: MapboxDirectionsRoute
  origin: MapPlaceLocation
  destination: MapPlaceLocation
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

function getThemeColor(variableName: string) {
  if (typeof window === 'undefined') return ''

  const value = window
    .getComputedStyle(document.documentElement)
    .getPropertyValue(variableName)
    .trim()

  if (!value) return ''
  if (value.startsWith('oklch(')) return oklchToRgb(value)
  if (value.startsWith('#') || value.startsWith('rgb') || value.startsWith('hsl')) return value

  return `hsl(${value})`
}

function oklchToRgb(value: string) {
  const match = value.match(/oklch\(\s*([\d.]+%?)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+%?))?\s*\)/)
  if (!match) return ''

  const lightness = match[1].endsWith('%')
    ? Number.parseFloat(match[1]) / 100
    : Number.parseFloat(match[1])
  const chroma = Number.parseFloat(match[2])
  const hueRadians = Number.parseFloat(match[3]) * Math.PI / 180
  const alpha = match[4]
    ? match[4].endsWith('%')
      ? Number.parseFloat(match[4]) / 100
      : Number.parseFloat(match[4])
    : 1

  const a = chroma * Math.cos(hueRadians)
  const b = chroma * Math.sin(hueRadians)
  const lPrime = lightness + 0.3963377774 * a + 0.2158037573 * b
  const mPrime = lightness - 0.1055613458 * a - 0.0638541728 * b
  const sPrime = lightness - 0.0894841775 * a - 1.2914855480 * b
  const l = lPrime ** 3
  const m = mPrime ** 3
  const s = sPrime ** 3

  const red = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s
  const green = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s
  const blue = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s

  const toSrgb = (channel: number) => {
    const gammaCorrected = channel >= 0.0031308
      ? 1.055 * channel ** (1 / 2.4) - 0.055
      : 12.92 * channel

    return Math.round(Math.min(1, Math.max(0, gammaCorrected)) * 255)
  }

  if (alpha < 1) return `rgba(${toSrgb(red)}, ${toSrgb(green)}, ${toSrgb(blue)}, ${alpha})`

  return `rgb(${toSrgb(red)}, ${toSrgb(green)}, ${toSrgb(blue)})`
}

function getRouteFeature(route: MapboxDirectionsRoute): Feature<LineString> {
  return {
    type: 'Feature',
    properties: {},
    geometry: route.geometry,
  }
}

function createEndpointMarkerElement(label: string) {
  const marker = document.createElement('div')
  marker.className = 'flex h-5 w-5 items-center justify-center rounded-full border-2 border-background bg-primary shadow-lg'
  marker.setAttribute('aria-label', label)
  marker.title = label

  const center = document.createElement('div')
  center.className = 'h-1.5 w-1.5 rounded-full bg-primary-foreground'
  marker.appendChild(center)

  return marker
}

function fitRouteBounds(map: mapboxgl.Map, coordinates: LineString['coordinates']) {
  if (coordinates.length === 0) return

  const bounds = coordinates.reduce(
    (acc, coordinate) => ({
      minLng: Math.min(acc.minLng, coordinate[0]),
      minLat: Math.min(acc.minLat, coordinate[1]),
      maxLng: Math.max(acc.maxLng, coordinate[0]),
      maxLat: Math.max(acc.maxLat, coordinate[1]),
    }),
    {
      minLng: coordinates[0][0],
      minLat: coordinates[0][1],
      maxLng: coordinates[0][0],
      maxLat: coordinates[0][1],
    },
  )

  map.fitBounds(
    [
      [bounds.minLng, bounds.minLat],
      [bounds.maxLng, bounds.maxLat],
    ],
    {
      padding: { top: 96, right: 420, bottom: 96, left: 64 },
      maxZoom: 15,
      duration: 900,
      essential: true,
    },
  )
}

export function clearMapDirectionsRoute({
  map,
  originMarkerRef,
  destinationMarkerRef,
}: Readonly<{ map: mapboxgl.Map | null } & MapDirectionsMarkerRefs>) {
  originMarkerRef.current?.remove()
  destinationMarkerRef.current?.remove()
  originMarkerRef.current = null
  destinationMarkerRef.current = null

  if (!map) return

  removeLayerIfExists(map, directionsRouteLayerId)
  removeLayerIfExists(map, directionsRouteCasingLayerId)
  removeSourceIfExists(map, directionsRouteSourceId)
}

export function applyMapDirectionsRoute({
  map,
  mapbox,
  route,
  origin,
  destination,
  originMarkerRef,
  destinationMarkerRef,
}: ApplyMapDirectionsRouteParams) {
  const routeFeature = getRouteFeature(route)
  const source = map.getSource(directionsRouteSourceId) as mapboxgl.GeoJSONSource | undefined

  if (source) {
    source.setData(routeFeature)
  } else {
    map.addSource(directionsRouteSourceId, {
      type: 'geojson',
      data: routeFeature,
    })
  }

  const routeColor = getThemeColor('--primary')
  const casingColor = getThemeColor('--background')
  const beforeId = getFirstSymbolLayerId(map)

  if (!map.getLayer(directionsRouteCasingLayerId)) {
    map.addLayer(
      {
        id: directionsRouteCasingLayerId,
        type: 'line',
        source: directionsRouteSourceId,
        layout: {
          'line-cap': 'round',
          'line-join': 'round',
        },
        paint: {
          'line-color': casingColor,
          'line-opacity': 0.95,
          'line-width': [
            'interpolate',
            ['linear'],
            ['zoom'],
            4,
            5,
            12,
            9,
            18,
            14,
          ],
        },
      },
      beforeId,
    )
  }

  if (!map.getLayer(directionsRouteLayerId)) {
    map.addLayer(
      {
        id: directionsRouteLayerId,
        type: 'line',
        source: directionsRouteSourceId,
        layout: {
          'line-cap': 'round',
          'line-join': 'round',
        },
        paint: {
          'line-color': routeColor,
          'line-opacity': 0.92,
          'line-width': [
            'interpolate',
            ['linear'],
            ['zoom'],
            4,
            3,
            12,
            6,
            18,
            10,
          ],
          'line-emissive-strength': 1,
        },
      },
      beforeId,
    )
  }

  originMarkerRef.current?.remove()
  destinationMarkerRef.current?.remove()
  originMarkerRef.current = new mapbox.Marker({
    element: createEndpointMarkerElement('Route origin'),
  })
    .setLngLat([origin.longitude, origin.latitude])
    .addTo(map)
  destinationMarkerRef.current = new mapbox.Marker({
    element: createEndpointMarkerElement('Route destination'),
  })
    .setLngLat([destination.longitude, destination.latitude])
    .addTo(map)

  fitRouteBounds(map, route.geometry.coordinates)
}
