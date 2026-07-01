/**
 * Type definitions for Desktop Recording SDK integration
 */

export interface MeetingWindow {
  id: string
  platform: string
  title: string
}

export interface PermissionStatus {
  accessibility: boolean
  microphone: boolean
  screenCapture: boolean
}

export interface RecordingStatus {
  isRecording: boolean
  windowId: string | null
  startTime: number | null
  platform: string | null
}

export interface DesktopRecordingStatus {
  platformSupported?: boolean
  platformError?: string
  lastError?: string
  initialized: boolean
  permissions: PermissionStatus
  recording: RecordingStatus
  detectedMeetings: MeetingWindow[]
  debug?: {
    platform: string
    arch: string
    sdkLoaded: boolean
    nodeVersion: string
  }
}

export interface DesktopRecordingAPI {
  getStatus: () => Promise<DesktopRecordingStatus>
  requestPermissions: () => Promise<PermissionStatus>
  startRecording: (windowId: string, uploadToken: string) => Promise<{ success: boolean; error?: string }>
  stopRecording: (windowId: string) => Promise<{ success: boolean; error?: string }>
  getDetectedMeetings: () => Promise<MeetingWindow[]>
  getPermissions: () => Promise<PermissionStatus>
  getRecordingStatus: () => Promise<RecordingStatus>
  onMeetingDetected: (callback: (meeting: MeetingWindow) => void) => () => void
  onMeetingEnded: (callback: (meeting: MeetingWindow) => void) => () => void
  onRecordingStarted: (callback: (status: RecordingStatus) => void) => () => void
  onRecordingStopped: (callback: (event: { windowId: string; reason: string }) => void) => () => void
  onPermissionUpdate: (callback: (permissions: PermissionStatus) => void) => () => void
  onError: (callback: (error: { error: string; windowId?: string }) => void) => () => void
  onUploadComplete?: (callback: (result: { success: boolean; error?: string }) => void) => () => void
}

export interface DesktopAppAPI {
  getPlatform: () => string
  isDesktop: boolean
  getElectronVersion: () => string
  openFileDialog?: (options?: { multiple?: boolean }) => Promise<{
    canceled: boolean
    files: Array<{ name: string; data: ArrayBuffer; mimeType: string }>
  }>
  desktopRecording: DesktopRecordingAPI
}

// Extend the Window interface
declare global {
  interface Window {
    desktopApp?: DesktopAppAPI
  }
}
