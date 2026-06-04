export const defaultMapBasemapId = 'standard'

export const mapBasemapOptions = [
  {
    id: 'standard',
    label: 'Standard',
    styleUrl: 'mapbox://styles/mapbox/standard',
    supportsLightPreset: true,
  },
  {
    id: 'streets',
    label: 'Streets',
    styleUrl: 'mapbox://styles/mapbox/streets-v12',
    supportsLightPreset: false,
  },
  {
    id: 'satellite',
    label: 'Satellite',
    styleUrl: 'mapbox://styles/mapbox/satellite-streets-v12',
    supportsLightPreset: false,
  },
  {
    id: 'outdoors',
    label: 'Outdoors',
    styleUrl: 'mapbox://styles/mapbox/outdoors-v12',
    supportsLightPreset: false,
  },
  {
    id: 'light',
    label: 'Light',
    styleUrl: 'mapbox://styles/mapbox/light-v11',
    supportsLightPreset: false,
  },
  {
    id: 'dark',
    label: 'Dark',
    styleUrl: 'mapbox://styles/mapbox/dark-v11',
    supportsLightPreset: false,
  },
] as const

export const mapOverlayOptions = [
  {
    id: 'traffic',
    label: 'Traffic',
    description: 'Road speed and congestion',
  },
  {
    id: 'terrain',
    label: 'Terrain',
    description: 'Elevation relief',
  },
  {
    id: 'buildings',
    label: '3D buildings',
    description: 'Building extrusions',
  },
] as const

export type MapBasemapId = (typeof mapBasemapOptions)[number]['id']
export type MapOverlayId = (typeof mapOverlayOptions)[number]['id']

export interface MapBasemapOption {
  id: MapBasemapId
  label: string
  styleUrl: string
  supportsLightPreset: boolean
}

export interface MapOverlayOption {
  id: MapOverlayId
  label: string
  description: string
}

export function getMapBasemapOption(id: MapBasemapId): MapBasemapOption {
  return mapBasemapOptions.find(option => option.id === id) ?? mapBasemapOptions[0]
}
