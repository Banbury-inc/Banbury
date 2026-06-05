import { ApiService } from '../../../../../backend/api/apiService'
import type { MapPlaceLocation } from '../../../../pages/Workspaces/types'

const coordinateEpsilon = 0.0001

function coordinatesMatch(
  leftLongitude: number,
  leftLatitude: number,
  rightLongitude: number,
  rightLatitude: number,
) {
  return Math.abs(leftLongitude - rightLongitude) < coordinateEpsilon
    && Math.abs(leftLatitude - rightLatitude) < coordinateEpsilon
}

export async function resolveSelectedPlaceFavoriteId(
  location: MapPlaceLocation,
): Promise<string | null> {
  const places = await ApiService.Maps.listPlaces()
  const match = places.find(place => place.is_favorite && (
    (location.id && place.id === location.id)
    || coordinatesMatch(location.longitude, location.latitude, place.longitude, place.latitude)
  ))

  return match?.id ?? null
}
