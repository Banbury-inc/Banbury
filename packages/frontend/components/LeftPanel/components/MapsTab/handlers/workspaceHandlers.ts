import { useCallback } from 'react'
import { MapPlace, MapPlaceLocation, PanelGroup } from '../../../../../pages/Workspaces/types'
import { openMapInTab } from '../../../../../pages/Workspaces/handlers/tabManagement'
import { addTabToPanel, getAllTabs, updatePanelActiveTab } from '../../../../../pages/Workspaces/handlers/panelUtils'

interface WorkspaceDependencies {
  activePanelId: string
  panelLayout: PanelGroup | null
  setPanelLayout: React.Dispatch<React.SetStateAction<PanelGroup>>
  setActivePanelId: React.Dispatch<React.SetStateAction<string>>
}

function toPlaceLocation(place: MapPlace): MapPlaceLocation {
  return {
    id: place.id,
    name: place.name,
    longitude: place.longitude,
    latitude: place.latitude,
    zoom: place.zoom,
    drawings: place.drawings,
  }
}

export function useMapWorkspaceHandlers(deps: WorkspaceDependencies) {
  const {
    activePanelId,
    panelLayout,
    setPanelLayout,
    setActivePanelId,
  } = deps

  const hasWorkspaceDeps = panelLayout !== null

  const openMapInTabCallback = useCallback((place: MapPlaceLocation | null = null, targetPanelId: string = activePanelId) => {
    if (!hasWorkspaceDeps) return
    openMapInTab(
      place,
      targetPanelId,
      activePanelId,
      panelLayout!,
      getAllTabs,
      updatePanelActiveTab,
      addTabToPanel,
      setActivePanelId,
      setPanelLayout
    )
  }, [activePanelId, panelLayout, setActivePanelId, setPanelLayout, hasWorkspaceDeps])

  const handleOpenMap = useCallback(() => {
    openMapInTabCallback(null, activePanelId)
  }, [openMapInTabCallback, activePanelId])

  const handlePlaceSelect = useCallback((place: MapPlace) => {
    openMapInTabCallback(toPlaceLocation(place), activePanelId)
  }, [openMapInTabCallback, activePanelId])

  return {
    handleOpenMap: hasWorkspaceDeps ? handleOpenMap : undefined,
    handlePlaceSelect: hasWorkspaceDeps ? handlePlaceSelect : undefined,
  }
}
