import { ApiService } from '../../../../../backend/api/apiService'
import type {
  MapDrawingFeatureCollection,
  MapPlace,
  MapPlaceLocation,
} from '../../../../pages/Workspaces/types'

interface SaveMapDrawingsParams {
  location: MapPlaceLocation
  drawings: MapDrawingFeatureCollection
}

export async function handleMapDrawingSave({
  location,
  drawings,
}: SaveMapDrawingsParams): Promise<MapPlace> {
  const savedPlace = location.id
    ? await ApiService.Maps.updateDrawings(location.id, drawings)
    : await ApiService.Maps.savePlace({
        name: location.name?.trim() || 'Untitled place',
        longitude: location.longitude,
        latitude: location.latitude,
        zoom: location.zoom,
        drawings,
      })

  if (globalThis.window !== undefined)
    globalThis.window.dispatchEvent(new CustomEvent('maps-places-updated'))

  return savedPlace
}
