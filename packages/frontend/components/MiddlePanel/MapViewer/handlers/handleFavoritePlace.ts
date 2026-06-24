import { ApiService } from '../../../../../backend/api/apiService'
import { MapPlace, MapPlaceLocation } from '../../../../pages/Workspaces/types'

interface FavoritePlaceParams {
  location: MapPlaceLocation
}

export async function handleFavoritePlace({
  location,
}: FavoritePlaceParams): Promise<MapPlace> {
  const savedPlace = await ApiService.Maps.savePlace({
    name: location.name?.trim() || 'Untitled place',
    longitude: location.longitude,
    latitude: location.latitude,
    zoom: location.zoom,
    drawings: location.drawings,
  })

  const favoritePlace = savedPlace.is_favorite
    ? savedPlace
    : await ApiService.Maps.setFavorite(savedPlace.id, true)

  if (globalThis.window !== undefined) {
    globalThis.window.dispatchEvent(new CustomEvent('maps-places-updated'))
  }

  return favoritePlace
}
