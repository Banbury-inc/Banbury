import type { Dispatch, MutableRefObject, SetStateAction } from 'react'
import type mapboxgl from 'mapbox-gl'
import type { SearchBoxCore, SearchBoxSuggestion, SessionToken } from '@mapbox/search-js-core'
import type { MapPlaceLocation } from '../../../../pages/Workspaces/types'
import { applyMapDirectionsRoute, clearMapDirectionsRoute, type MapDirectionsMarkerRefs } from './applyMapDirectionsRoute'
import { fetchMapboxDirections, type MapboxDirectionsProfile, type MapboxDirectionsRoute, type MapboxDirectionsRoutesByProfile } from './fetchMapboxDirections'
import { mapboxDirectionsProfiles } from './formatMapDirections'
import { handleMapDirectionsRetrieve } from './handleMapDirectionsSearch'
import { getCurrentMapLocation } from './getCurrentMapLocation'

interface HandleMapDirectionsSuggestionSelectParams {
  searchCore: SearchBoxCore
  suggestion: SearchBoxSuggestion
  sessionToken: SessionToken
  setEndpoint: Dispatch<SetStateAction<MapPlaceLocation | null>>
  setQuery: Dispatch<SetStateAction<string>>
  setSuggestions: Dispatch<SetStateAction<SearchBoxSuggestion[]>>
  setIsOpen: Dispatch<SetStateAction<boolean>>
}

interface HandleMapDirectionsRouteRequestParams extends MapDirectionsMarkerRefs {
  map: mapboxgl.Map | null
  mapbox: typeof mapboxgl | null
  token: string
  origin: MapPlaceLocation | null
  destination: MapPlaceLocation | null
  profile: MapboxDirectionsProfile
  abortRef: MutableRefObject<AbortController | null>
  setRoute: Dispatch<SetStateAction<MapboxDirectionsRoute | null>>
  setIsLoading: Dispatch<SetStateAction<boolean>>
  setError: Dispatch<SetStateAction<string | null>>
}

interface HandleMapDirectionsRouteOptionsRequestParams extends HandleMapDirectionsRouteRequestParams {
  setRoutesByProfile: Dispatch<SetStateAction<MapboxDirectionsRoutesByProfile>>
}

export interface HandleMapDirectionsClearParams extends MapDirectionsMarkerRefs {
  map: mapboxgl.Map | null
  abortRef: MutableRefObject<AbortController | null>
  setOrigin: Dispatch<SetStateAction<MapPlaceLocation | null>>
  setDestination: Dispatch<SetStateAction<MapPlaceLocation | null>>
  setOriginQuery: Dispatch<SetStateAction<string>>
  setDestinationQuery: Dispatch<SetStateAction<string>>
  setRoute: Dispatch<SetStateAction<MapboxDirectionsRoute | null>>
  setRoutesByProfile?: Dispatch<SetStateAction<MapboxDirectionsRoutesByProfile>>
  setError: Dispatch<SetStateAction<string | null>>
  setIsLoading: Dispatch<SetStateAction<boolean>>
}

interface HandleMapDirectionsEndpointQueryChangeParams extends MapDirectionsMarkerRefs {
  map: mapboxgl.Map | null
  value: string
  abortRef: MutableRefObject<AbortController | null>
  setEndpoint: Dispatch<SetStateAction<MapPlaceLocation | null>>
  setQuery: Dispatch<SetStateAction<string>>
  setRoute: Dispatch<SetStateAction<MapboxDirectionsRoute | null>>
  setRoutesByProfile?: Dispatch<SetStateAction<MapboxDirectionsRoutesByProfile>>
  setError: Dispatch<SetStateAction<string | null>>
  setIsLoading: Dispatch<SetStateAction<boolean>>
}

interface HandleSelectedPlaceDirectionsOpenParams {
  selectedPlace: MapPlaceLocation
  fallbackOrigin: MapPlaceLocation
  setOrigin: Dispatch<SetStateAction<MapPlaceLocation | null>>
  setOriginQuery: Dispatch<SetStateAction<string>>
  setDestination: Dispatch<SetStateAction<MapPlaceLocation | null>>
  setDestinationQuery: Dispatch<SetStateAction<string>>
  setIsOpen: Dispatch<SetStateAction<boolean>>
  setError: Dispatch<SetStateAction<string | null>>
}

interface HandleMapDirectionsProfileSelectParams extends MapDirectionsMarkerRefs {
  map: mapboxgl.Map | null
  mapbox: typeof mapboxgl | null
  profile: MapboxDirectionsProfile
  routesByProfile: MapboxDirectionsRoutesByProfile
  origin: MapPlaceLocation | null
  destination: MapPlaceLocation | null
  setProfile: Dispatch<SetStateAction<MapboxDirectionsProfile>>
  setRoute: Dispatch<SetStateAction<MapboxDirectionsRoute | null>>
}

export async function handleMapDirectionsSuggestionSelect({
  searchCore,
  suggestion,
  sessionToken,
  setEndpoint,
  setQuery,
  setSuggestions,
  setIsOpen,
}: HandleMapDirectionsSuggestionSelectParams) {
  const location = await handleMapDirectionsRetrieve(searchCore, suggestion, sessionToken)
  if (!location) return null

  setEndpoint(location)
  setQuery(location.name || '')
  setSuggestions([])
  setIsOpen(false)

  return location
}

export async function handleMapDirectionsRouteRequest({
  map,
  mapbox,
  token,
  origin,
  destination,
  profile,
  abortRef,
  originMarkerRef,
  destinationMarkerRef,
  setRoute,
  setIsLoading,
  setError,
}: HandleMapDirectionsRouteRequestParams) {
  if (!map || !mapbox) return
  if (!origin || !destination) {
    setError('Choose an origin and destination first.')
    return
  }

  abortRef.current?.abort()
  const abortController = new AbortController()
  abortRef.current = abortController
  setIsLoading(true)
  setError(null)

  try {
    const route = await fetchMapboxDirections({
      token,
      origin,
      destination,
      profile,
      signal: abortController.signal,
    })
    if (abortController.signal.aborted) return

    setRoute(route)
    applyMapDirectionsRoute({
      map,
      mapbox,
      route,
      origin,
      destination,
      originMarkerRef,
      destinationMarkerRef,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return

    setRoute(null)
    clearMapDirectionsRoute({ map, originMarkerRef, destinationMarkerRef })
    setError(error instanceof Error ? error.message : 'Unable to fetch directions.')
  } finally {
    if (abortRef.current === abortController) abortRef.current = null
    if (!abortController.signal.aborted) setIsLoading(false)
  }
}

export async function handleMapDirectionsRouteOptionsRequest({
  map,
  mapbox,
  token,
  origin,
  destination,
  profile,
  abortRef,
  originMarkerRef,
  destinationMarkerRef,
  setRoute,
  setRoutesByProfile,
  setIsLoading,
  setError,
}: HandleMapDirectionsRouteOptionsRequestParams) {
  if (!map || !mapbox) return
  if (!origin || !destination) {
    setError('Choose an origin and destination first.')
    return
  }

  abortRef.current?.abort()
  const abortController = new AbortController()
  abortRef.current = abortController
  setIsLoading(true)
  setError(null)

  try {
    const settledRoutes = await Promise.allSettled(
      mapboxDirectionsProfiles.map(async routeProfile => {
        const route = await fetchMapboxDirections({
          token,
          origin,
          destination,
          profile: routeProfile,
          signal: abortController.signal,
        })

        return [routeProfile, route] as const
      }),
    )
    if (abortController.signal.aborted) return

    const routesByProfile = settledRoutes.reduce<MapboxDirectionsRoutesByProfile>((acc, result) => {
      if (result.status === 'fulfilled') acc[result.value[0]] = result.value[1]
      return acc
    }, {})
    const selectedRoute = routesByProfile[profile] ?? routesByProfile.driving ?? routesByProfile.walking ?? routesByProfile.cycling

    if (!selectedRoute) throw new Error('No routes found between those places')

    setRoutesByProfile(routesByProfile)
    setRoute(selectedRoute)
    applyMapDirectionsRoute({
      map,
      mapbox,
      route: selectedRoute,
      origin,
      destination,
      originMarkerRef,
      destinationMarkerRef,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return

    setRoute(null)
    setRoutesByProfile({})
    clearMapDirectionsRoute({ map, originMarkerRef, destinationMarkerRef })
    setError(error instanceof Error ? error.message : 'Unable to fetch directions.')
  } finally {
    if (abortRef.current === abortController) abortRef.current = null
    if (!abortController.signal.aborted) setIsLoading(false)
  }
}

export function handleMapDirectionsClear({
  map,
  abortRef,
  originMarkerRef,
  destinationMarkerRef,
  setOrigin,
  setDestination,
  setOriginQuery,
  setDestinationQuery,
  setRoute,
  setRoutesByProfile,
  setError,
  setIsLoading,
}: HandleMapDirectionsClearParams) {
  abortRef.current?.abort()
  abortRef.current = null
  setOrigin(null)
  setDestination(null)
  setOriginQuery('')
  setDestinationQuery('')
  setRoute(null)
  setRoutesByProfile?.({})
  setError(null)
  setIsLoading(false)
  clearMapDirectionsRoute({ map, originMarkerRef, destinationMarkerRef })
}

export function handleMapDirectionsEndpointQueryChange({
  map,
  value,
  abortRef,
  originMarkerRef,
  destinationMarkerRef,
  setEndpoint,
  setQuery,
  setRoute,
  setRoutesByProfile,
  setError,
  setIsLoading,
}: HandleMapDirectionsEndpointQueryChangeParams) {
  abortRef.current?.abort()
  abortRef.current = null
  setQuery(value)
  setEndpoint(null)
  setRoute(null)
  setRoutesByProfile?.({})
  setError(null)
  setIsLoading(false)
  clearMapDirectionsRoute({ map, originMarkerRef, destinationMarkerRef })
}

export function handleMapDirectionsProfileSelect({
  map,
  mapbox,
  profile,
  routesByProfile,
  origin,
  destination,
  originMarkerRef,
  destinationMarkerRef,
  setProfile,
  setRoute,
}: HandleMapDirectionsProfileSelectParams) {
  setProfile(profile)

  const route = routesByProfile[profile]
  if (!map || !mapbox || !origin || !destination || !route) return

  setRoute(route)
  applyMapDirectionsRoute({
    map,
    mapbox,
    route,
    origin,
    destination,
    originMarkerRef,
    destinationMarkerRef,
  })
}

export async function handleSelectedPlaceDirectionsOpen({
  selectedPlace,
  fallbackOrigin,
  setOrigin,
  setOriginQuery,
  setDestination,
  setDestinationQuery,
  setIsOpen,
  setError,
}: HandleSelectedPlaceDirectionsOpenParams) {
  const origin = await getCurrentMapLocation(fallbackOrigin)
  setOrigin(origin)
  setOriginQuery(origin.name || 'Current location')
  setDestination(selectedPlace)
  setDestinationQuery(selectedPlace.name || 'Selected place')
  setError(null)
  setIsOpen(true)
}
