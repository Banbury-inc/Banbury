/**
 * Recall AI Desktop SDK Service
 * 
 * Direct frontend integration with Recall AI Desktop SDK API
 * Handles upload tokens, SDK uploads, and transcript creation
 */

import { CONFIG } from '../../config/config'

interface RecallSDKConfig {
  apiKey: string
  baseUrl?: string
}

interface UploadTokenMetadata {
  user_id?: string
  username?: string
  platform?: string
  meeting_title?: string
  transcription_enabled?: boolean
  [key: string]: unknown
}

interface UploadTokenResponse {
  success: boolean
  upload_token?: string
  token_id?: string
  expires_at?: string
  error?: string
  message?: string
}

interface SDKUploadResponse {
  success: boolean
  upload_data?: {
    id: string
    recording_id?: string
    status?: string
    video_url?: string
    audio_url?: string
    [key: string]: unknown
  }
  error?: string
  message?: string
}

interface TranscriptResponse {
  success: boolean
  transcript_id?: string
  transcript_data?: {
    id: string
    status?: string
    [key: string]: unknown
  }
  error?: string
  message?: string
}

class RecallSDKService {
  private apiKey: string
  private baseUrl: string

  constructor(config?: RecallSDKConfig) {
    // Get API key from config or environment
    this.apiKey = config?.apiKey || this.getApiKeyFromEnv()
    this.baseUrl = config?.baseUrl || this.getBaseUrlFromEnv()
    
    if (!this.apiKey) {
      console.warn('[Recall SDK] API key not found. Set NEXT_PUBLIC_RECALL_API_KEY environment variable.')
    }
  }

  private getApiKeyFromEnv(): string {
    // Try config first
    if (typeof CONFIG !== 'undefined' && CONFIG.recallApiKey) {
      return CONFIG.recallApiKey
    }
    // Fallback to environment variables
    if (typeof window !== 'undefined') {
      const env = (window as any).env
      if (env?.NEXT_PUBLIC_RECALL_API_KEY) {
        return env.NEXT_PUBLIC_RECALL_API_KEY
      }
    }
    if (typeof process !== 'undefined' && (process as any).env) {
      return (process as any).env.NEXT_PUBLIC_RECALL_API_KEY || ''
    }
    return ''
  }

  private getBaseUrlFromEnv(): string {
    // Try config first
    if (typeof CONFIG !== 'undefined' && CONFIG.recallApiUrl) {
      return CONFIG.recallApiUrl
    }
    // Fallback to environment variables
    if (typeof window !== 'undefined') {
      const env = (window as any).env
      if (env?.NEXT_PUBLIC_RECALL_API_URL) {
        return env.NEXT_PUBLIC_RECALL_API_URL
      }
    }
    if (typeof process !== 'undefined' && (process as any).env) {
      return (process as any).env.NEXT_PUBLIC_RECALL_API_URL || 'https://us-west-2.recall.ai/api/v1'
    }
    return 'https://us-west-2.recall.ai/api/v1'
  }

  private getHeaders(): HeadersInit {
    return {
      'Authorization': `Token ${this.apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  }

  /**
   * Create an upload token for desktop recording
   */
  async createUploadToken(metadata?: UploadTokenMetadata): Promise<UploadTokenResponse> {
    if (!this.apiKey) {
      return {
        success: false,
        error: 'API key not configured',
        message: 'Recall AI API key is required. Set NEXT_PUBLIC_RECALL_API_KEY environment variable.'
      }
    }

    try {
      const payload: Record<string, unknown> = {}
      if (metadata) {
        payload.metadata = metadata
      }

      const response = await fetch(`${this.baseUrl}/desktop/upload-tokens/`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload)
      })

      if (response.status >= 200 && response.status < 300) {
        const tokenData = await response.json()
        return {
          success: true,
          upload_token: tokenData.token,
          token_id: tokenData.id,
          expires_at: tokenData.expires_at,
          message: 'Upload token created successfully'
        }
      } else {
        const errorText = await response.text()
        let errorDetails = errorText
        try {
          const errorJson = JSON.parse(errorText)
          errorDetails = JSON.stringify(errorJson, null, 2)
        } catch {
          // Use errorText as-is
        }

        return {
          success: false,
          error: `API error: ${response.status}`,
          message: `Failed to create upload token: ${errorDetails}`
        }
      }
    } catch (error) {
      console.error('[Recall SDK] Failed to create upload token:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create upload token',
        message: 'Failed to create upload token due to unexpected error'
      }
    }
  }

  /**
   * Get information about an SDK upload
   */
  async getSDKUpload(uploadId: string): Promise<SDKUploadResponse> {
    if (!this.apiKey) {
      return {
        success: false,
        error: 'API key not configured',
        message: 'Recall AI API key is required'
      }
    }

    try {
      const response = await fetch(`${this.baseUrl}/desktop/sdk-uploads/${uploadId}/`, {
        method: 'GET',
        headers: this.getHeaders()
      })

      if (response.status === 200) {
        const uploadData = await response.json()
        return {
          success: true,
          upload_data: uploadData
        }
      } else {
        const errorText = await response.text()
        return {
          success: false,
          error: `API error: ${response.status}`,
          message: `Failed to fetch SDK upload information: ${errorText}`
        }
      }
    } catch (error) {
      console.error(`[Recall SDK] Failed to fetch SDK upload ${uploadId}:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch SDK upload',
        message: 'Failed to fetch SDK upload information'
      }
    }
  }

  /**
   * Create an async transcript for an SDK upload
   */
  async createAsyncTranscript(
    uploadId: string,
    language: string = 'en'
  ): Promise<TranscriptResponse> {
    if (!this.apiKey) {
      return {
        success: false,
        error: 'API key not configured',
        message: 'Recall AI API key is required'
      }
    }

    try {
      const payload = {
        provider: {
          recallai_async: {
            language_code: language
          }
        }
      }

      const response = await fetch(
        `${this.baseUrl}/desktop/sdk-uploads/${uploadId}/create-transcript/`,
        {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(payload)
        }
      )

      if (response.status >= 200 && response.status < 300) {
        const transcriptData = await response.json()
        return {
          success: true,
          transcript_id: transcriptData.id,
          transcript_data: transcriptData,
          message: 'Async transcript created successfully'
        }
      } else {
        const errorText = await response.text()
        return {
          success: false,
          error: `Transcript API error: ${response.status}`,
          message: `Failed to create transcript: ${errorText}`
        }
      }
    } catch (error) {
      console.error(`[Recall SDK] Failed to create async transcript for upload ${uploadId}:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create transcript',
        message: 'Failed to create async transcript due to unexpected error'
      }
    }
  }
}

// Export singleton instance
export const recallSDKService = new RecallSDKService()

// Export class for custom instances
export { RecallSDKService }
export type { UploadTokenResponse, SDKUploadResponse, TranscriptResponse, UploadTokenMetadata }
