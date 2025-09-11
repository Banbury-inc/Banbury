import { ApiService } from './apiService'
import { CONFIG } from '../config/config'
import {
  MeetingSession,
  MeetingJoinRequest,
  MeetingAgentStatus,
  MeetingAgentConfig,
  MeetingSummary,
  TranscriptionSegment,
  MeetingPlatform,
  RecallBot,
  RecallBotResponse,
  RecallBotMetadata
} from '../types/meeting-types'

export class MeetingAgentService {
  private static baseEndpoint = '/meeting-agent'

  /**
   * Get available meeting platforms and their support status
   */
  static async getSupportedPlatforms(): Promise<MeetingPlatform[]> {
    try {
      const response = await ApiService.get<{
        platforms: MeetingPlatform[]
      }>(`${this.baseEndpoint}/platforms/`)
      
      return response.platforms
    } catch (error) {
      console.error('Failed to fetch supported platforms:', error)
      // Return default platforms if API fails
      return [
        {
          id: 'zoom',
          name: 'Zoom',
          icon: 'video-camera',
          supported: true,
          authRequired: true
        },
        {
          id: 'teams',
          name: 'Microsoft Teams',
          icon: 'microsoft',
          supported: true,
          authRequired: true
        },
        {
          id: 'meet',
          name: 'Google Meet',
          icon: 'google',
          supported: true,
          authRequired: true
        },
        {
          id: 'webex',
          name: 'Cisco Webex',
          icon: 'video',
          supported: false,
          authRequired: true
        }
      ]
    }
  }

  /**
   * Get current agent status
   */
  static async getAgentStatus(): Promise<MeetingAgentStatus> {
    try {
      const response = await ApiService.get<MeetingAgentStatus>(
        `${this.baseEndpoint}/status/`
      )
      return response
    } catch (error) {
      console.error('Failed to fetch agent status:', error)
      
      // Return offline status as fallback instead of throwing
      return {
        isOnline: false,
        activeConnections: 0,
        totalMeetingsToday: 0,
        totalRecordingTime: 0,
        lastActivity: null,
        systemHealth: 'offline'
      }
    }
  }

  /**
   * Start a meeting session by joining a meeting URL using Recall AI
   */
  static async joinMeeting(request: MeetingJoinRequest): Promise<{
    success: boolean
    sessionId?: string
    recallBotId?: string
    message: string
  }> {
    try {
      const response = await ApiService.post<{
        success: boolean
        sessionId?: string
        recall_bot_id?: string
        message: string
      }>(`${this.baseEndpoint}/join/`, request)
      
      return {
        success: response.success,
        sessionId: response.sessionId,
        recallBotId: response.recall_bot_id,
        message: response.message
      }
    } catch (error) {
      console.error('Failed to join meeting:', error)
      throw error
    }
  }

  /**
   * Get all meeting sessions for the current user
   */
  static async getMeetingSessions(
    limit: number = 50,
    offset: number = 0,
    status?: string
  ): Promise<{
    sessions: MeetingSession[]
    total: number
    hasMore: boolean
  }> {
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString()
      })
      
      if (status) {
        params.append('status', status)
      }

      console.log('Making API call to:', `${this.baseEndpoint}/sessions/?${params.toString()}`)
      const response = await ApiService.get<{
        sessions: MeetingSession[]
        total: number
        hasMore: boolean
      }>(`${this.baseEndpoint}/sessions/?${params.toString()}`)
      
      console.log('API response received:', response)
      return response
    } catch (error) {
      console.error('Failed to fetch meeting sessions:', error)
      
      // Return empty sessions as fallback instead of throwing
      return {
        sessions: [],
        total: 0,
        hasMore: false
      }
    }
  }

  /**
   * Get a specific meeting session by ID
   */
  static async getMeetingSession(sessionId: string): Promise<MeetingSession> {
    try {
      const response = await ApiService.get<MeetingSession>(
        `${this.baseEndpoint}/sessions/${sessionId}/`
      )
      return response
    } catch (error) {
      console.error('Failed to fetch meeting session:', error)
      throw error
    }
  }

  /**
   * Stop recording and leave a meeting
   */
  static async leaveMeeting(sessionId: string): Promise<{
    success: boolean
    message: string
  }> {
    try {
      const response = await ApiService.post<{
        success: boolean
        message: string
      }>(`${this.baseEndpoint}/leave/${sessionId}/`, {})
      
      return response
    } catch (error) {
      console.error('Failed to leave meeting:', error)
      throw error
    }
  }

  /**
   * Get transcription for a meeting session
   */
  static async getTranscription(sessionId: string): Promise<{
    segments: TranscriptionSegment[]
    fullText: string
    isComplete: boolean
    processingStatus: string
  }> {
    try {
      const response = await ApiService.get<{
        segments: TranscriptionSegment[]
        fullText: string
        isComplete: boolean
        processingStatus: string
      }>(`${this.baseEndpoint}/sessions/${sessionId}/transcription/`)
      
      return response
    } catch (error) {
      console.error('Failed to fetch transcription:', error)
      throw error
    }
  }

  /**
   * Generate or get meeting summary
   */
  static async getMeetingSummary(sessionId: string): Promise<MeetingSummary> {
    try {
      const response = await ApiService.get<MeetingSummary>(
        `${this.baseEndpoint}/sessions/${sessionId}/summary/`
      )
      return response
    } catch (error) {
      console.error('Failed to fetch meeting summary:', error)
      throw error
    }
  }

  /**
   * Generate meeting summary if not already generated
   */
  static async generateMeetingSummary(sessionId: string): Promise<{
    success: boolean
    message: string
    summary?: MeetingSummary
  }> {
    try {
      const response = await ApiService.post<{
        success: boolean
        message: string
        summary?: MeetingSummary
      }>(`${this.baseEndpoint}/sessions/${sessionId}/summary/`, {})
      
      return response
    } catch (error) {
      console.error('Failed to generate meeting summary:', error)
      throw error
    }
  }

  /**
   * Download meeting recording
   */
  static async downloadRecording(sessionId: string): Promise<{
    success: boolean
    downloadUrl?: string
    message: string
  }> {
    try {
      const response = await ApiService.get<{
        success: boolean
        downloadUrl?: string
        message: string
      }>(`${this.baseEndpoint}/sessions/${sessionId}/recording/download/`)
      
      return response
    } catch (error) {
      console.error('Failed to download recording:', error)
      throw error
    }
  }

  /**
   * Get video stream URL for viewing recordings
   */
  static async getVideoStreamUrl(sessionId: string): Promise<{
    success: boolean
    streamUrl?: string
    expiresIn?: number
    message: string
  }> {
    try {
      const response = await ApiService.get<{
        success: boolean
        stream_url?: string
        expires_in?: number
        message: string
      }>(`${this.baseEndpoint}/sessions/${sessionId}/recording/stream/`)
      
      return {
        success: response.success,
        streamUrl: response.stream_url,
        expiresIn: response.expires_in,
        message: response.message
      }
    } catch (error) {
      console.error('Failed to get video stream URL:', error)
      throw error
    }
  }

  /**
   * Upload meeting recording to S3
   */
  static async uploadRecordingToS3(
    sessionId: string,
    recordingFile: File,
    onProgress?: (progress: number) => void
  ): Promise<{
    success: boolean
    recordingUrl?: string
    fileSize?: number
    s3Key?: string
    message: string
  }> {
    try {
      const formData = new FormData()
      formData.append('recording', recordingFile)

      // Create XMLHttpRequest for progress tracking
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest()

        // Track upload progress
        if (onProgress) {
          xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
              const progress = (event.loaded / event.total) * 100
              onProgress(progress)
            }
          })
        }

        xhr.addEventListener('load', () => {
          try {
            const response = JSON.parse(xhr.responseText)
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(response)
            } else {
              reject(new Error(response.message || 'Upload failed'))
            }
          } catch (error) {
            reject(new Error('Invalid response from server'))
          }
        })

        xhr.addEventListener('error', () => {
          reject(new Error('Network error during upload'))
        })

        xhr.addEventListener('abort', () => {
          reject(new Error('Upload was cancelled'))
        })

        // Get auth token
        const token = localStorage.getItem('authToken')
        if (!token) {
          reject(new Error('Authentication required'))
          return
        }

        // Configure request
        xhr.open('POST', `${CONFIG.url}${this.baseEndpoint}/sessions/${sessionId}/recording/upload/`)
        xhr.setRequestHeader('Authorization', `Bearer ${token}`)
        
        // Send request
        xhr.send(formData)
      })
    } catch (error) {
      console.error('Failed to upload recording:', error)
      throw error
    }
  }

  /**
   * Get agent configuration
   */
  static async getAgentConfig(): Promise<MeetingAgentConfig> {
    try {
      const response = await ApiService.get<MeetingAgentConfig>(
        `${this.baseEndpoint}/config/`
      )
      return response
    } catch (error) {
      console.error('Failed to fetch agent config:', error)
      throw error
    }
  }

  /**
   * Update agent configuration
   */
  static async updateAgentConfig(config: Partial<MeetingAgentConfig>): Promise<{
    success: boolean
    message: string
    config?: MeetingAgentConfig
  }> {
    try {
      const response = await ApiService.put<{
        success: boolean
        message: string
        config?: MeetingAgentConfig
      }>(`${this.baseEndpoint}/config/`, config)
      
      return response
    } catch (error) {
      console.error('Failed to update agent config:', error)
      throw error
    }
  }

  /**
   * Test platform authentication
   */
  static async testPlatformAuth(platformId: string): Promise<{
    success: boolean
    message: string
    authStatus: 'valid' | 'invalid' | 'expired' | 'missing'
  }> {
    try {
      const response = await ApiService.post<{
        success: boolean
        message: string
        auth_status: 'valid' | 'invalid' | 'expired' | 'missing'
      }>(`${this.baseEndpoint}/platforms/${platformId}/test-auth/`, {})
      
      return {
        success: response.success,
        message: response.message,
        authStatus: response.auth_status
      }
    } catch (error) {
      console.error('Failed to test platform auth:', error)
      throw error
    }
  }

  /**
   * Delete a meeting session and its associated data
   */
  static async deleteMeetingSession(sessionId: string): Promise<{
    success: boolean
    message: string
  }> {
    try {
      const response = await ApiService.delete<{
        success: boolean
        message: string
      }>(`${this.baseEndpoint}/sessions/${sessionId}/delete/`)
      
      return response
    } catch (error) {
      console.error('Failed to delete meeting session:', error)
      throw error
    }
  }

  /**
   * Get real-time meeting status updates via WebSocket
   */
  static subscribeToMeetingUpdates(
    sessionId: string,
    onUpdate: (update: Partial<MeetingSession>) => void,
    onError: (error: Error) => void
  ): () => void {
    // This would typically use WebSocket connection
    // For now, we'll use polling as a fallback
    let isActive = true
    
    const pollUpdates = async () => {
      if (!isActive) return
      
      try {
        const session = await this.getMeetingSession(sessionId)
        onUpdate(session)
      } catch (error) {
        onError(error as Error)
      }
      
      if (isActive) {
        setTimeout(pollUpdates, 5000) // Poll every 5 seconds
      }
    }
    
    pollUpdates()
    
    // Return cleanup function
    return () => {
      isActive = false
    }
  }

  /**
   * Get Recall bot information
   */
  static async getRecallBot(botId: string): Promise<RecallBot> {
    try {
      const response = await ApiService.get<RecallBot>(
        `${this.baseEndpoint}/recall-bot/${botId}/`
      )
      return response
    } catch (error) {
      console.error('Failed to fetch recall bot:', error)
      throw error
    }
  }

  /**
   * Create a new Recall bot for a meeting
   */
  static async createRecallBot(
    meetingUrl: string,
    metadata: Partial<RecallBotMetadata>
  ): Promise<RecallBotResponse> {
    try {
      const response = await ApiService.post<RecallBotResponse>(
        `${this.baseEndpoint}/recall-bot/create/`,
        {
          meeting_url: meetingUrl,
          bot_name: metadata.bot_name || 'Meeting Recorder',
          recording_mode: metadata.recording_mode || 'speaker_view',
          transcription_options: metadata.transcription_options || {
            provider: 'recall',
            language: 'en'
          },
          automatic_leave: metadata.automatic_leave || {
            waiting_room_timeout: 1200,
            noone_joined_timeout: 1200,
            everyone_left_timeout: 30
          }
        }
      )
      return response
    } catch (error) {
      console.error('Failed to create recall bot:', error)
      throw error
    }
  }

  /**
   * Stop a Recall bot
   */
  static async stopRecallBot(botId: string): Promise<{
    success: boolean
    message: string
  }> {
    try {
      const response = await ApiService.post<{
        success: boolean
        message: string
      }>(`${this.baseEndpoint}/recall-bot/${botId}/stop/`, {})
      
      return response
    } catch (error) {
      console.error('Failed to stop recall bot:', error)
      throw error
    }
  }

  /**
   * Get real-time Recall bot status updates
   */
  static subscribeToRecallBotUpdates(
    botId: string,
    onUpdate: (bot: RecallBot) => void,
    onError: (error: Error) => void
  ): () => void {
    let isActive = true
    
    const pollBotStatus = async () => {
      if (!isActive) return
      
      try {
        const bot = await this.getRecallBot(botId)
        onUpdate(bot)
      } catch (error) {
        onError(error as Error)
      }
      
      if (isActive) {
        setTimeout(pollBotStatus, 3000) // Poll every 3 seconds
      }
    }
    
    pollBotStatus()
    
    return () => {
      isActive = false
    }
  }

  /**
   * Upload meeting transcript to S3
   */
  static async uploadTranscriptToS3(
    sessionId: string,
    transcriptContent: string,
    fileName: string = 'transcript.txt',
    onProgress?: (progress: number) => void
  ): Promise<{
    success: boolean
    transcriptUrl?: string
    fileSize?: number
    s3Key?: string
    message: string
  }> {
    try {
      // Create a text file from the transcript content
      const transcriptBlob = new Blob([transcriptContent], { type: 'text/plain' })
      const transcriptFile = new File([transcriptBlob], fileName, {
        type: 'text/plain'
      })

      // Use the general upload_to_s3 endpoint
      return await this.uploadFileToS3(transcriptFile, 'meeting-agent', `meetings/${sessionId}/`, '', onProgress)
    } catch (error) {
      console.error('Failed to upload transcript:', error)
      throw error
    }
  }

  /**
   * Upload any file to S3 using the general upload endpoint
   */
  static async uploadFileToS3(
    file: File,
    deviceName: string,
    filePath: string = '',
    fileParent: string = '',
    onProgress?: (progress: number) => void
  ): Promise<{
    success: boolean
    fileUrl?: string
    fileSize?: number
    s3Key?: string
    message: string
  }> {
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('device_name', deviceName)
      formData.append('file_path', filePath)
      formData.append('file_parent', fileParent)

      // Get username from localStorage
      const username = localStorage.getItem('username')
      if (!username) {
        throw new Error('Username not found')
      }

      // Create XMLHttpRequest for progress tracking
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest()

        // Track upload progress
        if (onProgress) {
          xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
              const progress = (event.loaded / event.total) * 100
              onProgress(progress)
            }
          })
        }

        xhr.addEventListener('load', () => {
          try {
            const response = JSON.parse(xhr.responseText)
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve({
                success: true,
                fileUrl: response.file_url,
                fileSize: response.file_info?.file_size,
                s3Key: response.file_info?.s3_key,
                message: 'Upload successful'
              })
            } else {
              reject(new Error(response.error || 'Upload failed'))
            }
          } catch (error) {
            reject(new Error('Invalid response from server'))
          }
        })

        xhr.addEventListener('error', () => {
          reject(new Error('Network error during upload'))
        })

        xhr.addEventListener('abort', () => {
          reject(new Error('Upload was cancelled'))
        })

        // Get auth token
        const token = localStorage.getItem('token')
        if (!token) {
          reject(new Error('Authentication required'))
          return
        }

        // Configure request
        xhr.open('POST', `${CONFIG.url}/files/upload_to_s3/${username}/`)
        xhr.setRequestHeader('Authorization', `Bearer ${token}`)
        
        // Send request
        xhr.send(formData)
      })
    } catch (error) {
      console.error('Failed to upload file to S3:', error)
      throw error
    }
  }

  /**
   * Upload meeting assets (video and transcript) to S3
   */
  static async uploadMeetingAssetsToS3(
    sessionId: string,
    videoFile?: File,
    transcriptContent?: string,
    onProgress?: (progress: { videoProgress: number; transcriptProgress: number; isUploading: boolean }) => void
  ): Promise<{
    success: boolean
    videoUrl?: string
    transcriptUrl?: string
    message: string
    errors?: string[]
  }> {
    try {
      const results: { videoUrl?: string; transcriptUrl?: string; errors: string[] } = {
        errors: []
      }

      const uploadPromises: Promise<any>[] = []

      // Upload video if provided
      if (videoFile) {
        uploadPromises.push(
          this.uploadRecordingToS3(sessionId, videoFile, (progress) => {
            onProgress?.({ videoProgress: progress, transcriptProgress: 0, isUploading: true })
          }).then(result => {
            if (result.success) {
              results.videoUrl = result.recordingUrl
            } else {
              results.errors.push(`Video upload failed: ${result.message}`)
            }
          }).catch(error => {
            results.errors.push(`Video upload error: ${error.message}`)
          })
        )
      }

      // Upload transcript if provided
      if (transcriptContent) {
        uploadPromises.push(
          this.uploadTranscriptToS3(sessionId, transcriptContent, `${sessionId}_transcript.txt`, (progress) => {
            onProgress?.({ videoProgress: videoFile ? 100 : 0, transcriptProgress: progress, isUploading: true })
          }).then(result => {
            if (result.success) {
              results.transcriptUrl = result.recordingUrl
            } else {
              results.errors.push(`Transcript upload failed: ${result.message}`)
            }
          }).catch(error => {
            results.errors.push(`Transcript upload error: ${error.message}`)
          })
        )
      }

      // Wait for all uploads to complete
      await Promise.allSettled(uploadPromises)

      onProgress?.({ videoProgress: 100, transcriptProgress: 100, isUploading: false })

      const hasAnySuccess = results.videoUrl || results.transcriptUrl
      const successMessage = hasAnySuccess ? 
        `Successfully uploaded ${results.videoUrl ? 'video' : ''}${results.videoUrl && results.transcriptUrl ? ' and ' : ''}${results.transcriptUrl ? 'transcript' : ''}` :
        'Upload failed'

      return {
        success: hasAnySuccess,
        videoUrl: results.videoUrl,
        transcriptUrl: results.transcriptUrl,
        message: successMessage,
        errors: results.errors.length > 0 ? results.errors : undefined
      }
    } catch (error) {
      console.error('Failed to upload meeting assets:', error)
      onProgress?.({ videoProgress: 0, transcriptProgress: 0, isUploading: false })
      throw error
    }
  }

  /**
   * Manually trigger S3 upload for a completed meeting
   */
  static async triggerS3Upload(sessionId: string): Promise<{
    success: boolean
    message: string
    videoUrl?: string
    transcriptUrl?: string
  }> {
    try {
      const response = await ApiService.post<{
        success: boolean
        message: string
        video_url?: string
        transcript_url?: string
      }>(`${this.baseEndpoint}/sessions/${sessionId}/trigger-s3-upload/`, {})
      
      return {
        success: response.success,
        message: response.message,
        videoUrl: response.video_url,
        transcriptUrl: response.transcript_url
      }
    } catch (error) {
      console.error('Failed to trigger S3 upload:', error)
      throw error
    }
  }

  /**
   * Check and upload all sessions that need S3 upload
   */
  static async checkAndUploadSessions(): Promise<{
    success: boolean
    message: string
    uploaded_count: number
    failed_count: number
    results: Array<{
      session_id: string
      success: boolean
      message: string
      error?: string
    }>
  }> {
    try {
      const response = await ApiService.post<{
        success: boolean
        message: string
        uploaded_count: number
        failed_count: number
        results: Array<{
          session_id: string
          success: boolean
          message: string
          error?: string
        }>
      }>(`${this.baseEndpoint}/check-and-upload-sessions/`, {})
      
      return response
    } catch (error) {
      console.error('Error checking and uploading sessions:', error)
      throw new Error('Failed to check and upload sessions')
    }
  }

  /**
   * Update session URLs from Recall AI bot data
   */
  static async updateSessionUrls(sessionId: string): Promise<{
    success: boolean
    message: string
    video_url?: string
    transcript_url?: string
    audio_url?: string
  }> {
    try {
      const response = await ApiService.post<{
        success: boolean
        message: string
        video_url?: string
        transcript_url?: string
        audio_url?: string
      }>(`${this.baseEndpoint}/sessions/${sessionId}/update-urls/`, {})
      
      return response
    } catch (error) {
      console.error('Error updating session URLs:', error)
      throw new Error('Failed to update session URLs')
    }
  }

  /**
   * Parse meeting URL to extract platform and meeting ID
   */
  static parseMeetingUrl(url: string): {
    platform: string | null
    meetingId: string | null
    isValid: boolean
  } {
    try {
      const urlObj = new URL(url)
      const hostname = urlObj.hostname.toLowerCase()
      
      // Zoom URLs
      if (hostname.includes('zoom.us')) {
        const pathMatch = urlObj.pathname.match(/\/j\/(\d+)/)
        return {
          platform: 'zoom',
          meetingId: pathMatch ? pathMatch[1] : null,
          isValid: !!pathMatch
        }
      }
      
      // Microsoft Teams URLs
      if (hostname.includes('teams.microsoft.com') || hostname.includes('teams.live.com')) {
        return {
          platform: 'teams',
          meetingId: urlObj.searchParams.get('meetingId') || urlObj.pathname,
          isValid: true
        }
      }
      
      // Google Meet URLs
      if (hostname.includes('meet.google.com')) {
        const pathMatch = urlObj.pathname.match(/\/([a-z-]+)/)
        return {
          platform: 'meet',
          meetingId: pathMatch ? pathMatch[1] : null,
          isValid: !!pathMatch
        }
      }
      
      // Webex URLs
      if (hostname.includes('webex.com')) {
        return {
          platform: 'webex',
          meetingId: urlObj.pathname.split('/').pop() || null,
          isValid: true
        }
      }
      
      return {
        platform: null,
        meetingId: null,
        isValid: false
      }
    } catch (error) {
      return {
        platform: null,
        meetingId: null,
        isValid: false
      }
    }
  }
}
