import { tool } from "@langchain/core/tools"
import { z } from "zod"
import { CONFIG } from "../../../../../../frontend/config/config"
import { getServerContextValue } from "../../../../../../frontend/assistant/langraph/serverContext"

interface MeetingToolPreferences {
  meeting_analysis?: boolean
}

interface FetchMeetingResourceParams {
  apiBase: string
  token: string
  path: string
}

interface MeetingSourceResult {
  available: boolean
  data?: any
  error?: string
}

const maxTranscriptCharacters = 24000

async function fetchMeetingResource({
  apiBase,
  token,
  path,
}: FetchMeetingResourceParams): Promise<MeetingSourceResult> {
  const response = await fetch(`${apiBase}${path}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) {
    return {
      available: false,
      error: `HTTP ${response.status}: ${response.statusText}`,
    }
  }

  return {
    available: true,
    data: await response.json(),
  }
}

function truncateTranscript(text: string): string {
  if (text.length <= maxTranscriptCharacters) return text

  return `${text.slice(0, maxTranscriptCharacters)}\n\n[Transcript truncated to ${maxTranscriptCharacters} characters for tool context.]`
}

function normalizeTranscript(transcription: any): {
  fullText: string
  segmentCount: number
  isComplete?: boolean
  processingStatus?: string
  transcriptUrl?: string
} {
  let fullText = ""
  if (typeof transcription?.full_text === "string") fullText = transcription.full_text
  if (!fullText && typeof transcription?.fullText === "string") fullText = transcription.fullText

  const segments = Array.isArray(transcription?.segments) ? transcription.segments : []

  return {
    fullText: truncateTranscript(fullText),
    segmentCount: segments.length,
    isComplete: transcription?.is_complete ?? transcription?.isComplete,
    processingStatus: transcription?.processing_status ?? transcription?.processingStatus,
    transcriptUrl: transcription?.transcript_url ?? transcription?.transcriptUrl,
  }
}

export const meetingAnalysisTool = tool(
  async (input: { sessionId: string; question?: string; focus?: string }) => {
    const prefs = (getServerContextValue<any>("toolPreferences") || {}) as MeetingToolPreferences
    if (prefs.meeting_analysis === false) {
      return JSON.stringify({
        success: false,
        error: "Meeting analysis access is disabled by user preference",
      })
    }

    const apiBase = CONFIG.url
    const token = getServerContextValue<string>("authToken")

    if (!token) {
      throw new Error("Missing auth token in server context")
    }

    const sessionId = encodeURIComponent(input.sessionId)
    const [session, details, transcription, summary] = await Promise.all([
      fetchMeetingResource({ apiBase, token, path: `/meeting-agent/sessions/${sessionId}/` }),
      fetchMeetingResource({ apiBase, token, path: `/meeting-agent/sessions/${sessionId}/meeting-details/` }),
      fetchMeetingResource({ apiBase, token, path: `/meeting-agent/sessions/${sessionId}/transcription/` }),
      fetchMeetingResource({ apiBase, token, path: `/meeting-agent/sessions/${sessionId}/summary/` }),
    ])

    if (!session.available && !details.available) {
      return JSON.stringify({
        success: false,
        error: "Unable to fetch meeting session data",
        sources: {
          session,
          details,
          transcription,
          summary,
        },
      })
    }

    const sessionData = session.data || {}
    const detailsData = details.data || {}
    const transcriptionData = transcription.data || {}
    const normalizedTranscript = transcription.available
      ? normalizeTranscript(transcriptionData)
      : undefined

    return JSON.stringify({
      success: true,
      question: input.question,
      focus: input.focus,
      meeting: {
        id: sessionData.id ?? detailsData.id ?? input.sessionId,
        title: sessionData.title ?? detailsData.title ?? transcriptionData?.session_info?.title,
        status: sessionData.status ?? detailsData.status,
        platform: sessionData.platform ?? detailsData.platform ?? transcriptionData?.session_info?.platform,
        startTime: sessionData.startTime ?? sessionData.start_time ?? detailsData.startTime ?? detailsData.start_time,
        endTime: sessionData.endTime ?? sessionData.end_time ?? detailsData.endTime ?? detailsData.end_time,
        duration: sessionData.duration ?? detailsData.duration ?? transcriptionData?.session_info?.duration,
        participants: sessionData.participants ?? detailsData.participants ?? transcriptionData?.session_info?.participants ?? [],
      },
      summary: summary.available ? summary.data : sessionData.summary ?? detailsData.summary,
      transcript: normalizedTranscript,
      details: details.available ? details.data : undefined,
      sources: {
        session: { available: session.available, error: session.error },
        details: { available: details.available, error: details.error },
        transcription: { available: transcription.available, error: transcription.error },
        summary: { available: summary.available, error: summary.error },
      },
    })
  },
  {
    name: "meeting_analysis",
    description:
      "Fetch and analyze a recorded meeting by session ID, including its summary, transcript, participants, timing, status, and meeting details. Use this when the user asks questions about a specific meeting.",
    schema: z.object({
      sessionId: z.string().describe("The meeting session ID to analyze"),
      question: z.string().optional().describe("The user's question about the meeting"),
      focus: z.string().optional().describe("Optional analysis focus, such as decisions, action items, risks, blockers, or follow-ups"),
    }),
  }
)
