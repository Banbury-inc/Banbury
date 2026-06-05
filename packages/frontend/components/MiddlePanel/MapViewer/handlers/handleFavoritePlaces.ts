import { ApiService } from '../../../../../backend/api/apiService'
import { MapPlace, MapPlaceLocation } from '../../../../pages/Workspaces/types'

interface FavoritePlacesParams {
  locations: MapPlaceLocation[]
}

async function favoritePlace(location: MapPlaceLocation): Promise<MapPlace> {
  const savedPlace = await ApiService.Maps.savePlace({
    name: location.name?.trim() || 'Untitled place',
    longitude: location.longitude,
    latitude: location.latitude,
    zoom: location.zoom,
  })

  if (savedPlace.is_favorite) return savedPlace

  return ApiService.Maps.setFavorite(savedPlace.id, true)
}

export async function handleFavoritePlaces({
  locations,
}: FavoritePlacesParams): Promise<MapPlace[]> {
  const results = await Promise.allSettled(locations.map(favoritePlace))
  const favoritePlaces = results.flatMap(result => result.status === 'fulfilled' ? [result.value] : [])

  if (favoritePlaces.length === 0 && results.length > 0) {
    throw new Error('Failed to save map favorites')
  }

  if (globalThis.window !== undefined) {
    globalThis.window.dispatchEvent(new CustomEvent('maps-places-updated'))
  }

  return favoritePlaces
}
