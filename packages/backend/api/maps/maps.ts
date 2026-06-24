import { ApiService } from '../apiService'
import type { MapDrawingFeatureCollection, MapPlace } from '../../../frontend/pages/Workspaces/types'

const BASE = '/maps'

interface SavePlaceInput {
  name: string
  longitude: number
  latitude: number
  zoom: number
  drawings?: MapDrawingFeatureCollection
}

export default class Maps {
  static async listPlaces(): Promise<MapPlace[]> {
    const response = await ApiService.get<{ places: MapPlace[] }>(`${BASE}/places/`)
    return response.places ?? []
  }

  static async savePlace(place: SavePlaceInput): Promise<MapPlace> {
    return ApiService.post<MapPlace>(`${BASE}/places/`, place)
  }

  static async setFavorite(placeId: string, isFavorite: boolean): Promise<MapPlace> {
    return ApiService.put<MapPlace>(`${BASE}/places/${placeId}/`, { is_favorite: isFavorite })
  }

  static async renamePlace(placeId: string, name: string): Promise<MapPlace> {
    return ApiService.put<MapPlace>(`${BASE}/places/${placeId}/`, { name })
  }

  static async updateDrawings(
    placeId: string,
    drawings: MapDrawingFeatureCollection,
  ): Promise<MapPlace> {
    return ApiService.put<MapPlace>(`${BASE}/places/${placeId}/`, { drawings })
  }

  static async deletePlace(placeId: string): Promise<{ success: boolean; message: string }> {
    return ApiService.delete<{ success: boolean; message: string }>(`${BASE}/places/${placeId}/`)
  }
}
