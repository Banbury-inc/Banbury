import { useCallback } from 'react'
import { PanelGroup } from '../../../../../pages/Workspaces/types'
import { CalendarEvent } from '../../../../../../backend/api/calendar/calendar'
import { handleCalendarEventSelect as handleCalendarEventSelectHandler } from './handleCalendarEventSelect'
import { openCalendarInTab } from './openCalendarInTab'
import { getAllTabs, updatePanelActiveTab, addTabToPanel } from '../../../../../pages/Workspaces/handlers/panelUtils'

interface WorkspaceDependencies {
  activePanelId?: string
  panelLayout?: PanelGroup
  setPanelLayout?: React.Dispatch<React.SetStateAction<PanelGroup>>
  setActivePanelId?: React.Dispatch<React.SetStateAction<string>>
  setCalendarJumpDate?: React.Dispatch<React.SetStateAction<Date | null>>
  setCalendarSelectedEvent?: React.Dispatch<React.SetStateAction<CalendarEvent | null>>
}

export function useCalendarWorkspaceHandlers(deps: WorkspaceDependencies = {}) {
  const {
    activePanelId,
    panelLayout,
    setPanelLayout,
    setActivePanelId,
    setCalendarJumpDate,
    setCalendarSelectedEvent
  } = deps

  const hasDependencies = !!(
    activePanelId &&
    panelLayout &&
    setPanelLayout &&
    setActivePanelId &&
    setCalendarJumpDate &&
    setCalendarSelectedEvent
  )

  const openCalendarInTabCallback = useCallback((targetPanelId: string = activePanelId || 'main-panel') => {
    if (!hasDependencies || !activePanelId || !panelLayout || !setActivePanelId || !setPanelLayout) return
    openCalendarInTab(targetPanelId, activePanelId, panelLayout, getAllTabs, updatePanelActiveTab, addTabToPanel, setActivePanelId, setPanelLayout)
  }, [activePanelId, panelLayout, setActivePanelId, setPanelLayout, hasDependencies])

  const handleCalendarEventSelect = useCallback((event: CalendarEvent) => {
    if (!hasDependencies || !setCalendarJumpDate || !setCalendarSelectedEvent || !activePanelId) return
    handleCalendarEventSelectHandler({
      event,
      setCalendarJumpDate,
      setCalendarSelectedEvent,
      openCalendarInTabCallback,
      activePanelId
    })
  }, [setCalendarJumpDate, setCalendarSelectedEvent, openCalendarInTabCallback, activePanelId, hasDependencies])

  return {
    handleCalendarEventSelect: hasDependencies ? handleCalendarEventSelect : undefined,
    openCalendarInTab: hasDependencies ? openCalendarInTabCallback : undefined
  }
}
