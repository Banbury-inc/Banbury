import { ApiService } from '../../../../../../backend/api/apiService'
import { MapPlace } from '../../../../../pages/Workspaces/types'

interface LoadPlacesParams {
  setPlaces: React.Dispatch<React.SetStateAction<MapPlace[]>>
  setLoading: React.Dispatch<React.SetStateAction<boolean>>
  setIsRefreshing: React.Dispatch<React.SetStateAction<boolean>>
}

export async function loadPlaces({ setPlaces, setLoading, setIsRefreshing }: LoadPlacesParams) {
  setLoading(true)
  try {
    const places = await ApiService.Maps.listPlaces()
    setPlaces(places)
  } finally {
    setLoading(false)
    setIsRefreshing(false)
  }
}
