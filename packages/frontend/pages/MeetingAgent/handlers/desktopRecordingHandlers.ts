import { ApiService } from '../../../../backend/api/apiService'

interface UploadTokenResponse {
  success: boolean
  upload_token?: string
  token_id?: string
  expires_at?: string
  error?: string
  message?: string
}

interface StartRecordingParams {
  windowId: string
  platform: string
  meetingTitle?: string
  transcriptionEnabled?: boolean
}

/**
 * Fetch an upload token from the backend for desktop recording
 */
export async function fetchUploadToken(params: {
  platform: string
  meetingTitle?: string
  transcriptionEnabled?: boolean
}): Promise<UploadTokenResponse> {
  try {
    const response = await ApiService.post('/meeting-agent/desktop/upload-token/', {
      platform: params.platform,
      meeting_title: params.meetingTitle || 'Desktop Recording',
      transcription_enabled: params.transcriptionEnabled ?? true
    })
    
    if (response.success) {
      return {
        success: true,
        upload_token: response.upload_token,
        token_id: response.token_id,
        expires_at: response.expires_at
      }
    }
    
    return {
      success: false,
      error: response.error || 'Failed to get upload token',
      message: response.message
    }
  } catch (error) {
    console.error('[Desktop Recording] Failed to fetch upload token:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch upload token'
    }
  }
}

/**
 * Start a desktop recording session
 * 
 * This function:
 * 1. Fetches an upload token from the backend
 * 2. Calls the Electron IPC to start recording with the token
 */
export async function handleStartRecording(
  params: StartRecordingParams,
  startRecordingFn: (windowId: string, uploadToken: string) => Promise<{ success: boolean; error?: string }>
): Promise<{ success: boolean; error?: string }> {
  try {
    // Step 1: Get upload token from backend
    const tokenResponse = await fetchUploadToken({
      platform: params.platform,
      meetingTitle: params.meetingTitle,
      transcriptionEnabled: params.transcriptionEnabled
    })
    
    if (!tokenResponse.success || !tokenResponse.upload_token) {
      return {
        success: false,
        error: tokenResponse.error || 'Failed to get upload token'
      }
    }
    
    // Step 2: Start recording with the token
    const result = await startRecordingFn(params.windowId, tokenResponse.upload_token)
    
    return result
  } catch (error) {
    console.error('[Desktop Recording] Failed to start recording:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to start recording'
    }
  }
}

/**
 * Stop a desktop recording session
 */
export async function handleStopRecording(
  windowId: string,
  stopRecordingFn: (windowId: string) => Promise<{ success: boolean; error?: string }>
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await stopRecordingFn(windowId)
    return result
  } catch (error) {
    console.error('[Desktop Recording] Failed to stop recording:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to stop recording'
    }
  }
}

/**
 * Get platform display name from platform identifier
 */
export function getPlatformDisplayName(platform: string): string {
  const platformMap: Record<string, string> = {
    'zoom': 'Zoom',
    'teams': 'Microsoft Teams',
    'meet': 'Google Meet',
    'webex': 'Webex',
    'slack': 'Slack Huddle',
    'discord': 'Discord',
    'desktop': 'Desktop Recording',
    'unknown': 'Unknown Platform'
  }
  
  return platformMap[platform.toLowerCase()] || platform
}

/**
 * Get platform icon from platform identifier
 */
export function getPlatformIcon(platform: string): string {
  const iconMap: Record<string, string> = {
    'zoom': '🎥',
    'teams': '💼',
    'meet': '📞',
    'webex': '🎦',
    'slack': '💬',
    'discord': '🎮',
    'desktop': '🖥️',
    'unknown': '📹'
  }
  
  return iconMap[platform.toLowerCase()] || '📹'
}

/**
 * Format recording duration from milliseconds
 */
export function formatRecordingDuration(startTime: number | null): string {
  if (!startTime) return '00:00'
  
  const durationMs = Date.now() - startTime
  const totalSeconds = Math.floor(durationMs / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }
  
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}
