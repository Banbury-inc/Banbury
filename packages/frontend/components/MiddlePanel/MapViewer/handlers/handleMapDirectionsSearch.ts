import type { SearchBoxCore, SearchBoxSuggestion, SessionToken } from '@mapbox/search-js-core'
import type { MapPlaceLocation } from '../../../../pages/Workspaces/types'
import { handleMapSearchSuggest } from './handleMapSearchSuggest'
import type { MapboxSearchRetrieveResponse } from './handleMapSearchRetrieve'

export type MapDirectionsEndpointId = 'origin' | 'destination'

interface HandleMapDirectionsSuggestParams {
  searchCore: SearchBoxCore
  query: string
  proximity: MapPlaceLocation
  sessionToken: SessionToken
  signal: AbortSignal
}

interface MapboxSearchFeature {
  geometry?: {
    coordinates?: unknown
  }
  properties?: {
    mapbox_id?: unknown
    name?: unknown
    full_address?: unknown
    place_formatted?: unknown
    address?: unknown
    poi_category?: unknown
  }
}

function getSearchResultName(feature: MapboxSearchFeature) {
  if (typeof feature.properties?.name === 'string' && feature.properties.name.trim())
    return feature.properties.name

  if (typeof feature.properties?.full_address === 'string' && feature.properties.full_address.trim())
    return feature.properties.full_address

  return 'Selected place'
}

function getSearchResultAddress(feature: MapboxSearchFeature) {
  if (typeof feature.properties?.full_address === 'string' && feature.properties.full_address.trim())
    return feature.properties.full_address

  if (typeof feature.properties?.place_formatted === 'string' && feature.properties.place_formatted.trim())
    return feature.properties.place_formatted

  if (typeof feature.properties?.address === 'string' && feature.properties.address.trim())
    return feature.properties.address

  return undefined
}

function getSearchResultCategories(feature: MapboxSearchFeature) {
  const categories = feature.properties?.poi_category
  if (!Array.isArray(categories)) return []

  return categories.filter((category): category is string => typeof category === 'string' && category.trim().length > 0)
}

export function mapboxSearchResponseToLocation(response: MapboxSearchRetrieveResponse) {
  const feature = response.features?.[0]
  const coordinates = feature?.geometry?.coordinates

  if (!feature || !Array.isArray(coordinates)) return null

  const [longitude, latitude] = coordinates
  if (typeof longitude !== 'number' || typeof latitude !== 'number') return null

  return {
    name: getSearchResultName(feature),
    address: getSearchResultAddress(feature),
    categories: getSearchResultCategories(feature),
    mapboxId: typeof feature.properties?.mapbox_id === 'string' ? feature.properties.mapbox_id : undefined,
    longitude,
    latitude,
    zoom: 14,
  }
}

export async function handleMapDirectionsSuggest({
  searchCore,
  query,
  proximity,
  sessionToken,
  signal,
}: HandleMapDirectionsSuggestParams): Promise<SearchBoxSuggestion[]> {
  return handleMapSearchSuggest({
    searchCore,
    query,
    currentLocation: proximity,
    sessionToken,
    signal,
  })
}

export async function handleMapDirectionsRetrieve(
  searchCore: SearchBoxCore,
  suggestion: SearchBoxSuggestion,
  sessionToken: SessionToken,
) {
  const response = await searchCore.retrieve(suggestion, {
    sessionToken,
    language: 'en',
  })

  return mapboxSearchResponseToLocation(response)
}
