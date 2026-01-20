import { ApiService } from "../../../../../backend/api/apiService"
import { MeetingSession } from "../../../../types/meeting-types"
import { formatDateForFilename, getMeetingDate } from "../utils/date-formatters"

export async function handleDownloadRecording(
  meeting: MeetingSession & { createdAt?: string | Date },
  onSuccess: () => void,
  onError: (error: string) => void
): Promise<void> {
  if (!meeting.recordingUrl) return

  try {
    const result = await ApiService.MeetingAgent.downloadRecording(meeting.id)

    if (result.success && result.downloadUrl) {
      const link = document.createElement('a')
      link.href = result.downloadUrl
      const meetingTitle = meeting.title || formatDateForFilename(getMeetingDate(meeting))
      link.download = `${meetingTitle}_recording.mp4`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      onSuccess()
    } else {
      throw new Error(result.message)
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to download recording'
    onError(errorMessage)
  }
}
