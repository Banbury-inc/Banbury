import type { Dispatch, SetStateAction } from 'react'
import type { useToast } from '../../../common/ui/use-toast'
import { MapPlace, MapPlaceLocation } from '../../../../pages/Workspaces/types'
import { handleFavoritePlace } from './handleFavoritePlace'

interface FavoriteSelectedPlaceParams {
  location: MapPlaceLocation
  onPlaceVisited?: Dispatch<MapPlace>
  setFavoritePlaceId: Dispatch<SetStateAction<string | null>>
  setSelectedPlace: Dispatch<SetStateAction<MapPlaceLocation | null>>
  setIsFavoriteSaving: Dispatch<SetStateAction<boolean>>
  toast: ReturnType<typeof useToast>['toast']
}

export async function handleFavoriteSelectedPlace({
  location,
  onPlaceVisited,
  setFavoritePlaceId,
  setSelectedPlace,
  setIsFavoriteSaving,
  toast,
}: FavoriteSelectedPlaceParams) {
  setIsFavoriteSaving(true)
  try {
    const favoritePlace = await handleFavoritePlace({ location })
    setFavoritePlaceId(favoritePlace.id)
    setSelectedPlace(current => current
      ? { ...current, id: favoritePlace.id }
      : current)
    onPlaceVisited?.(favoritePlace)
    toast({ title: 'Success', description: 'Place favorited' })
  } catch {
    toast({ title: 'Error', description: 'Failed to favorite place', variant: 'destructive' })
  } finally {
    setIsFavoriteSaving(false)
  }
}
