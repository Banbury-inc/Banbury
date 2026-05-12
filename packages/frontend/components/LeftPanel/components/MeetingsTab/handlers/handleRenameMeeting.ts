import { ApiService } from '../../../../../../backend/api/apiService'

interface HandleRenameMeetingParams {
  meetingId: string
  currentTitle: string
  onSuccess?: () => void
  onError?: (error: string) => void
}

export async function handleRenameMeeting({
  meetingId,
  currentTitle,
  onSuccess,
  onError
}: HandleRenameMeetingParams) {
  const nextTitle = window.prompt('Rename meeting', currentTitle)

  if (nextTitle === null) return false

  const title = nextTitle.trim()
  if (!title) {
    onError?.('Meeting title cannot be empty')
    return false
  }

  try {
    const result = await ApiService.MeetingAgent.renameMeetingSession(meetingId, title)

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
