import { ApiService } from '../../../../backend/api/apiService'

interface BotCreationResponse {
  success: boolean
  bot_id?: string
  session_id?: string
  bot_data?: Record<string, unknown>
  error?: string
  message?: string
}

interface StartRecordingParams {
  meetingUrl: string
  platform: string
  meetingTitle?: string
  transcriptionEnabled?: boolean
  botName?: string
  recordingMode?: string
  profilePictureUrl?: string
}

interface DesktopSDKStartRecordingParams {
  windowId: string
  platform: string
  meetingTitle?: string
  transcriptionEnabled?: boolean
}

/**
 * Create a bot to join and record a meeting
 * The bot will join the meeting via Recall AI's Bot API
 */
export async function createBotForMeeting(params: {
  meetingUrl: string
  platform: string
  meetingTitle?: string
  transcriptionEnabled?: boolean
  botName?: string
  recordingMode?: string
  profilePictureUrl?: string
}): Promise<BotCreationResponse> {
  try {
    const response = await ApiService.post<{
      success: boolean
      bot_id?: string
      session_id?: string
      bot_data?: Record<string, unknown>
      error?: string
      message?: string
    }>('/meeting-agent/desktop/upload-token/', {
      meeting_url: params.meetingUrl,
      platform: params.platform,
      meeting_title: params.meetingTitle || 'Meeting Recording',
      bot_name: params.botName || params.meetingTitle || 'Meeting Recorder',
      transcription_enabled: params.transcriptionEnabled ?? true,
      recording_mode: params.recordingMode || 'speaker_view',
      profile_picture_url: params.profilePictureUrl || ''
    })
    
    return {
      success: response.success,
      bot_id: response.bot_id,
      session_id: response.session_id,
      bot_data: response.bot_data,
      error: response.error,
      message: response.message
    }
  } catch (error) {
    console.error('[Desktop Recording] Failed to create bot:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create bot'
    }
  }
}

/**
 * Start a desktop SDK recording session
 * 
 * This function:
 * 1. Gets an upload token from the backend for the desktop SDK
 * 2. Calls the Electron Desktop SDK's startRecording function
 * 3. Returns success/error status with session_id for live transcription
 */
export async function handleStartDesktopSDKRecording(
  params: DesktopSDKStartRecordingParams,
  sdkStartRecording: (windowId: string, uploadToken: string) => Promise<{ success: boolean; error?: string }>
): Promise<{ success: boolean; sessionId?: string; error?: string; message?: string }> {
  try {
    console.log('[Desktop SDK] Getting upload token for window:', params.windowId)
    
    // Get upload token from backend
    const tokenResponse = await ApiService.post<{
      success: boolean
      upload_token?: string
      session_id?: string
      error?: string
      message?: string
    }>('/meeting-agent/desktop/sdk-token/', {
      window_id: params.windowId,
      platform: params.platform,
      meeting_title: params.meetingTitle || 'Desktop Recording',
      transcription_enabled: params.transcriptionEnabled ?? true
    })
    
    if (!tokenResponse.success || !tokenResponse.upload_token) {
      console.error('[Desktop SDK] Failed to get upload token:', tokenResponse.error)
      return {
        success: false,
        error: tokenResponse.error || 'Failed to get upload token',
        message: tokenResponse.message
      }
    }
    
    const sessionId = tokenResponse.session_id
    console.log('[Desktop SDK] Got session_id:', sessionId)
    console.log('[Desktop SDK] Starting recording with upload token')
    
    // Start recording using the Desktop SDK
    const recordingResult = await sdkStartRecording(params.windowId, tokenResponse.upload_token)
    
    if (!recordingResult.success) {
      console.error('[Desktop SDK] Failed to start recording:', recordingResult.error)
      return {
        success: false,
        error: recordingResult.error || 'Failed to start recording',
        message: 'The Desktop SDK failed to start recording'
      }
    }
    
    console.log('[Desktop SDK] Recording started successfully with session:', sessionId)
    
    return {
      success: true,
      sessionId,
      message: 'Desktop recording started successfully'
    }
  } catch (error) {
    console.error('[Desktop SDK] Failed to start desktop recording:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to start desktop recording'
    }
  }
}

/**
 * Start a meeting recording session using Recall AI Bot
 * 
 * This function:
 * 1. Creates a bot via the backend to join the meeting
 * 2. Returns the bot ID and session ID for tracking
 */
export async function handleStartRecording(
  params: StartRecordingParams
): Promise<{ success: boolean; bot_id?: string; session_id?: string; error?: string; message?: string }> {
  try {
    // Create bot to join the meeting
    const botResponse = await createBotForMeeting({
      meetingUrl: params.meetingUrl,
      platform: params.platform,
      meetingTitle: params.meetingTitle,
      transcriptionEnabled: params.transcriptionEnabled,
      botName: params.botName,
      recordingMode: params.recordingMode,
      profilePictureUrl: params.profilePictureUrl
    })
    
    if (!botResponse.success || !botResponse.bot_id) {
      return {
        success: false,
        error: botResponse.error || 'Failed to create bot',
        message: botResponse.message
      }
    }
    
    return {
      success: true,
      bot_id: botResponse.bot_id,
      session_id: botResponse.session_id,
      message: botResponse.message || 'Bot created and joining meeting'
    }
  } catch (error) {
    console.error('[Desktop Recording] Failed to start recording:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to start recording'
    }
  }
}

/**
 * Stop a desktop SDK recording session
 */
export async function handleStopDesktopSDKRecording(
  windowId: string,
  sdkStopRecording: (windowId: string) => Promise<{ success: boolean; error?: string }>,
  sessionId?: string
): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    console.log('[Desktop SDK] Stopping recording for window:', windowId, 'session:', sessionId)
    
    // Stop recording using the Desktop SDK
    const result = await sdkStopRecording(windowId)
    
    if (!result.success) {
      console.error('[Desktop SDK] Failed to stop recording:', result.error)
      return {
        success: false,
        error: result.error || 'Failed to stop recording',
        message: 'The Desktop SDK failed to stop recording'
      }
    }
    
    console.log('[Desktop SDK] Recording stopped successfully')
    
    // If we have a session ID, notify the backend to end the session
    if (sessionId) {
      try {
        console.log('[Desktop SDK] Ending session on backend:', sessionId)
        const endResponse = await ApiService.post<{
          success: boolean
          error?: string
          message?: string
        }>(`/meeting-agent/desktop/session/${sessionId}/end/`, {})
        
        if (!endResponse.success) {
          console.warn('[Desktop SDK] Failed to end session on backend:', endResponse.error)
          // Don't fail the whole operation, just log the warning
        } else {
          console.log('[Desktop SDK] Session ended on backend successfully')
        }
      } catch (endError) {
        console.warn('[Desktop SDK] Error ending session on backend:', endError)
        // Don't fail the whole operation
      }
    }
    
    return {
      success: true,
      message: 'Desktop recording stopped successfully'
    }
  } catch (error) {
    console.error('[Desktop SDK] Failed to stop desktop recording:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to stop desktop recording'
    }
  }
}

/**
 * Stop a bot recording session
 */
export async function handleStopRecording(
  botId: string
): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    // Call backend to stop the bot
    const response = await ApiService.post<{
      success: boolean
      error?: string
      message?: string
    }>(`/meeting-agent/recall-bot/${botId}/stop/`, {})
    
    return {
      success: response.success,
      error: response.error,
      message: response.message || 'Bot stopped successfully'
    }
  } catch (error) {
    console.error('[Desktop Recording] Failed to stop bot:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to stop bot'
    }
  }
}

/**
 * Get bot status and information
 */
export async function getBotStatus(
  botId: string
): Promise<{ success: boolean; bot_data?: Record<string, unknown>; error?: string; message?: string }> {
  try {
    const response = await ApiService.get<{
      success: boolean
      bot_data?: Record<string, unknown>
      error?: string
      message?: string
    }>(`/meeting-agent/recall-bot/${botId}/`)
    
    return {
      success: response.success,
      bot_data: response.bot_data,
      error: response.error,
      message: response.message
    }
  } catch (error) {
    console.error('[Desktop Recording] Failed to get bot status:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get bot status'
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
