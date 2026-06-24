import { ApiService } from '../../backend/api/apiService'
import type { MeetingSession } from '../../frontend/types/meeting-types'
import {
  MOCK_TRANSCRIPT_SEGMENTS,
  MOCK_TRANSCRIPT_TEXT,
  cloneMeetingSession,
  cloneMeetingSessions
} from './meeting-fixtures'

interface InstallMeetingAgentMockOptions {
  meetings?: MeetingSession[]
  delayMs?: number
  isLoading?: boolean
}

interface MockTranscriptResponse {
  utterances: Array<{
    id: string
    speaker: string
    speaker_name: string
    text: string
    start: number
    end: number
    confidence: number
  }>
}

function wait(delayMs: number) {
  return new Promise((resolve) => setTimeout(resolve, delayMs))
}

function getTranscriptResponse(): MockTranscriptResponse {
  return {
    utterances: MOCK_TRANSCRIPT_SEGMENTS.map((segment) => ({
      id: segment.id,
      speaker: segment.speakerId,
      speaker_name: segment.speakerName,
      text: segment.text,
      start: segment.startTime,
      end: segment.endTime,
      confidence: segment.confidence
    }))
  }
}

function findMeeting(meetings: MeetingSession[], sessionId: string) {
  return meetings.find((meeting) => meeting.id === sessionId) ?? meetings[0]
}

export function installMeetingAgentMock({
  meetings = cloneMeetingSessions(),
  delayMs = 250,
  isLoading = false
}: InstallMeetingAgentMockOptions = {}) {
  let mockMeetings = cloneMeetingSessions(meetings)

  const originalGetMeetingSessions = ApiService.MeetingAgent.getMeetingSessions
  const originalGetMeetingSession = ApiService.MeetingAgent.getMeetingSession
  const originalGetVideoStreamUrl = ApiService.MeetingAgent.getVideoStreamUrl
  const originalProxyTranscript = ApiService.MeetingAgent.proxyTranscript
  const originalDownloadRecording = ApiService.MeetingAgent.downloadRecording
  const originalGetTranscription = ApiService.MeetingAgent.getTranscription
  const originalDeleteMeetingSession = ApiService.MeetingAgent.deleteMeetingSession
  const originalRenameMeetingSession = ApiService.MeetingAgent.renameMeetingSession
  const originalShareMeetingSession = ApiService.MeetingAgent.shareMeetingSession
  const originalUploadRecordingToS3 = ApiService.MeetingAgent.uploadRecordingToS3
  const originalPost = ApiService.post

  ApiService.MeetingAgent.getMeetingSessions = async (limit = 50, offset = 0, status?: string) => {
    if (isLoading) return new Promise(() => {})

    await wait(delayMs)

    const filteredMeetings = status
      ? mockMeetings.filter((meeting) => meeting.status === status)
      : mockMeetings
    const sessions = filteredMeetings
      .slice(offset, offset + limit)
      .map(cloneMeetingSession)

    return {
      sessions,
      total: filteredMeetings.length,
      hasMore: offset + limit < filteredMeetings.length
    }
  }

  ApiService.MeetingAgent.getMeetingSession = async (sessionId: string) => {
    await wait(delayMs)
    return cloneMeetingSession(findMeeting(mockMeetings, sessionId))
  }

  ApiService.MeetingAgent.getVideoStreamUrl = async (sessionId: string) => {
    await wait(delayMs)

    const meeting = findMeeting(mockMeetings, sessionId)
    const streamUrl = meeting?.recordingUrl || meeting?.recallBot?.videoUrl

    return {
      success: Boolean(streamUrl),
      streamUrl,
      expiresIn: 3600,
      message: streamUrl ? 'Mock video stream ready' : 'No recording available'
    }
  }

  ApiService.MeetingAgent.proxyTranscript = async () => {
    await wait(delayMs)
    return getTranscriptResponse()
  }

  ApiService.MeetingAgent.downloadRecording = async (sessionId: string) => {
    await wait(delayMs)
    const meeting = findMeeting(mockMeetings, sessionId)

    return {
      success: Boolean(meeting?.recordingUrl),
      downloadUrl: meeting?.recordingUrl,
      message: meeting?.recordingUrl ? 'Recording download ready' : 'No recording available'
    }
  }

  ApiService.MeetingAgent.getTranscription = async (sessionId: string) => {
    await wait(delayMs)
    const meeting = findMeeting(mockMeetings, sessionId)

    return {
      segments: MOCK_TRANSCRIPT_SEGMENTS,
      fullText: meeting?.transcriptionText || MOCK_TRANSCRIPT_TEXT,
      isComplete: meeting?.status === 'completed',
      processingStatus: meeting?.status || 'completed',
      video_url: meeting?.recordingUrl,
      transcript_url: meeting?.transcriptionUrl,
      session_info: {
        id: sessionId,
        title: meeting?.title
      }
    }
  }

  ApiService.MeetingAgent.deleteMeetingSession = async (sessionId: string) => {
    await wait(delayMs)
    mockMeetings = mockMeetings.filter((meeting) => meeting.id !== sessionId)

    return {
      success: true,
      message: 'Meeting session deleted'
    }
  }

  ApiService.MeetingAgent.renameMeetingSession = async (sessionId: string, title: string) => {
    await wait(delayMs)

    mockMeetings = mockMeetings.map((meeting) =>
      meeting.id === sessionId ? { ...meeting, title } : meeting
    )

    return {
      success: true,
      message: 'Meeting renamed',
      session: cloneMeetingSession(findMeeting(mockMeetings, sessionId))
    }
  }

  ApiService.MeetingAgent.shareMeetingSession = async (_sessionId, recipients) => {
    await wait(delayMs)

    return {
      success: true,
      message: 'Meeting shared successfully',
      sharedWithCount: recipients.length
    }
  }

  ApiService.MeetingAgent.uploadRecordingToS3 = async (_sessionId, _recordingFile, onProgress) => {
    onProgress?.(25)
    await wait(delayMs)
    onProgress?.(100)

    return {
      success: true,
      recordingUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
      fileSize: 1024,
      s3Key: 'storybook/meeting-recording.mp4',
      message: 'Recording uploaded'
    }
  }

  const mockPost: typeof ApiService.post = async <T,>(endpoint: string, data?: unknown): Promise<T> => {
    await wait(delayMs)

    if (endpoint.includes('/meeting-agent/desktop/sdk-token/')) {
      return {
        success: true,
        upload_token: 'storybook-upload-token',
        session_id: 'storybook-desktop-session'
      } as T
    }

    if (endpoint.includes('/meeting-agent/desktop/session/')) {
      return {
        success: true,
        message: 'Desktop recording session ended'
      } as T
    }

    if (endpoint.includes('/summary/')) {
      return {
        success: true,
        message: 'Summary saved'
      } as T
    }

    return originalPost.call(ApiService, endpoint, data)
  }

  ApiService.post = mockPost

  return () => {
    ApiService.MeetingAgent.getMeetingSessions = originalGetMeetingSessions
    ApiService.MeetingAgent.getMeetingSession = originalGetMeetingSession
    ApiService.MeetingAgent.getVideoStreamUrl = originalGetVideoStreamUrl
    ApiService.MeetingAgent.proxyTranscript = originalProxyTranscript
    ApiService.MeetingAgent.downloadRecording = originalDownloadRecording
    ApiService.MeetingAgent.getTranscription = originalGetTranscription
    ApiService.MeetingAgent.deleteMeetingSession = originalDeleteMeetingSession
    ApiService.MeetingAgent.renameMeetingSession = originalRenameMeetingSession
    ApiService.MeetingAgent.shareMeetingSession = originalShareMeetingSession
    ApiService.MeetingAgent.uploadRecordingToS3 = originalUploadRecordingToS3
    ApiService.post = originalPost
  }
}
