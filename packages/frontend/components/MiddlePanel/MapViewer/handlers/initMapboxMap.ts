import type { Dispatch } from 'react'
import type mapboxgl from 'mapbox-gl'
import type { MapPlaceLocation } from '../../../../pages/Workspaces/types'
import { defaultMapBasemapId, getMapBasemapOption, type MapBasemapId } from '../map-layer-options'

interface InitMapboxMapParams {
  container: HTMLDivElement
  token: string
  initialPlace: MapPlaceLocation
  isDarkTheme: boolean
  basemapId?: MapBasemapId
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
  basemapId = defaultMapBasemapId,
  onMoveEnd,
}: InitMapboxMapParams): Promise<InitMapboxMapResult> {
  const mapboxModule = await import('mapbox-gl')
  const mapbox = mapboxModule.default

  // Workers must be same-origin as the page; cross-origin URLs (api.mapbox.com) fail on localhost.
  // `public/mapbox-gl-csp-worker.js` is copied from `mapbox-gl` (see `postinstall` in package.json).
  mapbox.workerUrl = '/mapbox-gl-csp-worker.js'

  mapbox.accessToken = token
  const basemap = getMapBasemapOption(basemapId)

  const map = new mapbox.Map({
    accessToken: token,
    container,
    style: basemap.styleUrl,
    ...(basemap.supportsLightPreset
      ? {
          config: {
            basemap: {
              lightPreset: isDarkTheme ? 'night' : 'day',
            },
          },
        }
      : {}),
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
