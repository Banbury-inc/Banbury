import type { Dispatch, MutableRefObject, SetStateAction } from 'react'
import type mapboxgl from 'mapbox-gl'

import type { MapPlaceLocation } from '../../../../pages/Workspaces/types'
import { handleMapDirectionsClear } from './handleMapDirectionsActions'
import type { HandleMapDirectionsClearParams } from './handleMapDirectionsActions'
import { handleSelectedPlaceClose } from './handleSelectedPlaceClose'

interface HandleSelectedPlacePanelCloseParams {
  isDirectionsPanelOpen: boolean
  setIsDirectionsPanelOpen: Dispatch<SetStateAction<boolean>>
  setSelectedPlace: Dispatch<SetStateAction<MapPlaceLocation | null>>
  searchMarkerRef: MutableRefObject<mapboxgl.Marker | null>
  directionsClearParams: HandleMapDirectionsClearParams
}

export function handleSelectedPlacePanelClose({
  isDirectionsPanelOpen,
  setIsDirectionsPanelOpen,
  setSelectedPlace,
  searchMarkerRef,
  directionsClearParams,
}: HandleSelectedPlacePanelCloseParams) {
  if (isDirectionsPanelOpen) {
    setIsDirectionsPanelOpen(false)
    handleMapDirectionsClear(directionsClearParams)
    return
  }

  handleMapDirectionsClear(directionsClearParams)
  handleSelectedPlaceClose(setSelectedPlace, searchMarkerRef)
}
