import { MeetingSession } from '../../../../../types/meeting-types'

interface HandleCopyMeetingUrlParams {
  meeting: MeetingSession
  onSuccess?: () => void
  onError?: (error: string) => void
}

export async function handleCopyMeetingUrl({
  meeting,
  onSuccess,
  onError
}: HandleCopyMeetingUrlParams) {
  if (!meeting.meetingUrl) {
    onError?.('No meeting URL is available for this meeting')
    return false
  }

  try {
    await navigator.clipboard.writeText(meeting.meetingUrl)
    onSuccess?.()
    return true
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to copy meeting URL'
    onError?.(errorMessage)
    return false
  }
}
