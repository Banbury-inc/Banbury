import { MeetingSession } from '../../../types/meeting-types'

interface HandleDesktopRecordingStartedParams {
  data: {
    sessionId: string
    windowId: string
    platform: string
    meetingTitle: string
  }
  setSelectedMeeting: React.Dispatch<React.SetStateAction<MeetingSession | null>>
  openMeetingInTabCallback: (meeting: MeetingSession | null, panelId: string) => void
  activePanelId: string
}

export function handleDesktopRecordingStarted({
  data,
  setSelectedMeeting,
  openMeetingInTabCallback,
  activePanelId
}: HandleDesktopRecordingStartedParams): void {
  // Create a temporary MeetingSession object for the live recording
  const tempMeeting: MeetingSession = {
    id: data.sessionId,
    title: data.meetingTitle || 'Desktop Recording',
    platform: {
      id: data.platform || 'desktop',
      name: data.platform === 'zoom' ? 'Zoom' : data.platform === 'teams' ? 'Microsoft Teams' : data.platform === 'meet' ? 'Google Meet' : 'Desktop Recording',
      icon: '🖥️',
      supported: true,
      authRequired: false
    },
    meetingUrl: `desktop://${data.windowId}`,
    status: 'recording',
    startTime: new Date(),
    participants: [],
    metadata: {
      recordingEnabled: true,
      transcriptionEnabled: true,
      summaryEnabled: false,
      actionItemsEnabled: false,
      language: 'en',
      quality: 'high',
      autoJoin: false,
      autoLeave: true,
      maxDuration: 180
    }
  }
  
  setSelectedMeeting(tempMeeting)
  openMeetingInTabCallback(tempMeeting, activePanelId)
}
