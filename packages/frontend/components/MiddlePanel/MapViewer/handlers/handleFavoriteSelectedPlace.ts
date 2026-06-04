import type { Dispatch, SetStateAction } from 'react'
import type { useToast } from '../../../common/ui/use-toast'
import { MapPlace, MapPlaceLocation } from '../../../../pages/Workspaces/types'
import { handleFavoritePlace } from './handleFavoritePlace'

interface FavoriteSelectedPlaceParams {
  location: MapPlaceLocation
  onPlaceVisited?: Dispatch<MapPlace>
  setFavoritePlaceId: Dispatch<SetStateAction<string | null>>
  setIsFavoriteSaving: Dispatch<SetStateAction<boolean>>
  toast: ReturnType<typeof useToast>['toast']
}

export async function handleFavoriteSelectedPlace({
  location,
  onPlaceVisited,
  setFavoritePlaceId,
  setIsFavoriteSaving,
  toast,
}: FavoriteSelectedPlaceParams) {
  setIsFavoriteSaving(true)
  try {
    const favoritePlace = await handleFavoritePlace({ location })
    setFavoritePlaceId(favoritePlace.id)
    onPlaceVisited?.(favoritePlace)
    toast({ title: 'Success', description: 'Place favorited' })
  } catch {
    toast({ title: 'Error', description: 'Failed to favorite place', variant: 'destructive' })
  } finally {
    setIsFavoriteSaving(false)
  }
}
