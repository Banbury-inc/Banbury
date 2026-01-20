import { ApiService } from "../../../../../backend/api/apiService"
import { MeetingSession } from "../../../../types/meeting-types"
import { formatDate, getMeetingDate } from "../utils/date-formatters"
import { formatDuration } from "../utils/duration-formatters"
import { getDuration } from "../utils/meeting-utils"

export async function handleDownloadTranscription(
  meeting: MeetingSession & { createdAt?: string | Date },
  onSuccess: () => void,
  onError: (error: string) => void
): Promise<void> {
  try {
    const transcriptionData = await ApiService.MeetingAgent.getTranscription(meeting.id)

    const meetingTitle = meeting.title || formatDate(getMeetingDate(meeting))
    const content = `Meeting: ${meetingTitle}
Date: ${formatDate(getMeetingDate(meeting))}
Platform: ${meeting.platform?.name || 'Desktop Recording'}
Duration: ${formatDuration(getDuration(meeting))}

FULL TRANSCRIPTION:
${transcriptionData.fullText || ''}

SEGMENTED TRANSCRIPTION:
${transcriptionData.segments?.map((segment: any) =>
  `[${Math.floor(segment.startTime / 60)}:${String(Math.floor(segment.startTime % 60)).padStart(2, '0')}] ${segment.speakerName}: ${segment.text}`
).join('\n') || 'No segments available'}
`

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = `${meetingTitle || 'meeting'}_transcription.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    URL.revokeObjectURL(url)

    onSuccess()
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to download transcription'
    onError(errorMessage)
  }
}
