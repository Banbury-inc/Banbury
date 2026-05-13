import { ApiService } from '../../../../../../backend/api/apiService'

interface HandleRenameMeetingParams {
  meetingId: string
  title: string
  onSuccess?: () => void
  onError?: (error: string) => void
}

export async function handleRenameMeeting({
  meetingId,
  title,
  onSuccess,
  onError
}: HandleRenameMeetingParams) {
  const nextTitle = title.trim()
  if (!nextTitle) {
    onError?.('Meeting title cannot be empty')
    return false
  }

  try {
    const result = await ApiService.MeetingAgent.renameMeetingSession(meetingId, nextTitle)

    if (result.success) {
      onSuccess?.()
      return true
    }

    throw new Error(result.message)
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to rename meeting'
    onError?.(errorMessage)
    return false
  }
}
