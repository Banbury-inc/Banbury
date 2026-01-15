import { ApiService } from '../../../../../../backend/api/apiService'

export async function handleDeleteMeeting({
  meetingId,
  onSuccess,
  onError
}: {
  meetingId: string
  onSuccess?: () => void
  onError?: (error: string) => void
}) {
  try {
    const result = await ApiService.MeetingAgent.deleteMeetingSession(meetingId)
    
    if (result.success) {
      onSuccess?.()
      return true
    } else {
      throw new Error(result.message)
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to delete session'
    onError?.(errorMessage)
    return false
  }
}
