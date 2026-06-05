import { MapPlaceLocation } from '../../../../pages/Workspaces/types'
import type { GooglePlaceDetails, GooglePlaceDetailsResponse } from './googlePlaceDetailsTypes'

export type { GooglePlaceDetails, GooglePlaceDetailsResponse } from './googlePlaceDetailsTypes'

export interface GooglePlaceDetailsResult {
  details: GooglePlaceDetails | null
  isConfigured: boolean
}

export async function handleGooglePlaceDetails(
  place: MapPlaceLocation,
  signal?: AbortSignal
): Promise<GooglePlaceDetailsResult> {
  const response = await fetch('/api/maps/google-place-details', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: place.name,
      address: place.address,
      latitude: place.latitude,
      longitude: place.longitude,
    }),
    signal,
  })

  if (response.status === 400) return { details: null, isConfigured: true }
  if (!response.ok) throw new Error('Failed to fetch Google place details')

  const data = await response.json() as GooglePlaceDetailsResponse
  return {
    details: data.place ?? null,
    isConfigured: data.isConfigured !== false,
  }
}
