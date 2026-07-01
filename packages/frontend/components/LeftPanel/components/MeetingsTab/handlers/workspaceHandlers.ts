import { useCallback } from 'react'
import { PanelGroup } from '../../../../../pages/Workspaces/types'
import { MeetingSession } from '../../../../../types/meeting-types'
import { openMeetingInTab } from '../../../../../pages/Workspaces/handlers/tabManagement'
import { handleMeetingSelect as handleMeetingSelectHandler } from './handleMeetingSelect'
import { handleDesktopRecordingStarted as handleDesktopRecordingStartedHandler } from '../../../../../pages/Workspaces/handlers/handleDesktopRecordingStarted'
import { getAllTabs, updatePanelActiveTab, addTabToPanel } from '../../../../../pages/Workspaces/handlers/panelUtils'

interface WorkspaceDependencies {
  activePanelId: string
  panelLayout: PanelGroup | null
  setPanelLayout: React.Dispatch<React.SetStateAction<PanelGroup>>
  setActivePanelId: React.Dispatch<React.SetStateAction<string>>
  setSelectedMeeting: React.Dispatch<React.SetStateAction<MeetingSession | null>>
}

export function useMeetingWorkspaceHandlers(deps: WorkspaceDependencies) {
  const {
    activePanelId,
    panelLayout,
    setPanelLayout,
    setActivePanelId,
    setSelectedMeeting
  } = deps

  // Check if workspace dependencies are available (panelLayout is the key indicator)
  const hasWorkspaceDeps = panelLayout !== null

  const openMeetingInTabCallback = useCallback(async (meeting: MeetingSession | null, targetPanelId: string = activePanelId) => {
    if (!hasWorkspaceDeps) return
    await openMeetingInTab(
      meeting,
      targetPanelId,
      activePanelId,
      panelLayout!,
      getAllTabs,
      updatePanelActiveTab,
      addTabToPanel,
      setActivePanelId,
      setPanelLayout,
      setSelectedMeeting
    )
  }, [activePanelId, panelLayout, setActivePanelId, setPanelLayout, setSelectedMeeting, hasWorkspaceDeps])

  const handleMeetingSelect = useCallback((meeting: MeetingSession) => {
    if (!hasWorkspaceDeps) return
    handleMeetingSelectHandler({
      meeting,
      setSelectedMeeting,
      openMeetingInTabCallback,
      activePanelId
    })
  }, [setSelectedMeeting, openMeetingInTabCallback, activePanelId, hasWorkspaceDeps])

  const handleJoinMeeting = useCallback(() => {
    if (!hasWorkspaceDeps) return
    openMeetingInTabCallback(null, activePanelId)
  }, [openMeetingInTabCallback, activePanelId, hasWorkspaceDeps])

  const handleDesktopRecordingStarted = useCallback((data: { sessionId: string; windowId: string; platform: string; meetingTitle: string }) => {
    if (!hasWorkspaceDeps) return
    handleDesktopRecordingStartedHandler({
      data,
      setSelectedMeeting,
      openMeetingInTabCallback,
      activePanelId
    })
  }, [setSelectedMeeting, openMeetingInTabCallback, activePanelId, hasWorkspaceDeps])

  return {
    handleMeetingSelect: hasWorkspaceDeps ? handleMeetingSelect : undefined,
    handleJoinMeeting: hasWorkspaceDeps ? handleJoinMeeting : undefined,
    handleDesktopRecordingStarted: hasWorkspaceDeps ? handleDesktopRecordingStarted : undefined
  }
}
