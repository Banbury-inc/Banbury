import { ApiService } from '../../../../../../backend/api/apiService'
import { MeetingShareRecipient } from '../../../../../../backend/api/meeting-agent/meeting-agent'

interface HandleShareMeetingParams {
  meetingId: string
  recipients: MeetingShareRecipient[]
  access?: 'edit' | 'view'
  onSuccess?: (message: string) => void
  onError?: (error: string) => void
}

export async function handleShareMeeting({
  meetingId,
  recipients,
  access = 'edit',
  onSuccess,
  onError
}: HandleShareMeetingParams) {
  if (recipients.length === 0) {
    onError?.('Select at least one user to share with')
    return false
  }

  try {
    const result = await ApiService.MeetingAgent.shareMeetingSession(meetingId, recipients, access)

    if (result.success) {
      onSuccess?.(result.message)
      return true
    }

    throw new Error(result.message)
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to share meeting'
    onError?.(errorMessage)
    return false
  }
}
