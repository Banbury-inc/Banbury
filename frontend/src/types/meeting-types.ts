export interface MeetingPlatform {
  id: string
  name: string
  icon: string
  supported: boolean
  authRequired: boolean
}

export interface MeetingSession {
  id: string
  title: string
  platform: MeetingPlatform
  meetingUrl: string
  status: 'scheduled' | 'joining' | 'active' | 'recording' | 'transcribing' | 'processing' | 'completed' | 'failed'
  startTime: Date
  endTime?: Date
  duration?: number
  agentJoinTime?: Date
  recordingUrl?: string
  transcriptionUrl?: string
  transcriptionText?: string
  participants: MeetingParticipant[]
  metadata: MeetingMetadata
  // Recall AI specific fields
  recallBot?: RecallBot
}

export interface MeetingParticipant {
  id: string
  name: string
  email?: string
  role: 'host' | 'participant' | 'agent'
  joinTime: Date
  leaveTime?: Date
  duration?: number
}

export interface MeetingMetadata {
  recordingEnabled: boolean
  transcriptionEnabled: boolean
  summaryEnabled: boolean
  actionItemsEnabled: boolean
  language: string
  quality: 'low' | 'medium' | 'high'
  autoJoin: boolean
  autoLeave: boolean
  maxDuration: number
  // Recall AI specific settings
  recordingMode?: 'speaker_view' | 'gallery_view' | 'shared_screen'
  botName?: string
  profilePictureUrl?: string
}

export interface TranscriptionSegment {
  id: string
  speakerId: string
  speakerName: string
  text: string
  startTime: number
  endTime: number
  confidence: number
}

export interface MeetingSummary {
  id: string
  meetingId: string
  summary: string
  keyPoints: string[]
  actionItems: ActionItem[]
  decisions: string[]
  nextSteps: string[]
  generatedAt: Date
}

export interface ActionItem {
  id: string
  description: string
  assignee?: string
  dueDate?: Date
  priority: 'low' | 'medium' | 'high'
  status: 'pending' | 'in_progress' | 'completed'
}

export interface MeetingAgentConfig {
  id: string
  name: string
  platforms: MeetingPlatform[]
  defaultSettings: MeetingMetadata
  apiCredentials: Record<string, string>
  webhookUrl?: string
  notificationSettings: NotificationSettings
  profilePictureUrl?: string
  botName?: string
}

export interface NotificationSettings {
  emailNotifications: boolean
  slackNotifications: boolean
  webhookNotifications: boolean
  summaryDelivery: 'immediate' | 'daily' | 'weekly'
}

export interface MeetingJoinRequest {
  meetingUrl: string
  platform: string
  title?: string
  settings: Partial<MeetingMetadata>
  scheduledStartTime?: Date
}

export interface MeetingAgentStatus {
  isOnline: boolean
  activeConnections: number
  totalMeetingsToday: number
  totalRecordingTime: number
  lastActivity?: Date
  systemHealth: 'healthy' | 'degraded' | 'offline'
}

// Recall AI specific interfaces
export interface RecallBot {
  id: string
  status: 'joining' | 'active' | 'recording' | 'leaving' | 'completed' | 'failed'
  meetingUrl: string
  joinUrl?: string
  recordingStatus: 'not_started' | 'recording' | 'processing' | 'completed' | 'failed'
  transcriptionStatus: 'not_started' | 'processing' | 'completed' | 'failed'
  createdAt: Date
  joinedAt?: Date
  leftAt?: Date
  metadata: RecallBotMetadata
  videoUrl?: string
  audioUrl?: string
  transcriptUrl?: string
  chatMessagesUrl?: string
}

export interface RecallBotMetadata {
  meeting_title?: string
  bot_name?: string
  recording_mode: 'speaker_view' | 'gallery_view' | 'shared_screen'
  transcription_options: {
    provider: 'meeting_captions' | 'recall'
    language?: string
  }
  real_time_transcription?: {
    destination_url?: string
    partial_results?: boolean
  }
  automatic_leave?: {
    waiting_room_timeout?: number
    noone_joined_timeout?: number
    everyone_left_timeout?: number
  }
}

export interface RecallBotResponse {
  success: boolean
  bot?: RecallBot
  message: string
}

export interface RecallWebhookEvent {
  event: 'bot.status_change' | 'bot.recording_ready' | 'bot.transcription_ready'
  data: {
    bot_id: string
    status?: string
    recording_url?: string
    transcription_url?: string
    meeting_metadata?: any
  }
}
