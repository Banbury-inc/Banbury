import { useTheme } from 'next-themes'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type mapboxgl from 'mapbox-gl'
import { SearchBoxCore, SessionToken } from '@mapbox/search-js-core'
import type { SearchBoxSuggestion } from '@mapbox/search-js-core'
import 'mapbox-gl/dist/mapbox-gl.css'
import { Clock, DollarSign, ExternalLink, Globe, Loader2, Map, MapPin, Phone, Star, X } from 'lucide-react'
import { CONFIG } from '../../../config/config'
import { Button } from '../../common/ui/button'
import { Input } from '../../common/ui/input'
import { Typography } from '../../common/ui/typography'
import { useToast } from '../../common/ui/use-toast'
import { MapPlace, MapPlaceLocation } from '../../../pages/Workspaces/types'
import { getCurrentMapLocation } from './handlers/getCurrentMapLocation'
import { handleCategorySearch, MapCategoryResult } from './handlers/handleCategorySearch'
import { GooglePlaceDetails, handleGooglePlaceDetails } from './handlers/handleGooglePlaceDetails'
import { handleFavoriteSelectedPlace } from './handlers/handleFavoriteSelectedPlace'
import { handleMapPlaceClick } from './handlers/handleMapPlaceClick'
import { handleMapSearchSuggest } from './handlers/handleMapSearchSuggest'
import { handleMapSearchSuggestionSelect } from './handlers/handleMapSearchSuggestionSelect'
import { handleRecordRecentPlace } from './handlers/handleRecordRecentPlace'
import { handleSelectedPlaceClose } from './handlers/handleSelectedPlaceClose'
import { initMapboxMap } from './handlers/initMapboxMap'
import { clearCategoryMarkers, renderCategoryMarkers } from './handlers/renderCategoryMarkers'

interface MapViewerProps {
  place?: MapPlaceLocation | null
  onPlaceVisited?: React.Dispatch<MapPlace>
}

const defaultLocation: MapPlaceLocation = {
  name: 'New place',
  longitude: -98.5795,
  latitude: 39.8283,
  zoom: 3,
}

const categoryOptions = [
  { id: 'restaurant', label: 'Restaurants' },
  { id: 'gas_station', label: 'Gas' },
  { id: 'coffee_shop', label: 'Coffee' },
  { id: 'grocery', label: 'Grocery' },
  { id: 'hotel', label: 'Hotels' },
  { id: 'pharmacy', label: 'Pharmacy' },
  { id: 'parking', label: 'Parking' },
]

function formatPlaceCategory(category: string) {
  return category
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, letter => letter.toUpperCase())
}

function formatCoordinate(coordinate: number) {
  return coordinate.toFixed(5)
}

function formatPriceLevel(priceLevel?: string) {
  if (!priceLevel) return null

  return priceLevel.charAt(0).toUpperCase() + priceLevel.slice(1)
}

function formatWebsiteHost(websiteUri?: string) {
  if (!websiteUri) return null

  try {
    return new URL(websiteUri).hostname.replace(/^www\./, '')
  } catch {
    return websiteUri
  }
}

function getTodayHours(placeDetails: GooglePlaceDetails | null) {
  const weekday = new Intl.DateTimeFormat('en', { weekday: 'long' }).format(new Date())
  return placeDetails?.weekdayDescriptions.find(description => description.startsWith(weekday))
}

function getOpenStatus(placeDetails: GooglePlaceDetails | null) {
  if (!placeDetails) return null
  if (placeDetails.isOpenNow === true) return 'Open now'
  if (placeDetails.isOpenNow === false) return 'Closed now'
  return null
}

function getPlaceCategoryLabels(primaryType?: string, categories: string[] = []) {
  return [...new Set([primaryType, ...categories]
    .filter((category): category is string => typeof category === 'string' && category.trim().length > 0))]
}

function PlaceDetailRow({
  icon,
  children,
}: Readonly<{
  icon: ReactNode
  children: ReactNode
}>) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center text-primary">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        {children}
      </div>
    </div>
  )
}

export function MapViewer({ place, onPlaceVisited }: Readonly<MapViewerProps>) {
  const { toast } = useToast()
  const { theme, resolvedTheme } = useTheme()
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const categoryMarkersRef = useRef<mapboxgl.Marker[]>([])
  const searchMarkerRef = useRef<mapboxgl.Marker | null>(null)
  const searchSessionTokenRef = useRef<SessionToken | null>(null)
  const selectedSearchQueryRef = useRef('')
  const recordRecentPlaceRef = useRef<(location: MapPlaceLocation) => void>(() => {})
  const placeNameRef = useRef(place?.name || 'New place')
  const isDarkThemeRef = useRef(false)
  const [currentLocation, setCurrentLocation] = useState<MapPlaceLocation>(place || defaultLocation)
  const [placeName, setPlaceName] = useState(place?.name || 'New place')
  const [searchValue, setSearchValue] = useState('')
  const [searchSuggestions, setSearchSuggestions] = useState<SearchBoxSuggestion[]>([])
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isSearchLoading, setIsSearchLoading] = useState(false)
  const [selectedPlace, setSelectedPlace] = useState<MapPlaceLocation | null>(null)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [categoryResults, setCategoryResults] = useState<MapCategoryResult[]>([])
  const [isCategoryLoading, setIsCategoryLoading] = useState(false)
  const [isMapReady, setIsMapReady] = useState(false)
  const [favoritePlaceId, setFavoritePlaceId] = useState<string | null>(null)
  const [isFavoriteSaving, setIsFavoriteSaving] = useState(false)
  const [googlePlaceDetails, setGooglePlaceDetails] = useState<GooglePlaceDetails | null>(null)
  const [isGooglePlaceLoading, setIsGooglePlaceLoading] = useState(false)
  const [isGooglePlacesConfigured, setIsGooglePlacesConfigured] = useState(true)
  const [mapboxModule, setMapboxModule] = useState<typeof mapboxgl | null>(null)
  const mapboxToken = CONFIG.mapboxToken
  const isDarkTheme = (resolvedTheme || theme) !== 'light'
  const searchCore = useMemo(() => new SearchBoxCore({ accessToken: mapboxToken }), [mapboxToken])

  const recordRecentPlace = useCallback(async (location: MapPlaceLocation) => {
    try {
      const recentPlace = await handleRecordRecentPlace({ location })
      onPlaceVisited?.(recentPlace)
    } catch {
      toast({ title: 'Error', description: 'Failed to update recent places', variant: 'destructive' })
    }
  }, [onPlaceVisited, toast])

  useEffect(() => {
    recordRecentPlaceRef.current = location => {
      void recordRecentPlace(location)
    }
  }, [recordRecentPlace])

  useEffect(() => {
    isDarkThemeRef.current = isDarkTheme
  }, [isDarkTheme])

  useEffect(() => {
    placeNameRef.current = placeName
  }, [placeName])

  useEffect(() => {
    const query = searchValue.trim()
    if (selectedSearchQueryRef.current === query) {
      setSearchSuggestions([])
      setIsSearchOpen(false)
      setIsSearchLoading(false)
      return
    }

    if (!isMapReady || query.length < 2) {
      setSearchSuggestions([])
      setIsSearchOpen(false)
      setIsSearchLoading(false)
      return
    }

    const abortController = new AbortController()
    const timeout = window.setTimeout(() => {
      const sessionToken = searchSessionTokenRef.current || new SessionToken()
      searchSessionTokenRef.current = sessionToken
      setIsSearchLoading(true)

      handleMapSearchSuggest({
        searchCore,
        query,
        currentLocation,
        sessionToken,
        signal: abortController.signal,
      })
        .then(suggestions => {
          if (selectedSearchQueryRef.current === query) return
          setSearchSuggestions(suggestions)
          setIsSearchOpen(suggestions.length > 0)
        })
        .catch(error => {
          if (error instanceof DOMException && error.name === 'AbortError') return
          setSearchSuggestions([])
          setIsSearchOpen(false)
        })
        .finally(() => setIsSearchLoading(false))
    }, 250)

    return () => {
      window.clearTimeout(timeout)
      abortController.abort()
    }
  }, [currentLocation, isMapReady, searchCore, searchValue])

  useEffect(() => {
    let isMounted = true
    let resizeObserver: ResizeObserver | null = null

    async function setupMap() {
      if (!containerRef.current || !mapboxToken || mapRef.current) return
      const container = containerRef.current
      setIsMapReady(false)

      try {
        const initialLocation = place || await getCurrentMapLocation(defaultLocation)
        const initialName = initialLocation.name || 'Current location'
        placeNameRef.current = initialName
        setCurrentLocation({
          ...initialLocation,
          name: initialName,
        })
        setPlaceName(initialName)
        setSearchValue('')

        const { map, mapboxgl: loadedMapboxModule } = await initMapboxMap({
          container,
          token: mapboxToken,
          initialPlace: initialLocation,
          isDarkTheme: isDarkThemeRef.current,
          onMoveEnd: location => setCurrentLocation({
            ...location,
            name: placeNameRef.current || location.name,
          }),
        })

        if (!isMounted) {
          map.remove()
          return
        }

        map.on('click', event => {
          const selectedLocation = handleMapPlaceClick({
            event,
            map,
            searchMarkerRef,
            selectedSearchQueryRef,
            setCurrentLocation,
            setIsSearchLoading,
            setIsSearchOpen,
            setPlaceName,
            setSearchSuggestions,
            setSearchValue,
            setSelectedPlace,
          })

          if (selectedLocation) recordRecentPlaceRef.current(selectedLocation)
        })
        mapRef.current = map
        setMapboxModule(loadedMapboxModule)

        const resizeMap = () => map.resize()
        const markMapReady = () => {
          if (!isMounted) return
          resizeMap()
          setIsMapReady(true)
        }

        requestAnimationFrame(resizeMap)
        if (map.loaded()) markMapReady()
        else map.once('load', markMapReady)

        if (typeof ResizeObserver !== 'undefined') {
          resizeObserver = new ResizeObserver(resizeMap)
          resizeObserver.observe(container)
        }
      } catch {
        toast({ title: 'Error', description: 'Failed to load Mapbox map', variant: 'destructive' })
      }
    }

    setupMap()

    return () => {
      isMounted = false
      resizeObserver?.disconnect()
      clearCategoryMarkers(categoryMarkersRef)
      searchMarkerRef.current?.remove()
      searchMarkerRef.current = null
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [mapboxToken, place, toast])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    map.setConfigProperty('basemap', 'lightPreset', isDarkTheme ? 'night' : 'day')
    map.resize()
  }, [isDarkTheme])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !place) return

    const nextPlace = {
      ...place,
      name: place.name || 'Selected place',
    }
    placeNameRef.current = nextPlace.name
    selectedSearchQueryRef.current = nextPlace.name.trim()
    setCurrentLocation(nextPlace)
    setSelectedPlace(nextPlace)
    setPlaceName(nextPlace.name)
    setSearchValue(nextPlace.name)
    map.flyTo({
      center: [nextPlace.longitude, nextPlace.latitude],
      zoom: nextPlace.zoom,
      duration: 900,
      essential: true,
    })
  }, [place])

  useEffect(() => {
    if (!selectedPlace) {
      setFavoritePlaceId(null)
      setGooglePlaceDetails(null)
      setIsGooglePlaceLoading(false)
      return
    }

    setFavoritePlaceId(null)
    let isCancelled = false
    const abortController = new AbortController()
    setGooglePlaceDetails(null)
    setIsGooglePlaceLoading(true)

    handleGooglePlaceDetails(selectedPlace, abortController.signal)
      .then(result => {
        if (isCancelled) return
        setGooglePlaceDetails(result.details)
        setIsGooglePlacesConfigured(result.isConfigured)
      })
      .catch(error => {
        if (isCancelled || (error instanceof DOMException && error.name === 'AbortError')) return
        setGooglePlaceDetails(null)
      })
      .finally(() => {
        if (!isCancelled) setIsGooglePlaceLoading(false)
      })

    return () => {
      isCancelled = true
      abortController.abort()
    }
  }, [selectedPlace])

  const handleCategoryResultSelect = (result: MapCategoryResult) => {
    const nextLocation = {
      name: result.name,
      address: result.address,
      categories: result.categories,
      mapboxId: result.id,
      longitude: result.longitude,
      latitude: result.latitude,
      zoom: 14,
    }

    setCurrentLocation(nextLocation)
    setSelectedPlace(nextLocation)
    setPlaceName(result.name)
    setSearchValue(result.name)
    void recordRecentPlace(nextLocation)
    mapRef.current?.flyTo({
      center: [result.longitude, result.latitude],
      zoom: 14,
      duration: 900,
      essential: true,
    })
  }

  const handleCategoryClick = async (categoryId: string) => {
    const map = mapRef.current
    if (!map || !mapboxModule) return

    setSelectedCategoryId(categoryId)
    setIsCategoryLoading(true)

    try {
      const center = map.getCenter()
      const results = await handleCategorySearch({
        accessToken: mapboxToken,
        categoryId,
        proximity: {
          longitude: center.lng,
          latitude: center.lat,
        },
        limit: 10,
      })

      setCategoryResults(results)
      renderCategoryMarkers({
        map,
        mapbox: mapboxModule,
        markerStore: categoryMarkersRef,
        results,
        onSelect: handleCategoryResultSelect,
      })

      if (results.length === 0)
        toast({ title: 'No places found', description: 'Try moving the map or choosing another category.' })
    } catch {
      toast({ title: 'Error', description: 'Failed to search nearby places', variant: 'destructive' })
    } finally {
      setIsCategoryLoading(false)
    }
  }

  if (!mapboxToken) {
    return (
      <div className="h-full flex items-center justify-center bg-background p-6">
        <div className="max-w-md text-center space-y-3">
          <Map className="h-8 w-8 mx-auto text-muted-foreground" strokeWidth={1.5} />
          <Typography variant="h3" className="text-foreground">
            Mapbox token required
          </Typography>
          <Typography variant="sm" className="text-muted-foreground">
            Set NEXT_PUBLIC_MAPBOX_TOKEN to enable the Maps workspace.
          </Typography>
        </div>
      </div>
    )
  }

  const openStatus = getOpenStatus(googlePlaceDetails)
  const todayHours = getTodayHours(googlePlaceDetails)
  const priceLevel = formatPriceLevel(googlePlaceDetails?.priceLevel)
  const websiteHost = formatWebsiteHost(googlePlaceDetails?.websiteUri)
  const primaryType = googlePlaceDetails?.primaryType || selectedPlace?.categories?.[0]
  const placeCategoryLabels = getPlaceCategoryLabels(primaryType, selectedPlace?.categories)

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="relative z-20 border-b border-border bg-card px-4 py-3">
        <div className="flex items-center gap-2">
          {isMapReady && mapRef.current && mapboxModule && (
            <div className="relative w-72 flex-shrink-0 lg:w-80">
              <Input
                value={searchValue}
                onChange={event => {
                  selectedSearchQueryRef.current = ''
                  setSearchValue(event.target.value)
                  setIsSearchOpen(true)
                }}
                onFocus={() => {
                  if (searchSuggestions.length > 0) setIsSearchOpen(true)
                }}
                placeholder="Search places"
                className="h-8"
              />
              {(isSearchOpen || isSearchLoading) && (
                <div
                  id="map-search-results"
                  className="absolute left-0 right-0 top-full z-20 mt-2 max-h-72 overflow-y-auto rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-lg"
                >
                  {isSearchLoading && (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      Searching...
                    </div>
                  )}
                  {!isSearchLoading && searchSuggestions.map(suggestion => (
                    <button
                      key={suggestion.mapbox_id}
                      type="button"
                      onMouseDown={async event => {
                        event.preventDefault()
                        if (!mapRef.current || !mapboxModule) return

                        const sessionToken = searchSessionTokenRef.current || new SessionToken()
                        setSearchSuggestions([])
                        setIsSearchOpen(false)

                        const selectedLocation = await handleMapSearchSuggestionSelect({
                          searchCore,
                          suggestion,
                          sessionToken,
                          map: mapRef.current,
                          mapbox: mapboxModule,
                          searchMarkerRef,
                          setCurrentLocation,
                          setPlaceName,
                          setSearchValue,
                          setSelectedPlace,
                          onBeforeSelect: () => {
                            clearCategoryMarkers(categoryMarkersRef)
                            setCategoryResults([])
                            setSelectedCategoryId(null)
                            setSearchSuggestions([])
                            setIsSearchOpen(false)
                          },
                        })
                        if (selectedLocation) {
                          selectedSearchQueryRef.current = selectedLocation.name?.trim() ?? ''
                          void recordRecentPlace(selectedLocation)
                        }
                        searchSessionTokenRef.current = null
                      }}
                      className="w-full rounded-sm px-3 py-2 text-left hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground focus-visible:outline-none"
                    >
                      <Typography variant="xs" className="block truncate font-medium text-foreground">
                        {suggestion.name}
                      </Typography>
                      {suggestion.place_formatted && (
                        <Typography variant="xs" className="mt-1 block truncate text-muted-foreground">
                          {suggestion.place_formatted}
                        </Typography>
                      )}
                    </button>
                  ))}
                  {!isSearchLoading && searchSuggestions.length === 0 && (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      No places found
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto">
            <Typography variant="xs" className="flex-shrink-0 text-muted-foreground">
              Nearby
            </Typography>
            {categoryOptions.map(category => {
              const isSelected = selectedCategoryId === category.id
              return (
                <Button
                  key={category.id}
                  type="button"
                  variant={isSelected ? 'secondary' : 'ghost'}
                  size="xs"
                  onClick={() => handleCategoryClick(category.id)}
                  disabled={!isMapReady || isCategoryLoading}
                  className="flex-shrink-0"
                >
                  {category.label}
                </Button>
              )
            })}
          </div>
        </div>
      </div>
      <div className="relative flex-1 min-h-0">
        <div ref={containerRef} className="absolute inset-0" />
        {!isMapReady && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background">
            <div className="flex max-w-sm flex-col items-center gap-3 rounded-lg border border-border bg-card px-6 py-5 text-center shadow-lg">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background">
                <Loader2 className="h-5 w-5 animate-spin text-primary" strokeWidth={1.5} />
              </div>
              <div className="space-y-1">
                <Typography variant="sm" className="font-semibold text-foreground">
                  Loading map
                </Typography>
                <Typography variant="xs" className="text-muted-foreground">
                  Preparing the map viewer...
                </Typography>
              </div>
            </div>
          </div>
        )}
        {selectedPlace && (
          <div className="absolute right-4 top-4 z-10 w-[min(calc(100%-2rem),22rem)] rounded-lg border border-border bg-card p-3 shadow-lg">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <Typography variant="xs" className="font-semibold text-foreground">
                  Selected place
                </Typography>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => handleSelectedPlaceClose(setSelectedPlace, searchMarkerRef)}
                  aria-label="Close selected place"
                >
                  <X className="h-4 w-4" strokeWidth={1.5} />
                </Button>
              </div>
              <Typography variant="sm" className="font-medium text-foreground">
                {placeName}
              </Typography>
              <Button
                variant={favoritePlaceId ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => handleFavoriteSelectedPlace({
                  location: selectedPlace,
                  onPlaceVisited,
                  setFavoritePlaceId,
                  setIsFavoriteSaving,
                  toast,
                })}
                disabled={isFavoriteSaving || favoritePlaceId !== null}
                className="gap-2"
              >
                <Star className={favoritePlaceId ? 'h-4 w-4 fill-current' : 'h-4 w-4'} strokeWidth={1.5} />
                {isFavoriteSaving ? 'Saving...' : 'Favorite'}
              </Button>
              <div className="space-y-3 rounded-md border border-border bg-background p-3">
                <Typography variant="xs" className="font-semibold text-foreground">
                  Place information
                </Typography>
                {isGooglePlaceLoading && (
                  <Typography variant="xs" className="text-muted-foreground">
                    Loading place details...
                  </Typography>
                )}
                {(googlePlaceDetails?.address || selectedPlace.address) && (
                  <PlaceDetailRow icon={<MapPin className="h-4 w-4" strokeWidth={1.5} />}>
                    <Typography variant="xs" className="line-clamp-3 text-foreground">
                      {googlePlaceDetails?.address || selectedPlace.address}
                    </Typography>
                  </PlaceDetailRow>
                )}
                {(openStatus || todayHours) && (
                  <PlaceDetailRow icon={<Clock className="h-4 w-4" strokeWidth={1.5} />}>
                    {openStatus && (
                      <Typography variant="xs" className="text-foreground">
                        {openStatus}
                      </Typography>
                    )}
                    {todayHours && (
                      <Typography variant="xs" className="mt-1 line-clamp-2 text-muted-foreground">
                        {todayHours}
                      </Typography>
                    )}
                  </PlaceDetailRow>
                )}
                {priceLevel && (
                  <PlaceDetailRow icon={<DollarSign className="h-4 w-4" strokeWidth={1.5} />}>
                    <Typography variant="xs" className="text-foreground">
                      {priceLevel}
                    </Typography>
                  </PlaceDetailRow>
                )}
                {googlePlaceDetails?.rating && (
                  <PlaceDetailRow icon={<Star className="h-4 w-4" strokeWidth={1.5} />}>
                    <Typography variant="xs" className="text-foreground">
                      {googlePlaceDetails.rating.toFixed(1)}
                      {googlePlaceDetails.userRatingCount ? ` (${googlePlaceDetails.userRatingCount.toLocaleString()} reviews)` : ''}
                    </Typography>
                  </PlaceDetailRow>
                )}
                {websiteHost && googlePlaceDetails?.websiteUri && (
                  <PlaceDetailRow icon={<Globe className="h-4 w-4" strokeWidth={1.5} />}>
                    <a
                      href={googlePlaceDetails.websiteUri}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-w-0 items-center gap-1 text-xs font-medium text-foreground hover:underline"
                    >
                      <span className="truncate">{websiteHost}</span>
                      <ExternalLink className="h-3 w-3 flex-shrink-0" strokeWidth={1.5} />
                    </a>
                  </PlaceDetailRow>
                )}
                {googlePlaceDetails?.phoneNumber && (
                  <PlaceDetailRow icon={<Phone className="h-4 w-4" strokeWidth={1.5} />}>
                    <a
                      href={`tel:${googlePlaceDetails.phoneNumber}`}
                      className="text-xs font-medium text-foreground hover:underline"
                    >
                      {googlePlaceDetails.phoneNumber}
                    </a>
                  </PlaceDetailRow>
                )}
                {googlePlaceDetails?.googleMapsUri && (
                  <PlaceDetailRow icon={<Map className="h-4 w-4" strokeWidth={1.5} />}>
                    <a
                      href={googlePlaceDetails.googleMapsUri}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-w-0 items-center gap-1 text-xs font-medium text-foreground hover:underline"
                    >
                      <span className="truncate">Open in Google Maps</span>
                      <ExternalLink className="h-3 w-3 flex-shrink-0" strokeWidth={1.5} />
                    </a>
                  </PlaceDetailRow>
                )}
                {placeCategoryLabels.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {placeCategoryLabels.slice(0, 4).map(category => (
                      <span
                        key={category}
                        className="rounded-full border border-border bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                      >
                        {formatPlaceCategory(category)}
                      </span>
                    ))}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <Typography variant="xs" className="text-muted-foreground">
                      Latitude
                    </Typography>
                    <Typography variant="xs" className="font-medium text-foreground">
                      {formatCoordinate(selectedPlace.latitude)}
                    </Typography>
                  </div>
                  <div>
                    <Typography variant="xs" className="text-muted-foreground">
                      Longitude
                    </Typography>
                    <Typography variant="xs" className="font-medium text-foreground">
                      {formatCoordinate(selectedPlace.longitude)}
                    </Typography>
                  </div>
                </div>
                {!isGooglePlaceLoading && !googlePlaceDetails && !selectedPlace.address && (!selectedPlace.categories || selectedPlace.categories.length === 0) && (
                  <Typography variant="xs" className="text-muted-foreground">
                    {isGooglePlacesConfigured
                      ? 'No additional details available for this place.'
                      : 'Add GOOGLE_PLACES_API_KEY to show richer details for this place.'}
                  </Typography>
                )}
              </div>
            </div>
          </div>
        )}
        {(isCategoryLoading || categoryResults.length > 0) && (
          <div className="absolute left-4 top-4 z-10 w-[min(calc(100%-2rem),22rem)] rounded-lg border border-border bg-card shadow-lg">
            <div className="border-b border-border px-3 py-2">
              <Typography variant="xs" className="font-semibold text-foreground">
                {isCategoryLoading ? 'Searching nearby...' : 'Nearby results'}
              </Typography>
            </div>
            {!isCategoryLoading && (
              <div className="max-h-80 overflow-y-auto p-1">
                {categoryResults.map(result => (
                  <button
                    key={result.id}
                    type="button"
                    onClick={() => handleCategoryResultSelect(result)}
                    className="w-full rounded-md px-3 py-2 text-left hover:bg-accent"
                  >
                    <Typography variant="xs" className="truncate font-medium text-foreground">
                      {result.name}
                    </Typography>
                    {result.address && (
                      <Typography variant="xs" className="mt-0.5 line-clamp-2 text-muted-foreground">
                        {result.address}
                      </Typography>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
