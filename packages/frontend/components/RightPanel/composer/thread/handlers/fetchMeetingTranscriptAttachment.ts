import { ApiService } from "../../../../../../backend/api/apiService"
import { fetchTranscriptFromUrl } from "../../../../MiddlePanel/MeetingViewer/handlers/transcript-handlers"
import { getMeetingTranscriptFileId } from "../../../../../pages/Workspaces/handlers/tabManagement"
import { MeetingSession, TranscriptionSegment } from "../../../../../types/meeting-types"
import { FileSystemItem } from "../../../../../utils/fileTreeUtils"

export interface MeetingTranscriptAttachment {
  file: FileSystemItem
  payload: { fileData: string; mimeType: string }
}

function segmentsToFullText(segments: TranscriptionSegment[]): string {
  return segments.map((segment) => `${segment.speakerName}: ${segment.text}`).join("\n\n")
}

function encodeTextToBase64(text: string): string {
  const bytes = new TextEncoder().encode(text)
  let binary = ""
  const chunkSize = 8192
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.slice(i, i + chunkSize)
    binary += String.fromCharCode.apply(null, Array.from(chunk) as number[])
  }
  return btoa(binary)
}

function sanitizeFileName(title: string): string {
  const sanitized = title.replace(/[^a-zA-Z0-9._ -]/g, "").trim()
  return sanitized || "Untitled Meeting"
}

async function resolveTranscriptText(meeting: MeetingSession): Promise<string> {
  if (meeting.transcriptionText?.trim()) {
    return meeting.transcriptionText.trim()
  }

  try {
    const transcription = await ApiService.MeetingAgent.getTranscription(meeting.id)
    if (transcription.fullText?.trim()) {
      return transcription.fullText.trim()
    }
    if (transcription.segments?.length) {
      const fullText = segmentsToFullText(transcription.segments)
      if (fullText.trim()) return fullText.trim()
    }
  } catch {
    // Fall through to transcript URL fetch
  }

  const transcriptUrl = meeting.transcriptionUrl || meeting.recallBot?.transcriptUrl
  if (!transcriptUrl) return ""

  return new Promise((resolve) => {
    fetchTranscriptFromUrl(
      transcriptUrl,
      (_segments, fullText) => resolve(fullText?.trim() || ""),
      () => resolve("")
    )
  })
}

export async function fetchMeetingTranscriptAttachment(
  meeting: MeetingSession
): Promise<MeetingTranscriptAttachment | null> {
  if (!meeting.id) return null

  const transcriptText = await resolveTranscriptText(meeting)
  if (!transcriptText) return null

  const fileId = getMeetingTranscriptFileId(meeting.id)
  const fileName = `${sanitizeFileName(meeting.title || "Untitled Meeting")} - transcript.txt`
  const filePath = `meetings/${meeting.id}/transcript.txt`

  const file: FileSystemItem = {
    id: fileId,
    file_id: fileId,
    name: fileName,
    type: "file",
    path: filePath,
    file_type: "text/plain",
    file_size: transcriptText.length,
    date_modified: new Date().toISOString(),
    date_uploaded: new Date().toISOString(),
  }

  return {
    file,
    payload: {
      fileData: encodeTextToBase64(transcriptText),
      mimeType: "text/plain",
    },
  }
}
