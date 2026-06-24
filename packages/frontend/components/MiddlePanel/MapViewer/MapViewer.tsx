import { useTheme } from 'next-themes'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type mapboxgl from 'mapbox-gl'
import { SearchBoxCore, SessionToken } from '@mapbox/search-js-core'
import type { SearchBoxSuggestion } from '@mapbox/search-js-core'
import 'mapbox-gl/dist/mapbox-gl.css'
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'
import { Bike, Car, Clock, DollarSign, Download, Edit3, ExternalLink, Footprints, Globe, Layers, Loader2, Map, MapPin, MousePointer2, Pause, Pentagon, Phone, Play, Route, Ruler, Save, Search, SkipBack, SkipForward, Star, Trash2, X } from 'lucide-react'
import { CONFIG } from '../../../config/config'
import { Button } from '../../common/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../common/ui/dropdown-menu'
import { Input } from '../../common/ui/input'
import { Label } from '../../common/ui/label'
import { Slider } from '../../common/ui/slider'
import { Skeleton } from '../../common/ui/skeleton'
import { Typography } from '../../common/ui/typography'
import { useToast } from '../../common/ui/use-toast'
import type { ImageUrlTabPayload, MapDrawingFeatureCollection, MapPlace, MapPlaceLocation } from '../../../pages/Workspaces/types'
import { buildRainViewerRadarTilesTemplate, buildRainViewerRadarTimeline, fetchRainViewerWeatherMaps, getRainViewerPreferredTileSize } from './handlers/fetchRainViewerRadarTileUrl'
import type { RainViewerRadarFrame } from './handlers/fetchRainViewerRadarTileUrl'
import { advanceRainViewerPlaybackIndex } from './handlers/handleRainViewerRadarPlaybackTick'
import { clampRainViewerFrameIndex, formatRainViewerFrameUtc, stepRainViewerFrameIndex } from './handlers/handleRainViewerRadarFrameStep'
import { getCurrentMapLocation } from './handlers/getCurrentMapLocation'
import { handleGooglePlaceDetails } from './handlers/handleGooglePlaceDetails'
import type { GooglePlaceDetails } from './handlers/handleGooglePlaceDetails'
import { SelectedPlaceGoogleEnrichment } from './SelectedPlaceGoogleEnrichment'
import { handleFavoriteSelectedPlace } from './handlers/handleFavoriteSelectedPlace'
import { resolveSelectedPlaceFavoriteId } from './handlers/resolveSelectedPlaceFavoriteId'
import { handleRadarPlaybackToggle } from './handlers/handleRadarPlaybackToggle'
import { applyMapLayerSettings, handleMapBasemapSelect, handleMapOverlayToggle, registerRainViewerPeriodicRefresh } from './handlers/handleMapLayerChange'
import { setRainViewerRadarTilesTemplate } from './handlers/handleRainViewerRadarTilesUpdate'
import { handleMapPlaceClick } from './handlers/handleMapPlaceClick'
import { clearHighlightedPlaceMapMarkers, setHighlightedPlaceMapMarkers, setSelectedPlaceMapMarker } from './handlers/setSelectedPlaceMapMarker'
import { handleMapSearchSuggest } from './handlers/handleMapSearchSuggest'
import { handleMapSearchSuggestionSelect } from './handlers/handleMapSearchSuggestionSelect'
import {
  handleMapDirectionsClear,
  handleMapDirectionsEndpointQueryChange,
  handleMapDirectionsProfileSelect,
  handleMapDirectionsRouteOptionsRequest,
  handleMapDirectionsSuggestionSelect,
  handleSelectedPlaceDirectionsOpen,
} from './handlers/handleMapDirectionsActions'
import { handleMapDirectionsSuggest } from './handlers/handleMapDirectionsSearch'
import type { MapboxDirectionsProfile, MapboxDirectionsRoute, MapboxDirectionsRoutesByProfile } from './handlers/fetchMapboxDirections'
import {
  formatMapDirectionsDistance,
  formatMapDirectionsDuration,
  mapboxDirectionsProfileLabels,
  mapboxDirectionsProfiles,
} from './handlers/formatMapDirections'
import { handleRecordRecentPlace } from './handlers/handleRecordRecentPlace'
import { handleSelectedPlacePanelClose } from './handlers/handleSelectedPlacePanelClose'
import { handleMapDrawingSave } from './handlers/handleMapDrawingSave'
import {
  handleMapDrawingClear,
  handleMapDrawingDeleteSelected,
  handleMapDrawingLabelChange,
  handleMapDrawingModeChange,
  handleMapDrawingSelectFeature,
  initMapDrawingTools,
  type MapDrawingControl,
  type MapDrawingMode,
} from './handlers/initMapDrawingTools'
import {
  createMapDrawingLabel,
  downloadMapDrawingGeoJson,
  emptyMapDrawingFeatureCollection,
  getMapDrawingFeatureCoordinatePreview,
  normalizeMapDrawingFeatureCollection,
  toDrawFeatureCollection,
  updateMapDrawingFeatureLabel,
} from './handlers/mapDrawingGeoJson'
import { getMapDrawingTypeLabel } from './handlers/mapDrawingMeasurements'
import {
  handleTemperatureForecastBandChange,
  handleTemperatureOverlayOpacitySliderChange,
} from './handlers/handleTemperatureOverlayControls'
import {
  defaultTemperatureOverlayOpacity,
  defaultTemperatureRasterArrayBand,
  temperatureForecastBandIds,
} from './handlers/temperatureLayerConstants'
import { initMapboxMap } from './handlers/initMapboxMap'
import {
  defaultMapBasemapId,
  getMapBasemapOption,
  mapBasemapOptions,
  mapOverlayOptions,
  type MapBasemapId,
  type MapOverlayId,
} from './map-layer-options'

interface MapViewerProps {
  place?: MapPlaceLocation | null
  highlightedPlaces?: MapPlaceLocation[]
  onPlaceVisited?: React.Dispatch<MapPlace>
  onPlacePhotoOpen?: (image: ImageUrlTabPayload) => void
}

const defaultLocation: MapPlaceLocation = {
  name: 'New place',
  longitude: -98.5795,
  latitude: 39.8283,
  zoom: 3,
}

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

function SelectedPlaceDetailsSkeleton() {
  return (
    <div
      className="space-y-4"
      aria-busy="true"
      aria-label="Loading place details"
    >
      {[0, 1, 2].map(row => (
        <div key={row} className="flex gap-3">
          <Skeleton className="mt-0.5 h-5 w-5 flex-shrink-0 rounded-sm" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3 w-full max-w-[92%]" />
            <Skeleton className="h-3 w-[58%] max-w-[75%]" />
          </div>
        </div>
      ))}
      <div className="flex gap-2 overflow-hidden pt-1">
        <Skeleton className="h-20 w-24 flex-shrink-0 rounded-md" />
        <Skeleton className="h-20 w-24 flex-shrink-0 rounded-md" />
        <Skeleton className="h-20 w-24 flex-shrink-0 rounded-md" />
      </div>
      <div className="space-y-2 border-t border-border pt-3">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-12 w-full rounded-md" />
        <Skeleton className="h-12 w-full rounded-md" />
      </div>
      <div className="flex flex-wrap gap-1.5">
        <Skeleton className="h-6 w-14 rounded-full" />
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
    </div>
  )
}

interface MapDirectionsSearchFieldProps {
  id: string
  label: string
  value: string
  placeholder: string
  suggestions: SearchBoxSuggestion[]
  isOpen: boolean
  isLoading: boolean
  onQueryChange: (value: string) => void
  onFocus: () => void
  onSelectSuggestion: (suggestion: SearchBoxSuggestion) => void
}

const mapDirectionsProfileIcons = {
  driving: Car,
  walking: Footprints,
  cycling: Bike,
} satisfies Record<MapboxDirectionsProfile, React.ComponentType<{ className?: string; strokeWidth?: number }>>

function MapDirectionsSearchField({
  id,
  label,
  value,
  placeholder,
  suggestions,
  isOpen,
  isLoading,
  onQueryChange,
  onFocus,
  onSelectSuggestion,
}: Readonly<MapDirectionsSearchFieldProps>) {
  return (
    <div className="relative space-y-1.5">
      <Label htmlFor={id} className="text-xs text-muted-foreground">
        {label}
      </Label>
      <Input
        id={id}
        value={value}
        onChange={event => onQueryChange(event.target.value)}
        onFocus={onFocus}
        placeholder={placeholder}
        variant="muted"
        className="h-8"
      />
      {(isOpen || isLoading) && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-56 overflow-y-auto rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-lg">
          {isLoading && (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              Searching...
            </div>
          )}
          {!isLoading && suggestions.map(suggestion => (
            <button
              key={suggestion.mapbox_id}
              type="button"
              onMouseDown={event => {
                event.preventDefault()
                onSelectSuggestion(suggestion)
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
          {!isLoading && suggestions.length === 0 && (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              No places found
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function MapViewer({ place, highlightedPlaces, onPlaceVisited, onPlacePhotoOpen }: Readonly<MapViewerProps>) {
  const { toast } = useToast()
  const { theme, resolvedTheme } = useTheme()
  const placeRef = useRef(place)
  placeRef.current = place
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const drawingControlRef = useRef<MapDrawingControl | null>(null)
  const drawingCleanupRef = useRef<(() => void) | null>(null)
  const searchMarkerRef = useRef<mapboxgl.Marker | null>(null)
  const directionsOriginMarkerRef = useRef<mapboxgl.Marker | null>(null)
  const directionsDestinationMarkerRef = useRef<mapboxgl.Marker | null>(null)
  const highlightMarkerRefs = useRef<mapboxgl.Marker[]>([])
  const drawingCollectionRef = useRef<MapDrawingFeatureCollection>(normalizeMapDrawingFeatureCollection(place?.drawings))
  const searchSessionTokenRef = useRef<SessionToken | null>(null)
  const directionsOriginSessionTokenRef = useRef<SessionToken | null>(null)
  const directionsDestinationSessionTokenRef = useRef<SessionToken | null>(null)
  const directionsAbortRef = useRef<AbortController | null>(null)
  const selectedSearchQueryRef = useRef('')
  const recordRecentPlaceRef = useRef((location: MapPlaceLocation) => {
    void location
  })
  const placeNameRef = useRef(place?.name || 'New place')
  const isDarkThemeRef = useRef(false)
  const [currentLocation, setCurrentLocation] = useState<MapPlaceLocation>(place || defaultLocation)
  const [drawingCollection, setDrawingCollection] = useState<MapDrawingFeatureCollection>(
    normalizeMapDrawingFeatureCollection(place?.drawings),
  )
  const [drawingMode, setDrawingMode] = useState<MapDrawingMode>('select')
  const [selectedDrawingFeatureIds, setSelectedDrawingFeatureIds] = useState<string[]>([])
  const [isDrawingSaving, setIsDrawingSaving] = useState(false)
  const [isDrawingToolsReady, setIsDrawingToolsReady] = useState(false)
  const [drawingSaveState, setDrawingSaveState] = useState<'idle' | 'saved' | 'error'>('idle')
  const [placeName, setPlaceName] = useState(place?.name || 'New place')
  const [searchValue, setSearchValue] = useState('')
  const [searchSuggestions, setSearchSuggestions] = useState<SearchBoxSuggestion[]>([])
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isSearchLoading, setIsSearchLoading] = useState(false)
  const [directionsOrigin, setDirectionsOrigin] = useState<MapPlaceLocation | null>(null)
  const [directionsOriginQuery, setDirectionsOriginQuery] = useState('')
  const [directionsOriginSuggestions, setDirectionsOriginSuggestions] = useState<SearchBoxSuggestion[]>([])
  const [isDirectionsOriginOpen, setIsDirectionsOriginOpen] = useState(false)
  const [isDirectionsOriginLoading, setIsDirectionsOriginLoading] = useState(false)
  const [directionsDestination, setDirectionsDestination] = useState<MapPlaceLocation | null>(null)
  const [directionsDestinationQuery, setDirectionsDestinationQuery] = useState('')
  const [directionsDestinationSuggestions, setDirectionsDestinationSuggestions] = useState<SearchBoxSuggestion[]>([])
  const [isDirectionsDestinationOpen, setIsDirectionsDestinationOpen] = useState(false)
  const [isDirectionsDestinationLoading, setIsDirectionsDestinationLoading] = useState(false)
  const [directionsProfile, setDirectionsProfile] = useState<MapboxDirectionsProfile>('driving')
  const [directionsRoute, setDirectionsRoute] = useState<MapboxDirectionsRoute | null>(null)
  const [directionsRoutesByProfile, setDirectionsRoutesByProfile] = useState<MapboxDirectionsRoutesByProfile>({})
  const [directionsError, setDirectionsError] = useState<string | null>(null)
  const [isDirectionsLoading, setIsDirectionsLoading] = useState(false)
  const [isDirectionsPanelOpen, setIsDirectionsPanelOpen] = useState(false)
  const [selectedPlace, setSelectedPlace] = useState<MapPlaceLocation | null>(null)
  const [isMapReady, setIsMapReady] = useState(false)
  const [mapLoadError, setMapLoadError] = useState<string | null>(null)
  const [mapRemountKey, setMapRemountKey] = useState(0)
  const [favoritePlaceId, setFavoritePlaceId] = useState<string | null>(null)
  const [isFavoriteSaving, setIsFavoriteSaving] = useState(false)
  const [googlePlaceDetails, setGooglePlaceDetails] = useState<GooglePlaceDetails | null>(null)
  const [isGooglePlaceLoading, setIsGooglePlaceLoading] = useState(false)
  const [isGooglePlacesConfigured, setIsGooglePlacesConfigured] = useState(true)
  const [mapboxModule, setMapboxModule] = useState<typeof mapboxgl | null>(null)
  const [selectedBasemapId, setSelectedBasemapId] = useState<MapBasemapId>(defaultMapBasemapId)
  const [activeOverlayIds, setActiveOverlayIds] = useState<MapOverlayId[]>([])
  const [temperatureOverlayOpacity, setTemperatureOverlayOpacity] = useState(defaultTemperatureOverlayOpacity)
  const [temperatureRasterArrayBand, setTemperatureRasterArrayBand] = useState(defaultTemperatureRasterArrayBand)
  const [rainViewerHost, setRainViewerHost] = useState('')
  const [rainViewerTimeline, setRainViewerTimeline] = useState<RainViewerRadarFrame[]>([])
  const [rainViewerTileSize, setRainViewerTileSize] = useState<256 | 512>(256)
  const [rainViewerFrameIndex, setRainViewerFrameIndex] = useState(0)
  const [isRainViewerPlaying, setIsRainViewerPlaying] = useState(false)
  const [isRadarPlaybackPreloading, setIsRadarPlaybackPreloading] = useState(false)
  const radarPlaybackPreloadAbortRef = useRef<AbortController | null>(null)
  const mapboxToken = CONFIG.mapboxToken
  const isDarkTheme = (resolvedTheme || theme) !== 'light'
  const searchCore = useMemo(() => {
    if (!mapboxToken.trim()) return null
    return new SearchBoxCore({ accessToken: mapboxToken })
  }, [mapboxToken])
  const isRadarActive = useMemo(() => activeOverlayIds.includes('radar'), [activeOverlayIds])
  const resolvedHighlightedPlaces = useMemo(() => highlightedPlaces ?? [], [highlightedPlaces])
  const isTemperatureOverlayActive = useMemo(
    () => activeOverlayIds.includes('temperature'),
    [activeOverlayIds],
  )
  const isRainViewerPlayingRef = useRef(false)
  const rainViewerTimelineLengthRef = useRef(0)
  const rainViewerPlaybackIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const RADAR_PLAYBACK_MS = 500
  const selectedDrawingFeatureId = selectedDrawingFeatureIds[0] ?? null
  const selectedDrawingFeature = useMemo(
    () => drawingCollection.features.find(feature =>
      (feature.id ?? feature.properties.id) === selectedDrawingFeatureId) ?? null,
    [drawingCollection.features, selectedDrawingFeatureId],
  )
  const hasDrawings = drawingCollection.features.length > 0

  const loadRainViewerRadarMetadata = useCallback(async () => {
    const data = await fetchRainViewerWeatherMaps()
    if (!data) return

    const timeline = buildRainViewerRadarTimeline(data.pastFrames, data.nowcastFrames)
    if (!timeline.length) return

    const tileSize = getRainViewerPreferredTileSize()
    setRainViewerHost(data.host)
    setRainViewerTileSize(tileSize)
    setRainViewerTimeline(timeline)
    setRainViewerFrameIndex(prev => {
      if (!isRainViewerPlayingRef.current) return timeline.length - 1
      return clampRainViewerFrameIndex(timeline.length, prev)
    })
  }, [])

  const handleDrawingCollectionChange = useCallback((collection: MapDrawingFeatureCollection) => {
    setDrawingCollection(collection)
    setDrawingSaveState('idle')
    setCurrentLocation(location => ({
      ...location,
      drawings: collection,
    }))
  }, [])

  const recordRecentPlace = useCallback(async (location: MapPlaceLocation) => {
    try {
      const recentPlace = await handleRecordRecentPlace({ location })
      onPlaceVisited?.(recentPlace)
    } catch {
      toast({ title: 'Error', description: 'Failed to update recent places', variant: 'destructive' })
    }
  }, [onPlaceVisited, toast])

  const handleSaveMapDrawingsClick = useCallback(async () => {
    setIsDrawingSaving(true)
    setDrawingSaveState('idle')
    try {
      const savedPlace = await handleMapDrawingSave({
        location: {
          ...currentLocation,
          name: placeName,
          drawings: drawingCollection,
        },
        drawings: drawingCollection,
      })
      const savedLocation = {
        id: savedPlace.id,
        name: savedPlace.name,
        longitude: savedPlace.longitude,
        latitude: savedPlace.latitude,
        zoom: savedPlace.zoom,
        drawings: savedPlace.drawings ?? drawingCollection,
      }
      setCurrentLocation(savedLocation)
      setDrawingCollection(savedLocation.drawings ?? emptyMapDrawingFeatureCollection)
      onPlaceVisited?.(savedPlace)
      setDrawingSaveState('saved')
      toast({ title: 'Success', description: 'Map drawings saved' })
    } catch {
      setDrawingSaveState('error')
      toast({ title: 'Error', description: 'Failed to save map drawings', variant: 'destructive' })
    } finally {
      setIsDrawingSaving(false)
    }
  }, [currentLocation, drawingCollection, onPlaceVisited, placeName, toast])

  const handleDrawingLabelInputChange = useCallback((featureId: string, label: string) => {
    handleMapDrawingLabelChange(drawingControlRef.current, featureId, label)
    setDrawingCollection(collection => updateMapDrawingFeatureLabel(collection, featureId, label))
    setDrawingSaveState('idle')
  }, [])

  const handleExportDrawingsClick = useCallback(() => {
    downloadMapDrawingGeoJson(drawingCollection)
  }, [drawingCollection])

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
    drawingCollectionRef.current = drawingCollection
  }, [drawingCollection])

  useEffect(() => {
    const query = searchValue.trim()
    if (selectedSearchQueryRef.current === query) {
      setSearchSuggestions([])
      setIsSearchOpen(false)
      setIsSearchLoading(false)
      return
    }

    if (!isMapReady || query.length < 2 || !searchCore) {
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
    const query = directionsOriginQuery.trim()
    if (directionsOrigin?.name?.trim() === query) {
      setDirectionsOriginSuggestions([])
      setIsDirectionsOriginOpen(false)
      setIsDirectionsOriginLoading(false)
      return
    }

    if (!isMapReady || query.length < 2 || !searchCore) {
      directionsOriginSessionTokenRef.current = null
      setDirectionsOriginSuggestions([])
      setIsDirectionsOriginOpen(false)
      setIsDirectionsOriginLoading(false)
      return
    }

    const abortController = new AbortController()
    const timeout = window.setTimeout(() => {
      const sessionToken = directionsOriginSessionTokenRef.current || new SessionToken()
      directionsOriginSessionTokenRef.current = sessionToken
      setIsDirectionsOriginLoading(true)

      handleMapDirectionsSuggest({
        searchCore,
        query,
        proximity: currentLocation,
        sessionToken,
        signal: abortController.signal,
      })
        .then(suggestions => {
          setDirectionsOriginSuggestions(suggestions)
          setIsDirectionsOriginOpen(suggestions.length > 0)
        })
        .catch(error => {
          if (error instanceof DOMException && error.name === 'AbortError') return
          setDirectionsOriginSuggestions([])
          setIsDirectionsOriginOpen(false)
        })
        .finally(() => setIsDirectionsOriginLoading(false))
    }, 250)

    return () => {
      window.clearTimeout(timeout)
      abortController.abort()
    }
  }, [currentLocation, directionsOrigin?.name, directionsOriginQuery, isMapReady, searchCore])

  useEffect(() => {
    const query = directionsDestinationQuery.trim()
    if (directionsDestination?.name?.trim() === query) {
      setDirectionsDestinationSuggestions([])
      setIsDirectionsDestinationOpen(false)
      setIsDirectionsDestinationLoading(false)
      return
    }

    if (!isMapReady || query.length < 2 || !searchCore) {
      directionsDestinationSessionTokenRef.current = null
      setDirectionsDestinationSuggestions([])
      setIsDirectionsDestinationOpen(false)
      setIsDirectionsDestinationLoading(false)
      return
    }

    const abortController = new AbortController()
    const timeout = window.setTimeout(() => {
      const sessionToken = directionsDestinationSessionTokenRef.current || new SessionToken()
      directionsDestinationSessionTokenRef.current = sessionToken
      setIsDirectionsDestinationLoading(true)

      handleMapDirectionsSuggest({
        searchCore,
        query,
        proximity: currentLocation,
        sessionToken,
        signal: abortController.signal,
      })
        .then(suggestions => {
          setDirectionsDestinationSuggestions(suggestions)
          setIsDirectionsDestinationOpen(suggestions.length > 0)
        })
        .catch(error => {
          if (error instanceof DOMException && error.name === 'AbortError') return
          setDirectionsDestinationSuggestions([])
          setIsDirectionsDestinationOpen(false)
        })
        .finally(() => setIsDirectionsDestinationLoading(false))
    }, 250)

    return () => {
      window.clearTimeout(timeout)
      abortController.abort()
    }
  }, [currentLocation, directionsDestination?.name, directionsDestinationQuery, isMapReady, searchCore])

  useEffect(() => {
    let isMounted = true
    let resizeObserver: ResizeObserver | null = null

    async function setupMap() {
      if (!containerRef.current || !mapboxToken || mapRef.current) return
      const container = containerRef.current
      setIsMapReady(false)
      setMapLoadError(null)
      setIsDrawingToolsReady(false)

      try {
        const placeSnapshot = placeRef.current
        const initialLocation = placeSnapshot || await getCurrentMapLocation(defaultLocation)
        const initialDrawings = normalizeMapDrawingFeatureCollection(initialLocation.drawings)
        const initialName = initialLocation.name || 'Current location'
        placeNameRef.current = initialName
        setDrawingCollection(initialDrawings)
        setCurrentLocation({
          ...initialLocation,
          name: initialName,
          drawings: initialDrawings,
        })
        setPlaceName(initialName)
        setSearchValue('')

        const { map, mapboxgl: loadedMapboxModule } = await initMapboxMap({
          container,
          token: mapboxToken,
          initialPlace: initialLocation,
          isDarkTheme: isDarkThemeRef.current,
          basemapId: defaultMapBasemapId,
          onMoveEnd: location => setCurrentLocation(current => ({
            ...current,
            ...location,
            name: placeNameRef.current || location.name,
            drawings: current.drawings,
          })),
        })

        if (!isMounted) {
          map.remove()
          return
        }

        function onMapError(e: { error?: Error }) {
          if (!isMounted) return
          const message =
            e.error instanceof Error ? e.error.message : 'Map failed to load styles or tiles'
          setMapLoadError(message)
          toast({
            title: 'Map error',
            description: message,
            variant: 'destructive',
          })
        }

        map.once('error', onMapError)

        const drawingTools = await initMapDrawingTools({
          map,
          initialDrawings,
          onChange: handleDrawingCollectionChange,
          onModeChange: setDrawingMode,
          onSelectionChange: setSelectedDrawingFeatureIds,
        })

        if (!isMounted) {
          drawingTools.cleanup()
          map.remove()
          return
        }

        drawingControlRef.current = drawingTools.draw
        drawingCleanupRef.current = drawingTools.cleanup
        setIsDrawingToolsReady(true)

        map.on('click', event => {
          if (drawingControlRef.current?.getMode() !== 'simple_select') return

          const selectedLocation = handleMapPlaceClick({
            event,
            map,
            mapbox: loadedMapboxModule,
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

          if (selectedLocation) {
            const selectedLocationWithDrawings = {
              ...selectedLocation,
              drawings: drawingCollectionRef.current,
            }
            setCurrentLocation(selectedLocationWithDrawings)
            setSelectedPlace(selectedLocationWithDrawings)
            recordRecentPlaceRef.current(selectedLocationWithDrawings)
          }
        })
        mapRef.current = map
        setMapboxModule(loadedMapboxModule)

        const resizeMap = () => map.resize()
        const markMapReady = () => {
          if (!isMounted) return
          resizeMap()
          setMapLoadError(null)
          setIsMapReady(true)
        }

        requestAnimationFrame(resizeMap)
        if (map.loaded()) markMapReady()
        else map.once('load', markMapReady)

        if (typeof ResizeObserver !== 'undefined') {
          resizeObserver = new ResizeObserver(resizeMap)
          resizeObserver.observe(container)
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        console.error('[MapViewer] Mapbox init failed', error)
        setMapLoadError(message)
        toast({
          title: 'Error',
          description: `Failed to load map: ${message}`,
          variant: 'destructive',
        })
      }
    }

    setupMap()

    return () => {
      isMounted = false
      resizeObserver?.disconnect()
      drawingCleanupRef.current?.()
      drawingCleanupRef.current = null
      drawingControlRef.current = null
      setIsDrawingToolsReady(false)
      searchMarkerRef.current?.remove()
      searchMarkerRef.current = null
      directionsAbortRef.current?.abort()
      directionsAbortRef.current = null
      directionsOriginMarkerRef.current?.remove()
      directionsOriginMarkerRef.current = null
      directionsDestinationMarkerRef.current?.remove()
      directionsDestinationMarkerRef.current = null
      clearHighlightedPlaceMapMarkers(highlightMarkerRefs)
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
    // Intentionally omit `place` and `toast`: place updates are handled by flyTo (see effect below).
    // Including `place` remounts the map whenever the tab metadata updates (e.g. recent places) and
    // leaves the UI stuck on "Loading map" because `load` never fires on a torn-down instance.
  }, [handleDrawingCollectionChange, mapboxToken, mapRemountKey])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    applyMapLayerSettings({
      map,
      basemapId: selectedBasemapId,
      activeOverlayIds,
      isDarkTheme,
      temperatureOverlayOpacity,
      temperatureRasterArrayBand,
    })
  }, [activeOverlayIds, isDarkTheme, selectedBasemapId, temperatureOverlayOpacity, temperatureRasterArrayBand])

  useEffect(() => {
    isRainViewerPlayingRef.current = isRainViewerPlaying
  }, [isRainViewerPlaying])

  useEffect(() => {
    rainViewerTimelineLengthRef.current = rainViewerTimeline.length
  }, [rainViewerTimeline.length])

  useEffect(() => {
    if (!isRadarActive) {
      radarPlaybackPreloadAbortRef.current?.abort()
      radarPlaybackPreloadAbortRef.current = null
      setIsRadarPlaybackPreloading(false)
      setRainViewerHost('')
      setRainViewerTimeline([])
      setRainViewerFrameIndex(0)
      setIsRainViewerPlaying(false)
      registerRainViewerPeriodicRefresh(null)
      return
    }

    registerRainViewerPeriodicRefresh(() => {
      void loadRainViewerRadarMetadata()
    })
    void loadRainViewerRadarMetadata()

    return () => registerRainViewerPeriodicRefresh(null)
  }, [isRadarActive, loadRainViewerRadarMetadata])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !isMapReady || !isRadarActive || !rainViewerHost || !rainViewerTimeline.length) return

    const frame = rainViewerTimeline[rainViewerFrameIndex]
    if (!frame) return

    const template = buildRainViewerRadarTilesTemplate(rainViewerHost, frame.path, { tileSize: rainViewerTileSize })
    setRainViewerRadarTilesTemplate(map, template)
  }, [isMapReady, isRadarActive, rainViewerHost, rainViewerTimeline, rainViewerFrameIndex, rainViewerTileSize])

  useEffect(() => {
    if (!isRadarActive || !isRainViewerPlaying || rainViewerTimeline.length <= 1) {
      if (rainViewerPlaybackIntervalRef.current) {
        clearInterval(rainViewerPlaybackIntervalRef.current)
        rainViewerPlaybackIntervalRef.current = null
      }
      return
    }

    rainViewerPlaybackIntervalRef.current = setInterval(() => {
      setRainViewerFrameIndex(i => advanceRainViewerPlaybackIndex(rainViewerTimelineLengthRef.current, i))
    }, RADAR_PLAYBACK_MS)

    return () => {
      if (rainViewerPlaybackIntervalRef.current) {
        clearInterval(rainViewerPlaybackIntervalRef.current)
        rainViewerPlaybackIntervalRef.current = null
      }
    }
  }, [isRadarActive, isRainViewerPlaying, rainViewerTimeline.length])

  const placeFlyToKey = useMemo(() => {
    if (!place) return ''
    return [
      place.id ?? '',
      place.longitude,
      place.latitude,
      place.zoom,
      (place.name ?? '').trim(),
      JSON.stringify(place.drawings ?? emptyMapDrawingFeatureCollection),
    ].join('|')
  }, [place])

  const highlightedPlacesKey = useMemo(() => (
    resolvedHighlightedPlaces
      .map(highlightedPlace => [
        highlightedPlace.longitude,
        highlightedPlace.latitude,
        highlightedPlace.zoom,
        (highlightedPlace.name ?? '').trim(),
      ].join('|'))
      .join('::')
  ), [resolvedHighlightedPlaces])

  useEffect(() => {
    const map = mapRef.current
    const p = placeRef.current
    if (!map || !p || !placeFlyToKey || !mapboxModule) return

    const nextPlace = {
      ...p,
      name: p.name || 'Selected place',
      drawings: normalizeMapDrawingFeatureCollection(p.drawings),
    }
    placeNameRef.current = nextPlace.name
    selectedSearchQueryRef.current = nextPlace.name.trim()
    drawingControlRef.current?.set(toDrawFeatureCollection(nextPlace.drawings))
    setDrawingCollection(nextPlace.drawings)
    setDrawingSaveState('saved')
    setSelectedDrawingFeatureIds([])
    setCurrentLocation(nextPlace)
    setSelectedPlace(nextPlace)
    setPlaceName(nextPlace.name)
    setSearchValue(nextPlace.name)
    setSelectedPlaceMapMarker(map, mapboxModule, searchMarkerRef, nextPlace.longitude, nextPlace.latitude)
    map.flyTo({
      center: [nextPlace.longitude, nextPlace.latitude],
      zoom: nextPlace.zoom,
      duration: 900,
      essential: true,
    })
  }, [placeFlyToKey, isMapReady, mapboxModule])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapboxModule || !isMapReady) return

    setHighlightedPlaceMapMarkers({
      map,
      mapbox: mapboxModule,
      highlightMarkerRefs,
      places: resolvedHighlightedPlaces,
    })
  }, [resolvedHighlightedPlaces, highlightedPlacesKey, isMapReady, mapboxModule])

  useEffect(() => {
    if (!selectedPlace) {
      setFavoritePlaceId(null)
      setGooglePlaceDetails(null)
      setIsGooglePlaceLoading(false)
      return
    }

    let isCancelled = false
    const abortController = new AbortController()
    setGooglePlaceDetails(null)
    setIsGooglePlaceLoading(true)

    resolveSelectedPlaceFavoriteId(selectedPlace)
      .then(favoriteId => {
        if (!isCancelled) setFavoritePlaceId(favoriteId)
      })
      .catch(() => {
        if (!isCancelled) setFavoritePlaceId(null)
      })

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

  useEffect(() => {
    setIsDirectionsPanelOpen(false)
    handleMapDirectionsClear({
      map: mapRef.current,
      abortRef: directionsAbortRef,
      originMarkerRef: directionsOriginMarkerRef,
      destinationMarkerRef: directionsDestinationMarkerRef,
      setOrigin: setDirectionsOrigin,
      setDestination: setDirectionsDestination,
      setOriginQuery: setDirectionsOriginQuery,
      setDestinationQuery: setDirectionsDestinationQuery,
      setRoute: setDirectionsRoute,
      setRoutesByProfile: setDirectionsRoutesByProfile,
      setError: setDirectionsError,
      setIsLoading: setIsDirectionsLoading,
    })
  }, [selectedPlace])

  useEffect(() => {
    if (!isDirectionsPanelOpen || !directionsOrigin || !directionsDestination || !mapboxModule) return

    void handleMapDirectionsRouteOptionsRequest({
      map: mapRef.current,
      mapbox: mapboxModule,
      token: mapboxToken,
      origin: directionsOrigin,
      destination: directionsDestination,
      profile: directionsProfile,
      abortRef: directionsAbortRef,
      originMarkerRef: directionsOriginMarkerRef,
      destinationMarkerRef: directionsDestinationMarkerRef,
      setRoute: setDirectionsRoute,
      setRoutesByProfile: setDirectionsRoutesByProfile,
      setIsLoading: setIsDirectionsLoading,
      setError: setDirectionsError,
    })
  }, [directionsDestination, directionsOrigin, isDirectionsPanelOpen, mapboxModule, mapboxToken])

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
  const selectedBasemap = getMapBasemapOption(selectedBasemapId)
  const drawingSaveLabel = drawingSaveState === 'saved'
    ? 'Saved'
    : drawingSaveState === 'error'
      ? 'Save failed'
      : hasDrawings
        ? 'Unsaved changes'
        : 'No drawings'
  const selectedDrawingLabel = selectedDrawingFeature
    ? createMapDrawingLabel(selectedDrawingFeature, drawingCollection.features.indexOf(selectedDrawingFeature))
    : ''

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="relative z-20 border-b border-border bg-card px-4 py-3">
        <div className="flex items-center gap-2">
          {isMapReady && mapRef.current && mapboxModule && (
            <div className="relative w-72 flex-shrink-0 lg:w-80">
              <Search
                className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
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
                variant="muted"
                className="h-8 pl-8"
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
                        if (!mapRef.current || !mapboxModule || !searchCore) return

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
                            setSearchSuggestions([])
                            setIsSearchOpen(false)
                          },
                        })
                        if (selectedLocation) {
                          const selectedLocationWithDrawings = {
                            ...selectedLocation,
                            drawings: drawingCollectionRef.current,
                          }
                          selectedSearchQueryRef.current = selectedLocation.name?.trim() ?? ''
                          setCurrentLocation(selectedLocationWithDrawings)
                          setSelectedPlace(selectedLocationWithDrawings)
                          void recordRecentPlace(selectedLocationWithDrawings)
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
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <div className="flex shrink-0 items-center gap-1 rounded-md border border-border bg-background p-0.5">
              <Button
                type="button"
                variant={drawingMode === 'select' ? 'secondary' : 'ghost'}
                size="xs"
                disabled={!isMapReady || !isDrawingToolsReady}
                aria-pressed={drawingMode === 'select'}
                aria-label="Select drawings"
                className="h-7 gap-1.5 px-2"
                onClick={() => handleMapDrawingModeChange(drawingControlRef.current, 'select', selectedDrawingFeatureId ?? undefined)}
              >
                <MousePointer2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                <span className="hidden xl:inline">Select</span>
              </Button>
              <Button
                type="button"
                variant={drawingMode === 'point' ? 'secondary' : 'ghost'}
                size="xs"
                disabled={!isMapReady || !isDrawingToolsReady}
                aria-pressed={drawingMode === 'point'}
                aria-label="Draw point"
                className="h-7 gap-1.5 px-2"
                onClick={() => handleMapDrawingModeChange(drawingControlRef.current, 'point')}
              >
                <MapPin className="h-3.5 w-3.5" strokeWidth={1.5} />
                <span className="hidden xl:inline">Point</span>
              </Button>
              <Button
                type="button"
                variant={drawingMode === 'line' ? 'secondary' : 'ghost'}
                size="xs"
                disabled={!isMapReady || !isDrawingToolsReady}
                aria-pressed={drawingMode === 'line'}
                aria-label="Measure line"
                className="h-7 gap-1.5 px-2"
                onClick={() => handleMapDrawingModeChange(drawingControlRef.current, 'line')}
              >
                <Ruler className="h-3.5 w-3.5" strokeWidth={1.5} />
                <span className="hidden xl:inline">Line</span>
              </Button>
              <Button
                type="button"
                variant={drawingMode === 'polygon' ? 'secondary' : 'ghost'}
                size="xs"
                disabled={!isMapReady || !isDrawingToolsReady}
                aria-pressed={drawingMode === 'polygon'}
                aria-label="Measure area"
                className="h-7 gap-1.5 px-2"
                onClick={() => handleMapDrawingModeChange(drawingControlRef.current, 'polygon')}
              >
                <Pentagon className="h-3.5 w-3.5" strokeWidth={1.5} />
                <span className="hidden xl:inline">Area</span>
              </Button>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  disabled={!isMapReady || !isDrawingToolsReady}
                  className="flex-shrink-0 gap-1.5"
                >
                  <Ruler className="h-3.5 w-3.5" strokeWidth={1.5} />
                  <span className="hidden sm:inline">Drawing</span>
                  <span className="text-muted-foreground">{drawingSaveLabel}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="max-h-[min(38rem,calc(100vh-8rem))] w-80 overflow-y-auto p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <DropdownMenuLabel className="px-0 py-0">Drawing tools</DropdownMenuLabel>
                    <Typography variant="xs" className="text-muted-foreground">
                      Draw points, measure lines, and calculate areas.
                    </Typography>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      aria-label="Export drawings as GeoJSON"
                      disabled={!hasDrawings}
                      onClick={handleExportDrawingsClick}
                    >
                      <Download className="h-3.5 w-3.5" strokeWidth={1.5} />
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon-xs"
                      aria-label="Save drawings"
                      disabled={isDrawingSaving}
                      onClick={handleSaveMapDrawingsClick}
                    >
                      {isDrawingSaving
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.5} />
                        : <Save className="h-3.5 w-3.5" strokeWidth={1.5} />}
                    </Button>
                  </div>
                </div>

                <DropdownMenuSeparator />

                <div className="flex flex-wrap gap-1">
                  <Button
                    type="button"
                    variant={drawingMode === 'select' ? 'secondary' : 'ghost'}
                    size="xs"
                    className="gap-1.5"
                    onClick={() => handleMapDrawingModeChange(drawingControlRef.current, 'select', selectedDrawingFeatureId ?? undefined)}
                  >
                    <MousePointer2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                    Select
                  </Button>
                  <Button
                    type="button"
                    variant={drawingMode === 'point' ? 'secondary' : 'ghost'}
                    size="xs"
                    className="gap-1.5"
                    onClick={() => handleMapDrawingModeChange(drawingControlRef.current, 'point')}
                  >
                    <MapPin className="h-3.5 w-3.5" strokeWidth={1.5} />
                    Point
                  </Button>
                  <Button
                    type="button"
                    variant={drawingMode === 'line' ? 'secondary' : 'ghost'}
                    size="xs"
                    className="gap-1.5"
                    onClick={() => handleMapDrawingModeChange(drawingControlRef.current, 'line')}
                  >
                    <Ruler className="h-3.5 w-3.5" strokeWidth={1.5} />
                    Line
                  </Button>
                  <Button
                    type="button"
                    variant={drawingMode === 'polygon' ? 'secondary' : 'ghost'}
                    size="xs"
                    className="gap-1.5"
                    onClick={() => handleMapDrawingModeChange(drawingControlRef.current, 'polygon')}
                  >
                    <Pentagon className="h-3.5 w-3.5" strokeWidth={1.5} />
                    Area
                  </Button>
                  <Button
                    type="button"
                    variant={drawingMode === 'edit' ? 'secondary' : 'ghost'}
                    size="xs"
                    className="gap-1.5"
                    disabled={!selectedDrawingFeatureId}
                    onClick={() => handleMapDrawingModeChange(drawingControlRef.current, 'edit', selectedDrawingFeatureId ?? undefined)}
                  >
                    <Edit3 className="h-3.5 w-3.5" strokeWidth={1.5} />
                    Edit
                  </Button>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    className="gap-1.5"
                    disabled={!selectedDrawingFeatureId}
                    onClick={() => handleMapDrawingDeleteSelected(drawingControlRef.current)}
                  >
                    <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                    Delete selected
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    disabled={!hasDrawings}
                    onClick={() => {
                      handleMapDrawingClear(drawingControlRef.current)
                      handleDrawingCollectionChange(emptyMapDrawingFeatureCollection)
                      setSelectedDrawingFeatureIds([])
                    }}
                  >
                    Clear all
                  </Button>
                </div>

                {selectedDrawingFeature && (
                  <div className="mt-3 rounded-md border border-border bg-background p-2">
                    <Typography variant="xs" className="font-medium text-foreground">
                      Selected: {selectedDrawingLabel}
                    </Typography>
                    <Typography variant="xs" className="mt-1 text-muted-foreground">
                      {selectedDrawingFeature.properties.measurement?.label
                        || getMapDrawingFeatureCoordinatePreview(selectedDrawingFeature)
                        || getMapDrawingTypeLabel(selectedDrawingFeature)}
                    </Typography>
                  </div>
                )}

                <DropdownMenuSeparator />

                <div className="space-y-2">
                  {drawingCollection.features.length === 0 ? (
                    <Typography variant="xs" className="rounded-md border border-dashed border-border px-3 py-4 text-center text-muted-foreground">
                      Draw a point, line, or area to start measuring.
                    </Typography>
                  ) : drawingCollection.features.map((feature, index) => {
                    const featureId = String(feature.id ?? feature.properties.id ?? `drawing-${index + 1}`)
                    const isSelected = selectedDrawingFeatureIds.includes(featureId)

                    return (
                      <div
                        key={featureId}
                        className={isSelected
                          ? 'rounded-md border border-primary bg-accent p-2'
                          : 'rounded-md border border-border bg-background p-2'}
                      >
                        <button
                          type="button"
                          className="w-full min-w-0 text-left"
                          onClick={() => handleMapDrawingSelectFeature(drawingControlRef.current, featureId)}
                        >
                          <Typography variant="xs" className="font-medium text-foreground">
                            {getMapDrawingTypeLabel(feature)}
                          </Typography>
                          <Typography variant="xs" className="mt-0.5 text-muted-foreground">
                            {feature.properties.measurement?.label || getMapDrawingFeatureCoordinatePreview(feature)}
                          </Typography>
                        </button>
                        <Input
                          value={createMapDrawingLabel(feature, index)}
                          aria-label={`Label ${getMapDrawingTypeLabel(feature).toLowerCase()} drawing`}
                          onChange={event => handleDrawingLabelInputChange(featureId, event.target.value)}
                          className="mt-2 h-7 text-xs"
                        />
                      </div>
                    )
                  })}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  disabled={!isMapReady}
                  className="flex-shrink-0 gap-1.5"
                >
                  <Layers className="h-3.5 w-3.5" strokeWidth={1.5} />
                  <span className="hidden sm:inline">Layers</span>
                  <span className="text-muted-foreground">{selectedBasemap.label}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Basemap</DropdownMenuLabel>
                <DropdownMenuRadioGroup
                  value={selectedBasemapId}
                  onValueChange={basemapId => handleMapBasemapSelect({
                    map: mapRef.current,
                    basemapId,
                    activeOverlayIds,
                    isDarkTheme,
                    setSelectedBasemapId,
                    temperatureOverlayOpacity,
                    temperatureRasterArrayBand,
                  })}
                >
                  {mapBasemapOptions.map(basemap => (
                    <DropdownMenuRadioItem key={basemap.id} value={basemap.id}>
                      {basemap.label}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Overlays</DropdownMenuLabel>
                {mapOverlayOptions.map(overlay => (
                  <DropdownMenuCheckboxItem
                    key={overlay.id}
                    checked={activeOverlayIds.includes(overlay.id)}
                    onCheckedChange={checked => handleMapOverlayToggle({
                      map: mapRef.current,
                      overlayId: overlay.id,
                      isChecked: checked === true,
                      basemapId: selectedBasemapId,
                      activeOverlayIds,
                      isDarkTheme,
                      setActiveOverlayIds,
                      temperatureOverlayOpacity,
                      temperatureRasterArrayBand,
                    })}
                    onSelect={event => event.preventDefault()}
                  >
                    <div className="flex min-w-0 flex-col">
                      <span>{overlay.label}</span>
                      <span className="text-xs text-muted-foreground">{overlay.description}</span>
                    </div>
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
      <div className="relative flex-1 min-h-0">
        <div ref={containerRef} className="absolute inset-0" />
        {isMapReady && isRadarActive && rainViewerTimeline.length > 0 && (
          <div className="pointer-events-auto absolute bottom-3 left-3 z-20 flex w-[min(calc(100%-1.5rem),20rem)] flex-col gap-2 rounded-lg border border-border bg-card/95 p-2 shadow-md backdrop-blur-sm">
            <Typography variant="xs" className="text-muted-foreground">
              Radar frame (UTC):{' '}
              <span className="font-medium text-foreground">
                {formatRainViewerFrameUtc(rainViewerTimeline[rainViewerFrameIndex]?.time ?? 0)}
              </span>
            </Typography>
            {isRadarPlaybackPreloading && (
              <Typography variant="xs" className="text-muted-foreground">
                Caching radar tiles for this view…
              </Typography>
            )}
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="secondary"
                size="icon-xs"
                disabled={rainViewerTimeline.length <= 1}
                aria-label="Previous radar frame"
                onClick={() => {
                  radarPlaybackPreloadAbortRef.current?.abort()
                  setIsRadarPlaybackPreloading(false)
                  setIsRainViewerPlaying(false)
                  setRainViewerFrameIndex(i =>
                    stepRainViewerFrameIndex(rainViewerTimeline.length, i, -1),
                  )
                }}
              >
                <SkipBack className="h-3.5 w-3.5" strokeWidth={1.5} />
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="icon-xs"
                disabled={rainViewerTimeline.length <= 1}
                aria-label={
                  isRadarPlaybackPreloading
                    ? 'Cancel radar preload'
                    : isRainViewerPlaying
                      ? 'Pause radar animation'
                      : 'Play radar animation'
                }
                onClick={() => {
                  if (isRadarPlaybackPreloading) {
                    void handleRadarPlaybackToggle({
                      mapRef,
                      nextPlaying: false,
                      rainViewerHost,
                      rainViewerTimeline,
                      rainViewerTileSize,
                      preloadAbortRef: radarPlaybackPreloadAbortRef,
                      setIsRainViewerPlaying,
                      setIsRadarPlaybackPreloading,
                    })
                    return
                  }
                  void handleRadarPlaybackToggle({
                    mapRef,
                    nextPlaying: !isRainViewerPlaying,
                    rainViewerHost,
                    rainViewerTimeline,
                    rainViewerTileSize,
                    preloadAbortRef: radarPlaybackPreloadAbortRef,
                    setIsRainViewerPlaying,
                    setIsRadarPlaybackPreloading,
                  })
                }}
              >
                {isRadarPlaybackPreloading
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.5} />
                  : isRainViewerPlaying
                    ? <Pause className="h-3.5 w-3.5" strokeWidth={1.5} />
                    : <Play className="h-3.5 w-3.5" strokeWidth={1.5} />}
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="icon-xs"
                disabled={rainViewerTimeline.length <= 1}
                aria-label="Next radar frame"
                onClick={() => {
                  radarPlaybackPreloadAbortRef.current?.abort()
                  setIsRadarPlaybackPreloading(false)
                  setIsRainViewerPlaying(false)
                  setRainViewerFrameIndex(i =>
                    stepRainViewerFrameIndex(rainViewerTimeline.length, i, 1),
                  )
                }}
              >
                <SkipForward className="h-3.5 w-3.5" strokeWidth={1.5} />
              </Button>
            </div>
            {rainViewerTimeline.length > 1 && (
              <Slider
                min={0}
                max={rainViewerTimeline.length - 1}
                step={1}
                value={[rainViewerFrameIndex]}
                onValueChange={value => {
                  radarPlaybackPreloadAbortRef.current?.abort()
                  setIsRadarPlaybackPreloading(false)
                  setIsRainViewerPlaying(false)
                  const next = value[0]
                  if (typeof next !== 'number') return
                  setRainViewerFrameIndex(clampRainViewerFrameIndex(rainViewerTimeline.length, next))
                }}
                className="py-1"
              />
            )}
          </div>
        )}
        {isMapReady && isTemperatureOverlayActive && (
          <div className="pointer-events-auto absolute bottom-3 right-3 z-20 flex w-[min(calc(100%-1.5rem),18rem)] flex-col gap-3 rounded-lg border border-border bg-card/95 p-3 shadow-md backdrop-blur-sm">
            <Typography variant="xs" className="font-medium text-foreground">
              Temperature overlay
            </Typography>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="map-temperature-band" className="text-xs text-muted-foreground">
                Forecast band
              </Label>
              <select
                id="map-temperature-band"
                className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground"
                value={temperatureRasterArrayBand}
                onChange={event =>
                  handleTemperatureForecastBandChange(event.target.value, setTemperatureRasterArrayBand)}
              >
                {temperatureForecastBandIds.map(id => (
                  <option key={id} value={id}>
                    Band {id}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="map-temperature-opacity" className="text-xs text-muted-foreground">
                  Opacity
                </Label>
                <Typography variant="xs" className="tabular-nums text-foreground">
                  {temperatureOverlayOpacity.toFixed(2)}
                </Typography>
              </div>
              <Slider
                id="map-temperature-opacity"
                min={0.25}
                max={1}
                step={0.02}
                value={[temperatureOverlayOpacity]}
                onValueChange={value =>
                  handleTemperatureOverlayOpacitySliderChange(value, setTemperatureOverlayOpacity)}
                className="py-1"
              />
            </div>
            <Typography variant="xs" className="text-muted-foreground">
              Uses Mapbox GFS 2 m temperature tileset (<code className="text-foreground">raster-array</code> band).
            </Typography>
          </div>
        )}
        {!isMapReady && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background">
            <div className="flex max-w-sm flex-col items-center gap-3 rounded-lg border border-border bg-card px-6 py-5 text-center shadow-lg">
              {mapLoadError ? (
                <>
                  <Typography variant="sm" className="font-semibold text-destructive">
                    Could not load map
                  </Typography>
                  <Typography variant="xs" className="text-muted-foreground">
                    {mapLoadError}
                  </Typography>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setMapLoadError(null)
                      setMapRemountKey(k => k + 1)
                    }}
                  >
                    Try again
                  </Button>
                </>
              ) : (
                <>
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
                </>
              )}
            </div>
          </div>
        )}
        {selectedPlace && (
          <div className="absolute bottom-4 right-4 top-4 z-10 flex w-[min(calc(100%-2rem),22rem)] min-h-0 min-w-0 flex-col gap-3 overflow-hidden rounded-lg border border-border bg-card px-3 pt-3 pb-0 shadow-lg">
            <div className="flex min-w-0 shrink-0 items-center justify-between gap-2">
              <Typography
                variant="sm"
                title={placeName}
                className="min-w-0 flex-1 truncate font-medium text-foreground"
              >
                {placeName}
              </Typography>
              <div className="flex shrink-0 items-center gap-0.5">
                <Button
                  type="button"
                  variant={isDirectionsPanelOpen ? 'secondary' : 'ghost'}
                  size="xs"
                  className="gap-1.5"
                  onClick={() => {
                    void handleSelectedPlaceDirectionsOpen({
                      selectedPlace,
                      fallbackOrigin: currentLocation,
                      setOrigin: setDirectionsOrigin,
                      setOriginQuery: setDirectionsOriginQuery,
                      setDestination: setDirectionsDestination,
                      setDestinationQuery: setDirectionsDestinationQuery,
                      setIsOpen: setIsDirectionsPanelOpen,
                      setError: setDirectionsError,
                    })
                  }}
                >
                  <Route className="h-3.5 w-3.5" strokeWidth={1.5} />
                  Directions
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => handleFavoriteSelectedPlace({
                    location: selectedPlace,
                    onPlaceVisited,
                    setFavoritePlaceId,
                    setSelectedPlace,
                    setIsFavoriteSaving,
                    toast,
                  })}
                  disabled={isFavoriteSaving || favoritePlaceId !== null}
                  aria-label={
                    favoritePlaceId
                      ? 'Saved to favorites'
                      : isFavoriteSaving
                        ? 'Saving to favorites'
                        : 'Add to favorites'
                  }
                  className={
                    favoritePlaceId
                      ? 'text-yellow-500 hover:text-yellow-500 [&_svg]:fill-yellow-500 [&_svg]:text-yellow-500'
                      : 'text-muted-foreground hover:text-foreground'
                  }
                >
                  {isFavoriteSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.5} />
                  ) : (
                    <Star
                      className={favoritePlaceId ? 'h-4 w-4 fill-yellow-500 text-yellow-500' : 'h-4 w-4'}
                      strokeWidth={1.5}
                    />
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => handleSelectedPlacePanelClose({
                    isDirectionsPanelOpen,
                    setIsDirectionsPanelOpen,
                    setSelectedPlace,
                    searchMarkerRef,
                    directionsClearParams: {
                      map: mapRef.current,
                      abortRef: directionsAbortRef,
                      originMarkerRef: directionsOriginMarkerRef,
                      destinationMarkerRef: directionsDestinationMarkerRef,
                      setOrigin: setDirectionsOrigin,
                      setDestination: setDirectionsDestination,
                      setOriginQuery: setDirectionsOriginQuery,
                      setDestinationQuery: setDirectionsDestinationQuery,
                      setRoute: setDirectionsRoute,
                      setRoutesByProfile: setDirectionsRoutesByProfile,
                      setError: setDirectionsError,
                      setIsLoading: setIsDirectionsLoading,
                    },
                  })}
                  aria-label={isDirectionsPanelOpen ? 'Back to place information' : 'Close selected place'}
                >
                  <X className="h-4 w-4" strokeWidth={1.5} />
                </Button>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain rounded-md bg-muted/50 pt-3 -mx-3">
              <div className="min-w-0 space-y-3 px-3">
                <Typography variant="xs" className="font-semibold text-foreground">
                  {isDirectionsPanelOpen ? 'Navigation' : 'Place information'}
                </Typography>
                {isDirectionsPanelOpen && mapRef.current && mapboxModule && searchCore && (
                  <div className="space-y-3">
                    <MapDirectionsSearchField
                      id="map-directions-origin"
                      label="Origin"
                      value={directionsOriginQuery}
                      placeholder="Start from..."
                      suggestions={directionsOriginSuggestions}
                      isOpen={isDirectionsOriginOpen}
                      isLoading={isDirectionsOriginLoading}
                      onQueryChange={value => handleMapDirectionsEndpointQueryChange({
                        map: mapRef.current,
                        value,
                        abortRef: directionsAbortRef,
                        originMarkerRef: directionsOriginMarkerRef,
                        destinationMarkerRef: directionsDestinationMarkerRef,
                        setEndpoint: setDirectionsOrigin,
                        setQuery: setDirectionsOriginQuery,
                        setRoute: setDirectionsRoute,
                        setRoutesByProfile: setDirectionsRoutesByProfile,
                        setError: setDirectionsError,
                        setIsLoading: setIsDirectionsLoading,
                      })}
                      onFocus={() => {
                        if (directionsOriginSuggestions.length > 0) setIsDirectionsOriginOpen(true)
                      }}
                      onSelectSuggestion={suggestion => {
                        const sessionToken = directionsOriginSessionTokenRef.current || new SessionToken()
                        void handleMapDirectionsSuggestionSelect({
                          searchCore,
                          suggestion,
                          sessionToken,
                          setEndpoint: setDirectionsOrigin,
                          setQuery: setDirectionsOriginQuery,
                          setSuggestions: setDirectionsOriginSuggestions,
                          setIsOpen: setIsDirectionsOriginOpen,
                        }).then(() => {
                          directionsOriginSessionTokenRef.current = null
                          setDirectionsError(null)
                        })
                      }}
                    />
                    <MapDirectionsSearchField
                      id="map-directions-destination"
                      label="Destination"
                      value={directionsDestinationQuery}
                      placeholder="Go to..."
                      suggestions={directionsDestinationSuggestions}
                      isOpen={isDirectionsDestinationOpen}
                      isLoading={isDirectionsDestinationLoading}
                      onQueryChange={value => handleMapDirectionsEndpointQueryChange({
                        map: mapRef.current,
                        value,
                        abortRef: directionsAbortRef,
                        originMarkerRef: directionsOriginMarkerRef,
                        destinationMarkerRef: directionsDestinationMarkerRef,
                        setEndpoint: setDirectionsDestination,
                        setQuery: setDirectionsDestinationQuery,
                        setRoute: setDirectionsRoute,
                        setRoutesByProfile: setDirectionsRoutesByProfile,
                        setError: setDirectionsError,
                        setIsLoading: setIsDirectionsLoading,
                      })}
                      onFocus={() => {
                        if (directionsDestinationSuggestions.length > 0) setIsDirectionsDestinationOpen(true)
                      }}
                      onSelectSuggestion={suggestion => {
                        const sessionToken = directionsDestinationSessionTokenRef.current || new SessionToken()
                        void handleMapDirectionsSuggestionSelect({
                          searchCore,
                          suggestion,
                          sessionToken,
                          setEndpoint: setDirectionsDestination,
                          setQuery: setDirectionsDestinationQuery,
                          setSuggestions: setDirectionsDestinationSuggestions,
                          setIsOpen: setIsDirectionsDestinationOpen,
                        }).then(() => {
                          directionsDestinationSessionTokenRef.current = null
                          setDirectionsError(null)
                        })
                      }}
                    />
                    <div className="flex flex-wrap items-center gap-1">
                      {mapboxDirectionsProfiles.map(profile => {
                        const Icon = mapDirectionsProfileIcons[profile]
                        const profileRoute = directionsRoutesByProfile[profile]

                        return (
                          <Button
                            key={profile}
                            type="button"
                            variant={directionsProfile === profile ? 'secondary' : 'ghost'}
                            size="xs"
                            className="h-auto min-w-20 flex-col items-start gap-1 px-2 py-1.5"
                            onClick={() => handleMapDirectionsProfileSelect({
                              map: mapRef.current,
                              mapbox: mapboxModule,
                              profile,
                              routesByProfile: directionsRoutesByProfile,
                              origin: directionsOrigin,
                              destination: directionsDestination,
                              originMarkerRef: directionsOriginMarkerRef,
                              destinationMarkerRef: directionsDestinationMarkerRef,
                              setProfile: setDirectionsProfile,
                              setRoute: setDirectionsRoute,
                            })}
                          >
                            <span className="flex items-center gap-1.5">
                              <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
                              {mapboxDirectionsProfileLabels[profile]}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {profileRoute
                                ? formatMapDirectionsDuration(profileRoute.duration)
                                : isDirectionsLoading
                                  ? '...'
                                  : '--'}
                            </span>
                          </Button>
                        )
                      })}
                    </div>
                    {directionsError && (
                      <Typography variant="xs" className="rounded-md border border-destructive/30 bg-destructive/10 px-2 py-1.5 text-destructive">
                        {directionsError}
                      </Typography>
                    )}
                    {directionsRoute?.steps.length ? (
                      <div className="space-y-3 pt-3">
                        <Typography variant="xs" className="font-semibold text-foreground">
                          Step-by-step
                        </Typography>
                        <ol className="space-y-3">
                          {directionsRoute.steps.map((step, index) => (
                            <li
                              key={`${index}-${step.instruction}-${step.distance}`}
                              className="flex gap-3"
                            >
                              <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-medium text-muted-foreground">
                                {index + 1}
                              </div>
                              <div className="min-w-0 flex-1">
                                <Typography variant="xs" className="text-foreground">
                                  {step.instruction}
                                </Typography>
                                {(step.name && !step.instruction.includes(step.name)) || step.distance > 0 || step.duration > 0 ? (
                                  <Typography variant="xs" className="mt-1 text-muted-foreground">
                                    {[
                                      step.name && !step.instruction.includes(step.name) ? step.name : null,
                                      step.distance > 0 ? formatMapDirectionsDistance(step.distance) : null,
                                      step.duration > 0 ? formatMapDirectionsDuration(step.duration) : null,
                                    ].filter(Boolean).join(' · ')}
                                  </Typography>
                                ) : null}
                              </div>
                            </li>
                          ))}
                        </ol>
                      </div>
                    ) : null}
                  </div>
                )}
                {!isDirectionsPanelOpen && isGooglePlaceLoading && <SelectedPlaceDetailsSkeleton />}
                {!isDirectionsPanelOpen && (
                  <>
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
                {googlePlaceDetails ? <SelectedPlaceGoogleEnrichment details={googlePlaceDetails} onPhotoOpen={onPlacePhotoOpen} /> : null}
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
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
