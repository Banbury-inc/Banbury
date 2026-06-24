import type { LineString } from 'geojson'
import type { MapPlaceLocation } from '../../../../pages/Workspaces/types'

export type MapboxDirectionsProfile = 'driving' | 'walking' | 'cycling'

export interface MapboxDirectionsStep {
  instruction: string
  name?: string
  distance: number
  duration: number
}

export interface MapboxDirectionsRoute {
  geometry: LineString
  distance: number
  duration: number
  steps: MapboxDirectionsStep[]
}

export type MapboxDirectionsRoutesByProfile = Partial<Record<MapboxDirectionsProfile, MapboxDirectionsRoute>>

interface MapboxDirectionsResponse {
  routes?: Array<{
    geometry?: LineString
    distance?: number
    duration?: number
    legs?: Array<{
      steps?: Array<{
        name?: string
        distance?: number
        duration?: number
        maneuver?: {
          instruction?: string
        }
      }>
    }>
  }>
  message?: string
}

interface FetchMapboxDirectionsParams {
  token: string
  origin: MapPlaceLocation
  destination: MapPlaceLocation
  profile: MapboxDirectionsProfile
  signal?: AbortSignal
}

function formatCoordinatePair(location: MapPlaceLocation) {
  return `${location.longitude},${location.latitude}`
}

function getRouteSteps(route: NonNullable<MapboxDirectionsResponse['routes']>[number]): MapboxDirectionsStep[] {
  return route.legs
    ?.flatMap(leg => leg.steps ?? [])
    .map(step => ({
      instruction: step.maneuver?.instruction || 'Continue',
      name: step.name,
      distance: typeof step.distance === 'number' ? step.distance : 0,
      duration: typeof step.duration === 'number' ? step.duration : 0,
    })) ?? []
}

export async function fetchMapboxDirections({
  token,
  origin,
  destination,
  profile,
  signal,
}: FetchMapboxDirectionsParams): Promise<MapboxDirectionsRoute> {
  if (!token.trim()) throw new Error('Mapbox token is required')

  const coordinates = `${formatCoordinatePair(origin)};${formatCoordinatePair(destination)}`
  const params = new URLSearchParams({
    access_token: token,
    alternatives: 'false',
    geometries: 'geojson',
    overview: 'full',
    steps: 'true',
  })

  const response = await fetch(`https://api.mapbox.com/directions/v5/mapbox/${profile}/${coordinates}?${params}`, {
    signal,
  })
  const data = await response.json() as MapboxDirectionsResponse

  if (!response.ok)
    throw new Error(data.message || 'Failed to fetch directions')

  const route = data.routes?.[0]
  if (!route?.geometry || typeof route.distance !== 'number' || typeof route.duration !== 'number')
    throw new Error('No route found between those places')

  return {
    geometry: route.geometry,
    distance: route.distance,
    duration: route.duration,
    steps: getRouteSteps(route),
  }
}
