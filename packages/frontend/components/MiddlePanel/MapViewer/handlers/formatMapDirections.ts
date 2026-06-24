import type { MapboxDirectionsProfile } from './fetchMapboxDirections'

export const mapboxDirectionsProfileLabels: Record<MapboxDirectionsProfile, string> = {
  driving: 'Driving',
  walking: 'Walking',
  cycling: 'Cycling',
}

export const mapboxDirectionsProfiles = Object.keys(mapboxDirectionsProfileLabels) as MapboxDirectionsProfile[]

export function formatMapDirectionsDistance(meters: number) {
  if (meters < 1609.344) return `${Math.round(meters)} m`

  return `${(meters / 1609.344).toFixed(1)} mi`
}

export function formatMapDirectionsDuration(seconds: number) {
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${Math.max(1, minutes)} min`

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  if (remainingMinutes === 0) return `${hours} hr`

  return `${hours} hr ${remainingMinutes} min`
}
