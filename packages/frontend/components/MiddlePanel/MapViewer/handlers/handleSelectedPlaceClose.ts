import type { Dispatch, MutableRefObject, SetStateAction } from 'react'
import type mapboxgl from 'mapbox-gl'

import type { MapPlaceLocation } from '../../../../pages/Workspaces/types'

export function handleSelectedPlaceClose(
  setSelectedPlace: Dispatch<SetStateAction<MapPlaceLocation | null>>,
  searchMarkerRef: MutableRefObject<mapboxgl.Marker | null>
) {
  setSelectedPlace(null)
  searchMarkerRef.current?.remove()
  searchMarkerRef.current = null
}
