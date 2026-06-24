import type {
  MeetingParticipant,
  MeetingPlatform,
  MeetingSession,
  MeetingSummary,
  TranscriptionSegment
} from '../../frontend/types/meeting-types'

const now = Date.now()
const minute = 60 * 1000

function getDate(minutesFromNow: number) {
  return new Date(now + minutesFromNow * minute)
}

export const ZOOM_PLATFORM: MeetingPlatform = {
  id: 'zoom',
  name: 'Zoom',
  icon: 'video',
  supported: true,
  authRequired: false
}

export const GOOGLE_MEET_PLATFORM: MeetingPlatform = {
  id: 'google-meet',
  name: 'Google Meet',
  icon: 'video',
  supported: true,
  authRequired: false
}

export const TEAMS_PLATFORM: MeetingPlatform = {
  id: 'teams',
  name: 'Microsoft Teams',
  icon: 'video',
  supported: true,
  authRequired: false
}

const meetingParticipants: MeetingParticipant[] = [
  {
    id: 'participant-1',
    name: 'Maya Chen',
    email: 'maya@example.com',
    role: 'host',
    joinTime: getDate(-68),
    duration: 3120
  },
  {
    id: 'participant-2',
    name: 'Jordan Lee',
    email: 'jordan@example.com',
    role: 'participant',
    joinTime: getDate(-66),
    duration: 2980
  },
  {
    id: 'participant-agent',
    name: 'Banbury Meeting Agent',
    role: 'agent',
    joinTime: getDate(-65),
    duration: 3000
  }
]

export const MOCK_TRANSCRIPT_SEGMENTS: TranscriptionSegment[] = [
  {
    id: 'segment-1',
    speakerId: 'participant-1',
    speakerName: 'Maya Chen',
    text: 'Let us start by reviewing the current rollout status and the open launch risks.',
    startTime: 0,
    endTime: 7.4,
    confidence: 0.98
  },
  {
    id: 'segment-2',
    speakerId: 'participant-2',
    speakerName: 'Jordan Lee',
    text: 'The onboarding flow is ready. The remaining item is the analytics event mapping.',
    startTime: 7.5,
    endTime: 15.2,
    confidence: 0.97
  },
  {
    id: 'segment-3',
    speakerId: 'participant-1',
    speakerName: 'Maya Chen',
    text: 'Good. Let us assign analytics validation to Priya and keep the launch checklist moving.',
    startTime: 15.3,
    endTime: 24.8,
    confidence: 0.96
  },
  {
    id: 'segment-4',
    speakerId: 'participant-2',
    speakerName: 'Jordan Lee',
    text: 'I will follow up with the dashboard owner and post the updated checklist this afternoon.',
    startTime: 24.9,
    endTime: 33.1,
    confidence: 0.98
  }
]

export const MOCK_TRANSCRIPT_TEXT = MOCK_TRANSCRIPT_SEGMENTS
  .map((segment) => `${segment.speakerName}: ${segment.text}`)
  .join('\n\n')

export const MOCK_MEETING_SUMMARY_HTML = `
  <h2>Launch Readiness Summary</h2>
  <p>The team reviewed the rollout status and confirmed the onboarding flow is ready for final validation.</p>
  <h2>Key Points</h2>
  <ul>
    <li>Onboarding implementation is complete.</li>
    <li>Analytics event mapping remains the main pre-launch risk.</li>
    <li>The launch checklist will be updated after dashboard validation.</li>
  </ul>
  <h2>Action Items</h2>
  <ul data-type="taskList">
    <li data-type="taskItem" data-checked="false">Validate analytics mapping with the dashboard owner.</li>
    <li data-type="taskItem" data-checked="true">Confirm onboarding flow is ready.</li>
  </ul>
`

const completedMeetingSummary: MeetingSummary = {
  id: 'summary-completed',
  meetingId: 'meeting-completed',
  summary: MOCK_MEETING_SUMMARY_HTML,
  keyPoints: [
    'Onboarding implementation is complete',
    'Analytics validation remains open',
    'Launch checklist will be updated today'
  ],
  actionItems: [
    {
      id: 'action-1',
      description: 'Validate analytics mapping with the dashboard owner',
      assignee: 'Jordan Lee',
      priority: 'high',
      status: 'in_progress'
    },
    {
      id: 'action-2',
      description: 'Confirm onboarding flow readiness',
      assignee: 'Maya Chen',
      priority: 'medium',
      status: 'completed'
    }
  ],
  decisions: ['Proceed with launch preparation once analytics validation is complete'],
  nextSteps: ['Post the updated checklist', 'Review dashboard events before launch'],
  generatedAt: getDate(-15)
}

const baseMetadata = {
  recordingEnabled: true,
  transcriptionEnabled: true,
  summaryEnabled: true,
  actionItemsEnabled: true,
  language: 'en',
  quality: 'high' as const,
  autoJoin: true,
  autoLeave: true,
  maxDuration: 60
}

export const MOCK_SCHEDULED_MEETING: MeetingSession = {
  id: 'meeting-scheduled',
  title: 'Customer Onboarding Planning',
  platform: GOOGLE_MEET_PLATFORM,
  meetingUrl: 'https://meet.google.com/storybook-scheduled',
  status: 'scheduled',
  startTime: getDate(90),
  participants: meetingParticipants.slice(0, 2),
  metadata: baseMetadata
}

export const MOCK_ACTIVE_MEETING: MeetingSession = {
  id: 'meeting-active',
  title: 'Live Product Standup',
  platform: ZOOM_PLATFORM,
  meetingUrl: 'https://zoom.us/j/storybook-active',
  status: 'active',
  startTime: getDate(-22),
  agentJoinTime: getDate(-21),
  participants: meetingParticipants,
  metadata: {
    ...baseMetadata,
    maxDuration: 45
  }
}

export const MOCK_RECORDING_MEETING: MeetingSession = {
  id: 'meeting-recording',
  title: 'Recording: Design Critique',
  platform: TEAMS_PLATFORM,
  meetingUrl: 'https://teams.microsoft.com/l/storybook-recording',
  status: 'recording',
  startTime: getDate(-38),
  agentJoinTime: getDate(-37),
  transcriptionText: MOCK_TRANSCRIPT_TEXT,
  participants: meetingParticipants,
  metadata: {
    ...baseMetadata,
    maxDuration: 60,
    recordingMode: 'speaker_view'
  },
  recallBot: {
    id: 'bot-recording',
    status: 'recording',
    meetingUrl: 'https://teams.microsoft.com/l/storybook-recording',
    recordingStatus: 'recording',
    transcriptionStatus: 'processing',
    createdAt: getDate(-39),
    joinedAt: getDate(-38),
    metadata: {
      recording_mode: 'speaker_view',
      transcription_options: {
        provider: 'recall',
        language: 'en'
      }
    }
  }
}

export const MOCK_TRANSCRIBING_MEETING: MeetingSession = {
  id: 'meeting-transcribing',
  title: 'Transcribing: Sales Handoff',
  platform: GOOGLE_MEET_PLATFORM,
  meetingUrl: 'https://meet.google.com/storybook-transcribing',
  status: 'transcribing',
  startTime: getDate(-95),
  endTime: getDate(-35),
  duration: 3600,
  participants: meetingParticipants.slice(0, 2),
  metadata: baseMetadata,
  recallBot: {
    id: 'bot-transcribing',
    status: 'completed',
    meetingUrl: 'https://meet.google.com/storybook-transcribing',
    recordingStatus: 'processing',
    transcriptionStatus: 'processing',
    createdAt: getDate(-96),
    joinedAt: getDate(-95),
    leftAt: getDate(-35),
    metadata: {
      recording_mode: 'gallery_view',
      transcription_options: {
        provider: 'recall',
        language: 'en'
      }
    }
  }
}

export const MOCK_PROCESSING_MEETING: MeetingSession = {
  id: 'meeting-processing',
  title: 'Processing: Partner Review',
  platform: ZOOM_PLATFORM,
  meetingUrl: 'https://zoom.us/j/storybook-processing',
  status: 'processing',
  startTime: getDate(-140),
  endTime: getDate(-82),
  duration: 3480,
  participants: meetingParticipants,
  metadata: baseMetadata,
  transcriptionText: MOCK_TRANSCRIPT_TEXT
}

export const MOCK_COMPLETED_MEETING: MeetingSession = {
  id: 'meeting-completed',
  title: 'Launch Readiness Review',
  platform: ZOOM_PLATFORM,
  meetingUrl: 'https://zoom.us/j/storybook-completed',
  status: 'completed',
  startTime: getDate(-180),
  endTime: getDate(-122),
  duration: 3480,
  recordingUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  transcriptionUrl: 'mock://transcripts/launch-readiness',
  transcriptionText: MOCK_TRANSCRIPT_TEXT,
  participants: meetingParticipants,
  metadata: baseMetadata,
  summary: completedMeetingSummary
}

export const MOCK_COMPLETED_MEETING_WITHOUT_RECORDING: MeetingSession = {
  ...MOCK_COMPLETED_MEETING,
  id: 'meeting-completed-no-recording',
  title: 'Completed: Notes Only Sync',
  recordingUrl: undefined,
  transcriptionUrl: undefined,
  summary: {
    ...completedMeetingSummary,
    id: 'summary-notes-only',
    meetingId: 'meeting-completed-no-recording'
  }
}

export const MOCK_FAILED_MEETING: MeetingSession = {
  id: 'meeting-failed',
  title: 'Failed: Vendor Demo',
  platform: TEAMS_PLATFORM,
  meetingUrl: 'https://teams.microsoft.com/l/storybook-failed',
  status: 'failed',
  startTime: getDate(-240),
  endTime: getDate(-235),
  duration: 300,
  participants: meetingParticipants.slice(0, 1),
  metadata: baseMetadata,
  recallBot: {
    id: 'bot-failed',
    status: 'failed',
    meetingUrl: 'https://teams.microsoft.com/l/storybook-failed',
    recordingStatus: 'failed',
    transcriptionStatus: 'failed',
    createdAt: getDate(-241),
    metadata: {
      recording_mode: 'shared_screen',
      transcription_options: {
        provider: 'recall',
        language: 'en'
      }
    }
  }
}

export const MOCK_MEETING_SESSIONS: MeetingSession[] = [
  MOCK_ACTIVE_MEETING,
  MOCK_RECORDING_MEETING,
  MOCK_TRANSCRIBING_MEETING,
  MOCK_PROCESSING_MEETING,
  MOCK_COMPLETED_MEETING,
  MOCK_COMPLETED_MEETING_WITHOUT_RECORDING,
  MOCK_FAILED_MEETING,
  MOCK_SCHEDULED_MEETING
]

function cloneDate(date: Date | undefined) {
  if (!date) return undefined
  return new Date(date)
}

function cloneParticipants(participants: MeetingParticipant[]) {
  return participants.map((participant) => ({
    ...participant,
    joinTime: new Date(participant.joinTime),
    leaveTime: cloneDate(participant.leaveTime)
  }))
}

function cloneSummary(summary: MeetingSummary | undefined) {
  if (!summary) return undefined

  return {
    ...summary,
    generatedAt: new Date(summary.generatedAt),
    keyPoints: [...summary.keyPoints],
    actionItems: summary.actionItems.map((actionItem) => ({ ...actionItem })),
    decisions: [...summary.decisions],
    nextSteps: [...summary.nextSteps]
  }
}

export function cloneMeetingSession(meeting: MeetingSession): MeetingSession {
  return {
    ...meeting,
    platform: { ...meeting.platform },
    startTime: new Date(meeting.startTime),
    endTime: cloneDate(meeting.endTime),
    agentJoinTime: cloneDate(meeting.agentJoinTime),
    participants: cloneParticipants(meeting.participants),
    metadata: { ...meeting.metadata },
    summary: cloneSummary(meeting.summary),
    recallBot: meeting.recallBot
      ? {
          ...meeting.recallBot,
          createdAt: new Date(meeting.recallBot.createdAt),
          joinedAt: cloneDate(meeting.recallBot.joinedAt),
          leftAt: cloneDate(meeting.recallBot.leftAt),
          metadata: {
            ...meeting.recallBot.metadata,
            transcription_options: {
              ...meeting.recallBot.metadata.transcription_options
            },
            automatic_leave: meeting.recallBot.metadata.automatic_leave
              ? { ...meeting.recallBot.metadata.automatic_leave }
              : undefined,
            real_time_transcription: meeting.recallBot.metadata.real_time_transcription
              ? { ...meeting.recallBot.metadata.real_time_transcription }
              : undefined
          }
        }
      : undefined,
    recordings: meeting.recordings?.map((recording) => ({
      ...recording,
      status: { ...recording.status },
      media_shortcuts: { ...recording.media_shortcuts },
      realtime_endpoints: recording.realtime_endpoints.map((endpoint) => ({ ...endpoint })),
      metadata: { ...recording.metadata }
    }))
  }
}

export function cloneMeetingSessions(meetings: MeetingSession[] = MOCK_MEETING_SESSIONS) {
  return meetings.map(cloneMeetingSession)
}
