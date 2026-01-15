import { MeetingSession } from '../../../../types/meeting-types'
import { ApiService } from '../../../../backend/api/apiService'

interface HandleMeetingSelectParams {
  meeting: MeetingSession
  setSelectedMeeting: React.Dispatch<React.SetStateAction<MeetingSession | null>>
  openMeetingInTabCallback: (meeting: MeetingSession | null, panelId: string) => void
  activePanelId: string
}

export async function handleMeetingSelect({
  meeting,
  setSelectedMeeting,
  openMeetingInTabCallback,
  activePanelId
}: HandleMeetingSelectParams): Promise<void> {
  try {
    // Call the get meeting details endpoint
    const meetingDetails = await ApiService.MeetingAgent.getMeetingDetails(meeting.id) as any
    
    // Extract video and transcript URLs from the meeting details response
    const videoUrl = meetingDetails?.media_shortcuts?.video_mixed?.data?.download_url
    const transcriptUrl = meetingDetails?.media_shortcuts?.transcript?.data?.download_url
    
    // Update the meeting with the extracted URLs
    const updatedMeeting: MeetingSession = {
      ...meeting,
      // Set video URL if available
      recordingUrl: videoUrl || meeting.recordingUrl,
      // Set transcript URL if available
      transcriptionUrl: transcriptUrl || meeting.transcriptionUrl,
      // Store the full meeting details in recallBot for potential future use
      recallBot: meeting.recallBot ? {
        ...meeting.recallBot,
        videoUrl: videoUrl || meeting.recallBot.videoUrl,
        transcriptUrl: transcriptUrl || meeting.recallBot.transcriptUrl
      } : (videoUrl || transcriptUrl ? {
        id: meetingDetails?.id || '',
        status: 'completed' as const,
        meetingUrl: meeting.meetingUrl,
        recordingStatus: 'completed' as const,
        transcriptionStatus: 'completed' as const,
        createdAt: new Date(),
        metadata: {},
        videoUrl,
        transcriptUrl
      } : undefined)
    }
    
    // Set the selected meeting and open in tab
    setSelectedMeeting(updatedMeeting)
    openMeetingInTabCallback(updatedMeeting, activePanelId)
  } catch (error) {
    console.error('Failed to get meeting details:', error)
    // Fallback to original behavior if API call fails
    setSelectedMeeting(meeting)
    openMeetingInTabCallback(meeting, activePanelId)
  }
}
