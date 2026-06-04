import type { Dispatch, SetStateAction } from 'react'
import { MapPlaceLocation } from '../../../../pages/Workspaces/types'

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

export interface MapboxSearchRetrieveResponse {
  features?: MapboxSearchFeature[]
}

interface HandleMapSearchRetrieveParams {
  response: MapboxSearchRetrieveResponse
  setCurrentLocation: Dispatch<SetStateAction<MapPlaceLocation>>
  setPlaceName: Dispatch<SetStateAction<string>>
  setSearchValue: Dispatch<SetStateAction<string>>
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

export function handleMapSearchRetrieve({
  response,
  setCurrentLocation,
  setPlaceName,
  setSearchValue,
}: HandleMapSearchRetrieveParams) {
  const feature = response.features?.[0]
  const coordinates = feature?.geometry?.coordinates

  if (!feature || !Array.isArray(coordinates)) return null

  const [longitude, latitude] = coordinates
  if (typeof longitude !== 'number' || typeof latitude !== 'number') return null

  const name = getSearchResultName(feature)
  const address = getSearchResultAddress(feature)
  const categories = getSearchResultCategories(feature)
  const location = {
    name,
    address,
    categories,
    mapboxId: typeof feature.properties?.mapbox_id === 'string' ? feature.properties.mapbox_id : undefined,
    longitude,
    latitude,
    zoom: 14,
  }

  setPlaceName(name)
  setSearchValue(name)
  setCurrentLocation(location)

  return location
}
