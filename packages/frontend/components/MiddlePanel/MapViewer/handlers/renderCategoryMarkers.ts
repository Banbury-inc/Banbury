import type mapboxgl from 'mapbox-gl'
import type { Dispatch } from 'react'
import { MapCategoryResult } from './handleCategorySearch'

interface MarkerStore {
  current: mapboxgl.Marker[]
}

interface RenderCategoryMarkersParams {
  map: mapboxgl.Map
  mapbox: typeof mapboxgl
  markerStore: MarkerStore
  results: MapCategoryResult[]
  onSelect: Dispatch<MapCategoryResult>
}

export function clearCategoryMarkers(markerStore: MarkerStore) {
  markerStore.current.forEach(marker => marker.remove())
  markerStore.current = []
}

function createMarkerElement() {
  const element = document.createElement('button')
  element.type = 'button'
  element.className = 'h-4 w-4 rounded-full border-2 border-background bg-primary shadow-lg ring-2 ring-primary/30'
  element.setAttribute('aria-label', 'Select place')
  return element
}

export function renderCategoryMarkers({
  map,
  mapbox,
  markerStore,
  results,
  onSelect,
}: RenderCategoryMarkersParams) {
  clearCategoryMarkers(markerStore)

  markerStore.current = results.map(result => {
    const element = createMarkerElement()
    element.addEventListener('click', event => {
      event.stopPropagation()
      onSelect(result)
    })

    return new mapbox.Marker({ element })
      .setLngLat([result.longitude, result.latitude])
      .addTo(map)
  })
}
