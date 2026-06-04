import { ApiService } from '../../../../../../backend/api/apiService'
import { MapPlace } from '../../../../../pages/Workspaces/types'

interface DeletePlaceParams {
  place: MapPlace
  setPlaces: React.Dispatch<React.SetStateAction<MapPlace[]>>
}

export async function handleDeletePlace({ place, setPlaces }: DeletePlaceParams) {
  await ApiService.Maps.deletePlace(place.id)
  setPlaces(prev => prev.filter(item => item.id !== place.id))
}
