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
