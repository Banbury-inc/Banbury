import type { SearchBoxCore, SearchBoxSuggestion, SessionToken } from '@mapbox/search-js-core'
import { MapPlaceLocation } from '../../../../pages/Workspaces/types'

interface HandleMapSearchSuggestParams {
  searchCore: SearchBoxCore
  query: string
  currentLocation: MapPlaceLocation
  sessionToken: SessionToken
  signal: AbortSignal
}

export async function handleMapSearchSuggest({
  searchCore,
  query,
  currentLocation,
  sessionToken,
  signal,
}: HandleMapSearchSuggestParams): Promise<SearchBoxSuggestion[]> {
  if (query.trim().length < 2) return []

  const response = await searchCore.suggest(query, {
    sessionToken,
    signal,
    language: 'en',
    limit: 6,
    proximity: {
      lng: currentLocation.longitude,
      lat: currentLocation.latitude,
    },
  })

  return response.suggestions
}
