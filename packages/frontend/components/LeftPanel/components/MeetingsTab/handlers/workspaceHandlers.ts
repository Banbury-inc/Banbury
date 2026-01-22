import { useCallback } from 'react'
import { PanelGroup } from '../../../../../pages/Workspaces/types'
import { MeetingSession } from '../../../../../types/meeting-types'
import { openMeetingInTab } from '../../../../../pages/Workspaces/handlers/tabManagement'
import { handleMeetingSelect as handleMeetingSelectHandler } from '../../../../../pages/Workspaces/handlers/handleMeetingSelect'
import { handleDesktopRecordingStarted as handleDesktopRecordingStartedHandler } from '../../../../../pages/Workspaces/handlers/handleDesktopRecordingStarted'
import { getAllTabs, updatePanelActiveTab, addTabToPanel } from '../../../../../pages/Workspaces/handlers/panelUtils'

interface WorkspaceDependencies {
  activePanelId: string
  panelLayout: PanelGroup
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

  const openMeetingInTabCallback = useCallback(async (meeting: MeetingSession | null, targetPanelId: string = activePanelId) => {
    await openMeetingInTab(
      meeting,
      targetPanelId,
      activePanelId,
      panelLayout,
      getAllTabs,
      updatePanelActiveTab,
      addTabToPanel,
      setActivePanelId,
      setPanelLayout
    )
  }, [activePanelId, panelLayout, setActivePanelId, setPanelLayout])

  const handleMeetingSelect = useCallback((meeting: MeetingSession) => {
    handleMeetingSelectHandler({
      meeting,
      setSelectedMeeting,
      openMeetingInTabCallback,
      activePanelId
    })
  }, [setSelectedMeeting, openMeetingInTabCallback, activePanelId])

  const handleJoinMeeting = useCallback(() => {
    openMeetingInTabCallback(null, activePanelId)
  }, [openMeetingInTabCallback, activePanelId])

  const handleDesktopRecordingStarted = useCallback((data: { sessionId: string; windowId: string; platform: string; meetingTitle: string }) => {
    handleDesktopRecordingStartedHandler({
      data,
      setSelectedMeeting,
      openMeetingInTabCallback,
      activePanelId
    })
  }, [setSelectedMeeting, openMeetingInTabCallback, activePanelId])

  return {
    handleMeetingSelect,
    handleJoinMeeting,
    handleDesktopRecordingStarted
  }
}
