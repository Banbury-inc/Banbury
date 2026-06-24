import type { MutableRefObject } from 'react'
import type mapboxgl from 'mapbox-gl'
import type { MapPlaceLocation } from '../../../../pages/Workspaces/types'

export function setSelectedPlaceMapMarker(
  map: mapboxgl.Map,
  mapbox: typeof mapboxgl,
  searchMarkerRef: MutableRefObject<mapboxgl.Marker | null>,
  longitude: number,
  latitude: number,
) {
  searchMarkerRef.current?.remove()
  searchMarkerRef.current = new mapbox.Marker()
    .setLngLat([longitude, latitude])
    .addTo(map)
}

interface HighlightedPlaceMapMarkersParams {
  map: mapboxgl.Map
  mapbox: typeof mapboxgl
  highlightMarkerRefs: MutableRefObject<mapboxgl.Marker[]>
  places: MapPlaceLocation[]
}

export function clearHighlightedPlaceMapMarkers(
  highlightMarkerRefs: MutableRefObject<mapboxgl.Marker[]>
) {
  highlightMarkerRefs.current.forEach(marker => marker.remove())
  highlightMarkerRefs.current = []
}

export function setHighlightedPlaceMapMarkers({
  map,
  mapbox,
  highlightMarkerRefs,
  places,
}: HighlightedPlaceMapMarkersParams) {
  clearHighlightedPlaceMapMarkers(highlightMarkerRefs)

  highlightMarkerRefs.current = places.map(place =>
    new mapbox.Marker()
      .setLngLat([place.longitude, place.latitude])
      .addTo(map)
  )

  if (places.length < 2) return

  const bounds = places.reduce(
    (nextBounds, place) => nextBounds.extend([place.longitude, place.latitude]),
    new mapbox.LngLatBounds(
      [places[0].longitude, places[0].latitude],
      [places[0].longitude, places[0].latitude]
    )
  )

  map.fitBounds(bounds, {
    padding: 80,
    duration: 900,
    maxZoom: 14,
  })
}
