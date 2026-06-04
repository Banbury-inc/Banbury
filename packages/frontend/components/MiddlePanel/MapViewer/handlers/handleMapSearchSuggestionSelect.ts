import type { MutableRefObject, SetStateAction, Dispatch } from 'react'
import type mapboxgl from 'mapbox-gl'
import type { SearchBoxCore, SearchBoxSuggestion, SessionToken } from '@mapbox/search-js-core'
import { MapPlaceLocation } from '../../../../pages/Workspaces/types'
import { handleMapSearchRetrieve } from './handleMapSearchRetrieve'

interface HandleMapSearchSuggestionSelectParams {
  searchCore: SearchBoxCore
  suggestion: SearchBoxSuggestion
  sessionToken: SessionToken
  map: mapboxgl.Map
  mapbox: typeof mapboxgl
  searchMarkerRef: MutableRefObject<mapboxgl.Marker | null>
  setCurrentLocation: Dispatch<SetStateAction<MapPlaceLocation>>
  setPlaceName: Dispatch<SetStateAction<string>>
  setSearchValue: Dispatch<SetStateAction<string>>
  setSelectedPlace: Dispatch<SetStateAction<MapPlaceLocation | null>>
  onBeforeSelect: () => void
}

export async function handleMapSearchSuggestionSelect({
  searchCore,
  suggestion,
  sessionToken,
  map,
  mapbox,
  searchMarkerRef,
  setCurrentLocation,
  setPlaceName,
  setSearchValue,
  setSelectedPlace,
  onBeforeSelect,
}: HandleMapSearchSuggestionSelectParams) {
  onBeforeSelect()

  const response = await searchCore.retrieve(suggestion, {
    sessionToken,
    language: 'en',
  })
  const location = handleMapSearchRetrieve({
    response,
    setCurrentLocation,
    setPlaceName,
    setSearchValue,
  })

  if (!location) return null
  setSelectedPlace(location)

  searchMarkerRef.current?.remove()
  searchMarkerRef.current = new mapbox.Marker()
    .setLngLat([location.longitude, location.latitude])
    .addTo(map)

  map.flyTo({
    center: [location.longitude, location.latitude],
    zoom: location.zoom,
    duration: 1200,
    essential: true,
  })

  return location
}
