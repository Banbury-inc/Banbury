import type { Dispatch } from 'react'
import type mapboxgl from 'mapbox-gl'
import { MapPlaceLocation } from '../../../../pages/Workspaces/types'

interface InitMapboxMapParams {
  container: HTMLDivElement
  token: string
  initialPlace: MapPlaceLocation
  isDarkTheme: boolean
  onMoveEnd: Dispatch<MapPlaceLocation>
}

export interface InitMapboxMapResult {
  map: mapboxgl.Map
  mapboxgl: typeof mapboxgl
}

export async function initMapboxMap({
  container,
  token,
  initialPlace,
  isDarkTheme,
  onMoveEnd,
}: InitMapboxMapParams): Promise<InitMapboxMapResult> {
  const mapboxModule = await import('mapbox-gl')
  const mapbox = mapboxModule.default

  mapbox.accessToken = token

  const map = new mapbox.Map({
    accessToken: token,
    container,
    style: 'mapbox://styles/mapbox/standard',
    config: {
      basemap: {
        lightPreset: isDarkTheme ? 'night' : 'day',
      },
    },
    center: [initialPlace.longitude, initialPlace.latitude],
    zoom: initialPlace.zoom,
  })

  map.addControl(new mapbox.NavigationControl(), 'top-right')
  map.on('moveend', () => {
    const center = map.getCenter()
    onMoveEnd({
      name: initialPlace.name,
      longitude: center.lng,
      latitude: center.lat,
      zoom: Number(map.getZoom().toFixed(2)),
    })
  })

  return { map, mapboxgl: mapbox }
}
