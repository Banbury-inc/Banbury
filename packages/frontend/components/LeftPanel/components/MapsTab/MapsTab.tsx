import { useCallback, useEffect, useMemo, useState } from 'react'
import { Clock, Map, MapPin, RefreshCw, SquareArrowOutUpRight, Star, Trash2 } from 'lucide-react'
import { Button } from '../../../common/ui/button'
import { Typography } from '../../../common/ui/typography'
import { useToast } from '../../../common/ui/use-toast'
import { MapPlace, PanelGroup } from '../../../../pages/Workspaces/types'
import { handleDeletePlace } from './handlers/handleDeletePlace'
import { loadPlaces } from './handlers/loadPlaces'
import { useMapWorkspaceHandlers } from './handlers/workspaceHandlers'

interface MapsTabProps {
  activePanelId?: string
  panelLayout?: PanelGroup
  setPanelLayout?: React.Dispatch<React.SetStateAction<PanelGroup>>
  setActivePanelId?: React.Dispatch<React.SetStateAction<string>>
}

function EmptySection({ label }: Readonly<{ label: string }>) {
  return (
    <div className="px-3 py-4 text-center">
      <Typography variant="xs" className="text-muted-foreground">
        {label}
      </Typography>
    </div>
  )
}

type PlaceAction = React.Dispatch<MapPlace>

interface PlaceRowProps {
  place: MapPlace
  onSelect?: PlaceAction
  onDelete: PlaceAction
}

function PlaceRow({ place, onSelect, onDelete }: Readonly<PlaceRowProps>) {
  return (
    <div className="group flex items-center gap-1 rounded-lg px-2 py-1.5 hover:bg-accent">
      <button
        type="button"
        onClick={() => onSelect?.(place)}
        className="min-w-0 flex-1 text-left"
      >
        <div className="flex items-center gap-2 min-w-0">
          <MapPin className="h-4 w-4 flex-shrink-0 text-muted-foreground" strokeWidth={1.5} />
          <div className="min-w-0 flex-1">
            <Typography variant="xs" className="truncate font-medium text-foreground">
              {place.name}
            </Typography>
          </div>
        </div>
      </button>
      <button
        type="button"
        onClick={() => onDelete(place)}
        className="rounded-md p-1 text-muted-foreground hover:bg-background hover:text-destructive"
        aria-label="Delete place"
      >
        <Trash2 className="h-4 w-4" strokeWidth={1.5} />
      </button>
    </div>
  )
}

interface PlacesSectionProps {
  title: string
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  places: MapPlace[]
  emptyLabel: string
  onSelect?: PlaceAction
  onDelete: PlaceAction
}

function PlacesSection({ title, icon: Icon, places, emptyLabel, onSelect, onDelete }: Readonly<PlacesSectionProps>) {
  return (
    <section className="px-2 py-3">
      <div className="flex items-center gap-2 px-2 pb-2">
        <Icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
        <Typography variant="xs" className="font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </Typography>
      </div>
      {places.length === 0 ? (
        <EmptySection label={emptyLabel} />
      ) : (
        <div className="space-y-1">
          {places.map(place => (
            <PlaceRow
              key={place.id}
              place={place}
              onSelect={onSelect}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </section>
  )
}

export function MapsTab({
  activePanelId = 'main-panel',
  panelLayout,
  setPanelLayout,
  setActivePanelId,
}: Readonly<MapsTabProps>) {
  const { toast } = useToast()
  const [places, setPlaces] = useState<MapPlace[]>([])
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const workspaceHandlers = useMapWorkspaceHandlers({
    activePanelId,
    panelLayout: panelLayout ?? null,
    setPanelLayout: setPanelLayout ?? (() => {}),
    setActivePanelId: setActivePanelId ?? (() => {}),
  })

  const favoritePlaces = useMemo(() => places.filter(place => place.is_favorite), [places])
  const recentPlaces = useMemo(() => places.filter(place => !place.is_favorite), [places])

  const refreshPlaces = useCallback(async (showErrorToast = false) => {
    try {
      await loadPlaces({ setPlaces, setLoading, setIsRefreshing })
    } catch {
      if (showErrorToast)
        toast({ title: 'Error', description: 'Failed to load saved places', variant: 'destructive' })
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [toast])

  useEffect(() => {
    refreshPlaces()
  }, [refreshPlaces])

  useEffect(() => {
    function handlePlacesUpdated() {
      refreshPlaces()
    }

    window.addEventListener('maps-places-updated', handlePlacesUpdated)
    return () => window.removeEventListener('maps-places-updated', handlePlacesUpdated)
  }, [refreshPlaces])

  const handleRefresh = () => {
    setIsRefreshing(true)
    refreshPlaces(true)
  }

  const handleDeleteClick = async (place: MapPlace) => {
    try {
      await handleDeletePlace({ place, setPlaces })
      toast({ title: 'Success', description: 'Place deleted' })
    } catch {
      toast({ title: 'Error', description: 'Failed to delete place', variant: 'destructive' })
    }
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card">
        <div className="flex items-center gap-2 min-w-0">
          <Map className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
          <Typography variant="xs" className="truncate font-medium text-foreground">
            Maps
          </Typography>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="xs"
            onClick={handleRefresh}
            disabled={isRefreshing}
            title="Refresh"
            className="hover:bg-accent hover:text-accent-foreground"
          >
            <RefreshCw className={isRefreshing ? 'h-4 w-4 animate-spin text-muted-foreground' : 'h-4 w-4 text-muted-foreground'} />
          </Button>
          <Button
            variant="secondary"
            size="xs"
            onClick={workspaceHandlers.handleOpenMap}
            title="Open Map"
            className="bg-accent hover:bg-accent hover:text-accent-foreground"
          >
            <SquareArrowOutUpRight className="h-4 w-4 text-accent-foreground" strokeWidth={1.5} />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="px-4 py-6">
            <Typography variant="xs" className="text-muted-foreground">
              Loading saved places...
            </Typography>
          </div>
        ) : (
          <>
            <PlacesSection
              title="Favorites"
              icon={Star}
              places={favoritePlaces}
              emptyLabel="Favorite places will appear here"
              onSelect={workspaceHandlers.handlePlaceSelect}
              onDelete={handleDeleteClick}
            />
            <PlacesSection
              title="Recents"
              icon={Clock}
              places={recentPlaces}
              emptyLabel="Recent places will appear here"
              onSelect={workspaceHandlers.handlePlaceSelect}
              onDelete={handleDeleteClick}
            />
          </>
        )}
      </div>
    </div>
  )
}
