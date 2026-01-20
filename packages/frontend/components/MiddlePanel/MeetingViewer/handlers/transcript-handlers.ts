import { ApiService } from "../../../../../backend/api/apiService"
import { TranscriptionSegment } from "../../../../types/meeting-types"

export async function fetchTranscriptFromUrl(
  transcriptUrl: string,
  onSuccess: (segments: TranscriptionSegment[], fullText: string) => void,
  onError: (error: Error) => void
): Promise<void> {
  try {
    // Use proxy endpoint to avoid CORS issues
    const transcriptData = await ApiService.MeetingAgent.proxyTranscript(transcriptUrl)

    // Handle different transcript formats from Recall API
    if (transcriptData.utterances && Array.isArray(transcriptData.utterances)) {
      // Format: { utterances: [{ speaker: string, text: string, start: number, end: number }] }
      const segments: TranscriptionSegment[] = transcriptData.utterances.map((utterance: any, index: number) => ({
        id: utterance.id || `segment-${index}`,
        speakerId: utterance.speaker || 'unknown',
        speakerName: utterance.speaker_name || `Speaker ${utterance.speaker || 'Unknown'}`,
        text: utterance.text || '',
        startTime: utterance.start || 0,
        endTime: utterance.end || 0,
        confidence: utterance.confidence || 1.0
      }))

      // Also set full text
      const fullText = segments.map(s => `${s.speakerName}: ${s.text}`).join('\n\n')
      onSuccess(segments, fullText)
    } else if (transcriptData.text) {
      // Format: { text: string }
      onSuccess([], transcriptData.text)
    } else if (typeof transcriptData === 'string') {
      // Format: plain text string
      onSuccess([], transcriptData)
    } else {
      // Try to extract text from any structure
      const text = JSON.stringify(transcriptData, null, 2)
      onSuccess([], text)
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to fetch transcript from URL:', error)
    onError(error as Error)
  }
}
