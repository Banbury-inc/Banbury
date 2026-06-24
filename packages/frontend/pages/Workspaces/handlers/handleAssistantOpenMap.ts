import type { MapPlaceLocation } from '@/pages/Workspaces/types'
import { handleFavoritePlaces } from '@/components/MiddlePanel/MapViewer/handlers/handleFavoritePlaces'

export const ASSISTANT_OPEN_MAP_EVENT = 'assistant-open-map'

interface AssistantOpenMapDetail {
  action?: 'open' | 'highlight' | 'favorite'
  openMap?: boolean
  place?: MapPlaceLocation | null
  places?: MapPlaceLocation[]
  title?: string
}

// eslint-disable-next-line no-unused-vars
type OpenMapInTabCallback = (...args: [
  MapPlaceLocation | null,
  string,
  MapPlaceLocation[]?,
  string?,
]) => void

// eslint-disable-next-line no-unused-vars
type ToastCallback = (...args: [{
  title: string
  description?: string
  variant?: 'destructive'
}]) => void

interface CreateAssistantOpenMapHandlerParams {
  openMapInTabCallback: OpenMapInTabCallback
  toast?: ToastCallback
}

function isValidPlace(place: MapPlaceLocation | null | undefined): place is MapPlaceLocation {
  if (!place) return false

  return Number.isFinite(place.longitude) && Number.isFinite(place.latitude)
}

function normalizePlaces(detail: AssistantOpenMapDetail): MapPlaceLocation[] {
  const places = Array.isArray(detail.places) ? detail.places : []
  const normalizedPlaces = places.filter(isValidPlace).map(place => ({
    ...place,
    name: place.name?.trim() || 'Selected place',
    zoom: place.zoom ?? 14,
  }))

  if (normalizedPlaces.length > 0) return normalizedPlaces
  if (!isValidPlace(detail.place)) return []

  return [{
    ...detail.place,
    name: detail.place.name?.trim() || 'Selected place',
    zoom: detail.place.zoom ?? 14,
  }]
}

export function createAssistantOpenMapHandler({
  openMapInTabCallback,
  toast,
}: CreateAssistantOpenMapHandlerParams): EventListener {
  return (event: Event) => {
    const detail = ((event as CustomEvent).detail || {}) as AssistantOpenMapDetail
    const places = normalizePlaces(detail)
    const primaryPlace = places[0] ?? null
    const shouldFavorite = detail.action === 'favorite'
    const shouldOpenMap = !shouldFavorite || detail.openMap !== false

    if (shouldFavorite && places.length > 0) {
      handleFavoritePlaces({ locations: places })
        .then(favoritePlaces => {
          toast?.({
            title: 'Saved map favorites',
            description: `${favoritePlaces.length} ${favoritePlaces.length === 1 ? 'place' : 'places'} saved to favorites.`,
          })
        })
        .catch(() => {
          toast?.({
            title: 'Could not save favorites',
            description: 'Try saving the map places again.',
            variant: 'destructive',
          })
        })
    }

    if (!shouldOpenMap) return

    const highlightedPlaces = detail.action === 'open' ? [] : places
    openMapInTabCallback(primaryPlace, 'main-panel', highlightedPlaces, detail.title)
  }
}
