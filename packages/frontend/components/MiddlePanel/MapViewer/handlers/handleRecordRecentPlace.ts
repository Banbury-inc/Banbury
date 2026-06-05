import { ApiService } from '../../../../../backend/api/apiService'
import { MapPlace, MapPlaceLocation } from '../../../../pages/Workspaces/types'

interface RecordRecentPlaceParams {
  location: MapPlaceLocation
}

export async function handleRecordRecentPlace({
  location,
}: RecordRecentPlaceParams): Promise<MapPlace> {
  const recentPlace = await ApiService.Maps.savePlace({
    name: location.name?.trim() || 'Untitled place',
    longitude: location.longitude,
    latitude: location.latitude,
    zoom: location.zoom,
    drawings: location.drawings,
  })

  if (globalThis.window !== undefined) {
    globalThis.window.dispatchEvent(new CustomEvent('maps-places-updated'))
  }

  return recentPlace
}
