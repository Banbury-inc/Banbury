import type { MutableRefObject } from 'react'
import type mapboxgl from 'mapbox-gl'

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
