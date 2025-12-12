import { ApiService } from '../../../../backend/api/apiService'
import { MeetingSession } from '../../../types/meeting-types'

export interface UploadProgress {
  videoProgress: number
  transcriptProgress: number
  isUploading: boolean
  error: string | null
}

export interface UploadResult {
  success: boolean
  videoUrl?: string
  transcriptUrl?: string
  message: string
  error?: string
}

/**
 * Downloads and uploads meeting video to S3
 */
export async function uploadMeetingVideoToS3(
  session: MeetingSession,
  onProgress?: (progress: number) => void
): Promise<{ success: boolean; videoUrl?: string; error?: string }> {
  try {
    // Check if we have a video URL from Recall AI or recording
    const videoUrl = session.recallBot?.videoUrl || session.recordingUrl
    
    if (!videoUrl) {
      return {
        success: false,
        error: 'No video recording available for this session'
      }
    }

    // Try to download the video file
    const response = await fetch(videoUrl)
    if (!response.ok) {
      throw new Error(`Failed to download video: ${response.statusText}`)
    }

    const videoBlob = await response.blob()
    const videoFile = new File([videoBlob], `${session.id}_recording.mp4`, {
      type: 'video/mp4'
    })

    // Upload to S3 using the general upload endpoint
    const uploadResult = await ApiService.MeetingAgent.uploadFileToS3(
      videoFile,
      'meeting-agent',
      `meetings/${session.id}/`,
      '',
      onProgress
    )

    return {
      success: uploadResult.success,
      videoUrl: uploadResult.fileUrl,
      error: uploadResult.success ? undefined : uploadResult.message
    }
  } catch (error) {
    console.error('Failed to upload meeting video:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload video'
    }
  }
}

/**
 * Downloads and uploads meeting transcript to S3
 */
export async function uploadMeetingTranscriptToS3(
  session: MeetingSession,
  onProgress?: (progress: number) => void
): Promise<{ success: boolean; transcriptUrl?: string; error?: string }> {
  try {
    let transcriptContent: string
    let fileName: string

    // Check if we have transcript from Recall AI
    if (session.recallBot?.transcriptUrl) {
      // Download transcript from Recall AI
      const response = await fetch(session.recallBot.transcriptUrl)
      if (!response.ok) {
        throw new Error(`Failed to download transcript: ${response.statusText}`)
      }
      transcriptContent = await response.text()
      fileName = `${session.id}_transcript.json`
    } else if (session.transcriptionText) {
      // Use existing transcription text
      transcriptContent = session.transcriptionText
      fileName = `${session.id}_transcript.txt`
    } else {
      // Try to fetch transcript from our API
      try {
        const transcriptData = await ApiService.MeetingAgent.getTranscription(session.id)
        transcriptContent = transcriptData.fullText || JSON.stringify(transcriptData.segments, null, 2)
        fileName = `${session.id}_transcript.txt`
      } catch (error) {
        return {
          success: false,
          error: 'No transcript available for this session'
        }
      }
    }

    // Create a text file from the transcript content
    const transcriptBlob = new Blob([transcriptContent], { type: 'text/plain' })
    const transcriptFile = new File([transcriptBlob], fileName, {
      type: 'text/plain'
    })

    // Upload to S3 using the general upload endpoint
    const uploadResult = await ApiService.MeetingAgent.uploadFileToS3(
      transcriptFile,
      'meeting-agent',
      `meetings/${session.id}/`,
      '',
      onProgress
    )

    return {
      success: uploadResult.success,
      transcriptUrl: uploadResult.fileUrl,
      error: uploadResult.success ? undefined : uploadResult.message
    }
  } catch (error) {
    console.error('Failed to upload meeting transcript:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload transcript'
    }
  }
}

/**
 * Uploads both video and transcript to S3 for a meeting session
 */
export async function uploadMeetingAssetsToS3(
  session: MeetingSession,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  const progress: UploadProgress = {
    videoProgress: 0,
    transcriptProgress: 0,
    isUploading: true,
    error: null
  }

  try {
    onProgress?.(progress)

    // Upload video and transcript in parallel
    const [videoResult, transcriptResult] = await Promise.allSettled([
      uploadMeetingVideoToS3(session, (videoProgress) => {
        progress.videoProgress = videoProgress
        onProgress?.({ ...progress })
      }),
      uploadMeetingTranscriptToS3(session, (transcriptProgress) => {
        progress.transcriptProgress = transcriptProgress
        onProgress?.({ ...progress })
      })
    ])

    const videoUpload = videoResult.status === 'fulfilled' ? videoResult.value : { success: false, error: 'Video upload failed' }
    const transcriptUpload = transcriptResult.status === 'fulfilled' ? transcriptResult.value : { success: false, error: 'Transcript upload failed' }

    progress.isUploading = false

    // Determine overall success
    const hasVideo = videoUpload.success
    const hasTranscript = transcriptUpload.success
    const hasAnySuccess = hasVideo || hasTranscript

    if (hasAnySuccess) {
      const messages = []
      if (hasVideo) messages.push('Video uploaded successfully')
      if (hasTranscript) messages.push('Transcript uploaded successfully')
      if (!hasVideo) messages.push('Video upload failed')
      if (!hasTranscript) messages.push('Transcript upload failed')

      onProgress?.({ ...progress })

      return {
        success: true,
        videoUrl: videoUpload.videoUrl,
        transcriptUrl: transcriptUpload.transcriptUrl,
        message: messages.join(', ')
      }
    } else {
      const error = `Upload failed: ${videoUpload.error || 'Unknown error'}, ${transcriptUpload.error || 'Unknown error'}`
      progress.error = error
      onProgress?.({ ...progress })

      return {
        success: false,
        error,
        message: 'Failed to upload meeting assets'
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Upload failed'
    progress.error = errorMessage
    progress.isUploading = false
    onProgress?.(progress)

    return {
      success: false,
      error: errorMessage,
      message: 'Failed to upload meeting assets'
    }
  }
}

/**
 * Checks if a meeting session has ended and bot has left
 */
export function hasMeetingEnded(session: MeetingSession): boolean {
  // Check if the session status indicates it's completed
  const isCompleted = ['completed', 'failed'].includes(session.status)
  
  // Check if the Recall bot has left (if using Recall AI)
  const botHasLeft = session.recallBot ? 
    ['left', 'ended', 'stopped'].includes(session.recallBot.status) : 
    true // If no Recall bot, assume it's ended if status is completed
  
  // For testing, let's be more permissive - allow uploads for any session with assets
  const result = isCompleted && botHasLeft
  
  return result
}

/**
 * Checks if a meeting session has assets that can be uploaded
 */
export function hasUploadableAssets(session: MeetingSession): boolean {
  const hasVideo = !!(session.recallBot?.videoUrl || session.recordingUrl)
  const hasTranscript = !!(session.recallBot?.transcriptUrl || session.transcriptionText)
  
  const result = hasVideo || hasTranscript
  
  return result
}
