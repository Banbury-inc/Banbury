export interface MapCategorySearchInput {
  accessToken: string
  categoryId: string
  proximity: {
    longitude: number
    latitude: number
  }
  limit?: number
}

export interface MapCategoryResult {
  id: string
  name: string
  address: string
  longitude: number
  latitude: number
  categories: string[]
}

interface MapboxCategoryFeature {
  id?: string
  geometry?: {
    coordinates?: unknown
  }
  properties?: {
    mapbox_id?: unknown
    name?: unknown
    full_address?: unknown
    place_formatted?: unknown
    address?: unknown
    poi_category?: unknown
  }
}

interface MapboxCategoryResponse {
  features?: MapboxCategoryFeature[]
}

function createSessionToken() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
    return crypto.randomUUID()

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function getFeatureName(feature: MapboxCategoryFeature) {
  if (typeof feature.properties?.name === 'string' && feature.properties.name.trim())
    return feature.properties.name

  if (typeof feature.properties?.full_address === 'string' && feature.properties.full_address.trim())
    return feature.properties.full_address

  return 'Nearby place'
}

function getFeatureAddress(feature: MapboxCategoryFeature) {
  if (typeof feature.properties?.full_address === 'string' && feature.properties.full_address.trim())
    return feature.properties.full_address

  if (typeof feature.properties?.place_formatted === 'string' && feature.properties.place_formatted.trim())
    return feature.properties.place_formatted

  if (typeof feature.properties?.address === 'string' && feature.properties.address.trim())
    return feature.properties.address

  return ''
}

function getFeatureCategories(feature: MapboxCategoryFeature) {
  const categories = feature.properties?.poi_category
  if (!Array.isArray(categories)) return []

  return categories.filter((category): category is string => typeof category === 'string')
}

function toCategoryResult(feature: MapboxCategoryFeature): MapCategoryResult | null {
  const coordinates = feature.geometry?.coordinates
  if (!Array.isArray(coordinates)) return null

  const [longitude, latitude] = coordinates
  if (typeof longitude !== 'number' || typeof latitude !== 'number') return null

  return {
    id: typeof feature.properties?.mapbox_id === 'string'
      ? feature.properties.mapbox_id
      : feature.id || `${longitude}-${latitude}`,
    name: getFeatureName(feature),
    address: getFeatureAddress(feature),
    longitude,
    latitude,
    categories: getFeatureCategories(feature),
  }
}

export async function handleCategorySearch({
  accessToken,
  categoryId,
  proximity,
  limit = 10,
}: MapCategorySearchInput): Promise<MapCategoryResult[]> {
  const params = new URLSearchParams({
    access_token: accessToken,
    language: 'en',
    limit: String(limit),
    proximity: `${proximity.longitude},${proximity.latitude}`,
    session_token: createSessionToken(),
  })

  const response = await fetch(`https://api.mapbox.com/search/searchbox/v1/category/${encodeURIComponent(categoryId)}?${params.toString()}`)
  if (!response.ok)
    throw new Error(`Category search failed with status ${response.status}`)

  const data = await response.json() as MapboxCategoryResponse
  return (data.features ?? [])
    .map(toCategoryResult)
    .filter((result): result is MapCategoryResult => result !== null)
}
