import { ApiService } from "../../../../../backend/api/apiService"
import { MeetingSession } from "../../../../types/meeting-types"

export async function handleGenerateSummary(
  sessionId: string,
  onSuccess?: (meeting: MeetingSession) => void,
  onError?: (error: string) => void
): Promise<void> {
  try {
    const result = await ApiService.MeetingAgent.generateMeetingSummary(sessionId)
    
    if (result.success) {
      // Fetch updated meeting data
      const updatedMeeting = await ApiService.MeetingAgent.getMeetingSession(sessionId)
      onSuccess?.(updatedMeeting)
    } else {
      const errorMessage = result.message || 'Failed to generate summary'
      onError?.(errorMessage)
      throw new Error(errorMessage)
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate summary'
    onError?.(errorMessage)
    throw error
  }
}
