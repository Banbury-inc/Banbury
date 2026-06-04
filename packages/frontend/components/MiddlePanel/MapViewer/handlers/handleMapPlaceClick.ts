import type { Dispatch, MutableRefObject, SetStateAction } from 'react'
import type mapboxgl from 'mapbox-gl'
import type { SearchBoxSuggestion } from '@mapbox/search-js-core'
import { MapPlaceLocation } from '../../../../pages/Workspaces/types'
import { handleSelectedPlaceClose } from './handleSelectedPlaceClose'

interface HandleMapPlaceClickParams {
  event: mapboxgl.MapMouseEvent
  map: mapboxgl.Map
  searchMarkerRef: MutableRefObject<mapboxgl.Marker | null>
  selectedSearchQueryRef: MutableRefObject<string>
  setCurrentLocation: Dispatch<SetStateAction<MapPlaceLocation>>
  setIsSearchLoading: Dispatch<SetStateAction<boolean>>
  setIsSearchOpen: Dispatch<SetStateAction<boolean>>
  setPlaceName: Dispatch<SetStateAction<string>>
  setSearchSuggestions: Dispatch<SetStateAction<SearchBoxSuggestion[]>>
  setSearchValue: Dispatch<SetStateAction<string>>
  setSelectedPlace: Dispatch<SetStateAction<MapPlaceLocation | null>>
}

interface ClickableMapFeature {
  geometry?: {
    type?: string
    coordinates?: unknown
  }
  properties?: Record<string, unknown>
}

function getFeatureName(feature: ClickableMapFeature) {
  const name = feature.properties?.name
  if (typeof name === 'string' && name.trim()) return name

  const nameEn = feature.properties?.name_en
  if (typeof nameEn === 'string' && nameEn.trim()) return nameEn

  return 'Selected place'
}

function getFeatureAddress(feature: ClickableMapFeature) {
  const fullAddress = feature.properties?.full_address
  if (typeof fullAddress === 'string' && fullAddress.trim()) return fullAddress

  const placeFormatted = feature.properties?.place_formatted
  if (typeof placeFormatted === 'string' && placeFormatted.trim()) return placeFormatted

  const address = feature.properties?.address
  if (typeof address === 'string' && address.trim()) return address

  return undefined
}

function parseFeatureCategories(categories: unknown) {
  if (Array.isArray(categories))
    return categories.filter((category): category is string => typeof category === 'string' && category.trim().length > 0)

  if (typeof categories !== 'string' || !categories.trim()) return []

  try {
    const parsedCategories = JSON.parse(categories)
    if (!Array.isArray(parsedCategories)) return []

    return parsedCategories.filter((category): category is string => typeof category === 'string' && category.trim().length > 0)
  } catch {
    return []
  }
}

function getFeatureCategories(feature: ClickableMapFeature) {
  const categories = parseFeatureCategories(feature.properties?.poi_category)
  if (categories.length > 0) return categories

  const category = feature.properties?.category
  if (typeof category === 'string' && category.trim()) return [category]

  return []
}

function getFeatureCoordinates(feature: ClickableMapFeature, event: mapboxgl.MapMouseEvent) {
  if (feature.geometry?.type !== 'Point') return event.lngLat

  const coordinates = feature.geometry.coordinates
  if (!Array.isArray(coordinates)) return event.lngLat

  const [longitude, latitude] = coordinates
  if (typeof longitude !== 'number' || typeof latitude !== 'number') return event.lngLat

  return { lng: longitude, lat: latitude }
}

export function handleMapPlaceClick({
  event,
  map,
  searchMarkerRef,
  selectedSearchQueryRef,
  setCurrentLocation,
  setIsSearchLoading,
  setIsSearchOpen,
  setPlaceName,
  setSearchSuggestions,
  setSearchValue,
  setSelectedPlace,
}: HandleMapPlaceClickParams) {
  setSearchSuggestions([])
  setIsSearchOpen(false)
  setIsSearchLoading(false)

  const feature = map
    .queryRenderedFeatures(event.point)
    .find(renderedFeature => typeof renderedFeature.properties?.name === 'string') as ClickableMapFeature | undefined

  if (!feature) {
    handleSelectedPlaceClose(setSelectedPlace, searchMarkerRef)
    return null
  }

  const name = getFeatureName(feature)
  const address = getFeatureAddress(feature)
  const categories = getFeatureCategories(feature)
  const coordinates = getFeatureCoordinates(feature, event)
  const location = {
    name,
    address,
    categories,
    longitude: coordinates.lng,
    latitude: coordinates.lat,
    zoom: Number(map.getZoom().toFixed(2)),
  }

  selectedSearchQueryRef.current = name.trim()
  setPlaceName(name)
  setSearchValue(name)
  setCurrentLocation(location)
  setSelectedPlace(location)
  return location
}
