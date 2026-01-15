import { ArrowLeft, Download, FileText, Users, Clock, Video, VideoOff, Mic, MicOff, Play, Upload, Pause, Volume2, VolumeX, Loader2, Radio, Wifi, WifiOff, Sparkles, RefreshCw, Save } from "lucide-react"
import { useState, useCallback, useEffect, useRef, useMemo } from "react"
import { Button } from "../../ui/button"
import { useToast } from "../../ui/use-toast"
import { Typography } from "../../ui/typography"
import { Badge } from "../../ui/badge"
import { Separator } from "../../ui/separator"
import { Slider } from "../../ui/slider"
import { MeetingSession, TranscriptionSegment, MeetingSummary } from "../../../types/meeting-types"
import { ApiService } from "../../../../backend/api/apiService"
import { handleGenerateSummary } from "./handlers/summaryHandlers"
import { handleGenerateAnthropicSummaryWithSave } from "./handlers/anthropicSummaryHandlers"
import { handleRegenerateSummary } from "./handlers/regenerateSummaryHandlers"
import { handleSaveEditedSummary } from "./handlers/saveEditedSummaryHandlers"
import { VideoPlayerDialog } from "../../../pages/MeetingAgent/components/VideoPlayerDialog"
import { RecordingUploadDialog } from "../../../pages/MeetingAgent/components/RecordingUploadDialog"
import { Card } from "../../ui/card"
import { useLiveTranscription } from "../../../hooks/useLiveTranscription"
import { MeetingSummaryEditor } from "./MeetingSummaryEditor"
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover"

interface MeetingViewerProps {
  meeting: MeetingSession
  onBack?: () => void
  onMeetingUpdated?: (meeting: MeetingSession) => void
}

export function MeetingViewer({ meeting, onBack, onMeetingUpdated }: MeetingViewerProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isVideoPlayerOpen, setIsVideoPlayerOpen] = useState(false)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [currentMeeting, setCurrentMeeting] = useState<MeetingSession>(meeting)
  
  // Video player state
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  const [videoCurrentTime, setVideoCurrentTime] = useState(0)
  const [videoDuration, setVideoDuration] = useState(0)
  const [videoVolume, setVideoVolume] = useState(1)
  const [isVideoMuted, setIsVideoMuted] = useState(false)
  const [videoStreamUrl, setVideoStreamUrl] = useState<string | null>(null)
  const [isVideoLoading, setIsVideoLoading] = useState(false)
  const [videoError, setVideoError] = useState<string | null>(null)
  
  // Transcript state
  const [transcriptionSegments, setTranscriptionSegments] = useState<TranscriptionSegment[]>([])
  const [transcriptionFullText, setTranscriptionFullText] = useState<string>('')
  const [isTranscriptionLoading, setIsTranscriptionLoading] = useState(false)
  const transcriptScrollRef = useRef<HTMLDivElement>(null)
  
  // Summary state
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false)
  const [summaryHtml, setSummaryHtml] = useState<string>('')
  const [isSavingSummary, setIsSavingSummary] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [actionItemCheckedStates, setActionItemCheckedStates] = useState<Map<string, boolean>>(new Map())
  const summaryEditorRef = useRef<any>(null)
  
  // Update currentMeeting when meeting prop changes
  useEffect(() => {
    setCurrentMeeting(meeting)
  }, [meeting])
  
  // Update summary HTML when meeting summary changes
  useEffect(() => {
    const meetingSummary = currentMeeting.summary?.summary
    if (meetingSummary && meetingSummary.trim() !== '') {
      // Always update to ensure editor gets the latest content
      setSummaryHtml(meetingSummary)
      // Reset unsaved changes flag when summary is updated externally
      if (!isGeneratingSummary && !isSavingSummary) {
        setHasUnsavedChanges(false)
      }
    } else if (!isGeneratingSummary) {
      // Clear summary if it was removed (but only if we're not currently generating)
      setSummaryHtml('')
      setHasUnsavedChanges(false)
    }
  }, [currentMeeting.summary?.summary, isGeneratingSummary, isSavingSummary])

  // Initialize action item checked states from meeting summary
  useEffect(() => {
    if (currentMeeting.summary?.actionItems) {
      const checkedStates = new Map<string, boolean>()
      currentMeeting.summary.actionItems.forEach(item => {
        checkedStates.set(item.id, item.status === 'completed')
      })
      setActionItemCheckedStates(checkedStates)
    }
  }, [currentMeeting.summary?.actionItems])
  
  // Live transcription - only enabled when meeting is recording
  const isLiveRecording = currentMeeting.status === 'recording' || currentMeeting.status === 'active'
  
  // Log live transcription state for debugging
  useEffect(() => {
    if (isLiveRecording) {
      console.log('[MeetingViewer] Live transcription enabled for session:', currentMeeting.id, {
        status: currentMeeting.status,
        meetingUrl: currentMeeting.meetingUrl,
        isDesktopRecording: currentMeeting.meetingUrl?.startsWith('desktop://')
      })
    }
  }, [isLiveRecording, currentMeeting.id, currentMeeting.status, currentMeeting.meetingUrl])
  
  const {
    segments: liveSegments,
    isConnected: isLiveConnected,
    isConnecting: isLiveConnecting,
    isPolling: isLivePolling,
    error: liveError,
    reconnect: reconnectLive
  } = useLiveTranscription({
    sessionId: currentMeeting.id,
    enabled: isLiveRecording,
    onSegment: (segment) => {
      console.log('[MeetingViewer] Received live segment:', segment.id, segment.text?.substring(0, 50))
      // Auto-scroll to latest segment
      if (transcriptScrollRef.current) {
        setTimeout(() => {
          transcriptScrollRef.current?.scrollTo({
            top: transcriptScrollRef.current.scrollHeight,
            behavior: 'smooth'
          })
        }, 100)
      }
    },
    onConnectionChange: (connected) => {
      console.log('[MeetingViewer] Live transcription connection changed:', connected)
    },
    onError: (error) => {
      console.error('[MeetingViewer] Live transcription error:', error)
    }
  })
  
  // Combine stored segments with live segments
  const allSegments = isLiveRecording && liveSegments.length > 0 
    ? liveSegments 
    : transcriptionSegments

  // Extract unique participants from transcript segments
  const extractedParticipants = useMemo(() => {
    const participantsMap = new Map<string, { id: string; name: string }>()
    
    allSegments.forEach((segment) => {
      if (segment.speakerId && segment.speakerName) {
        // Use speakerId as the key to ensure uniqueness
        if (!participantsMap.has(segment.speakerId)) {
          participantsMap.set(segment.speakerId, {
            id: segment.speakerId,
            name: segment.speakerName
          })
        }
      }
    })
    
    return Array.from(participantsMap.values())
  }, [allSegments])

  // Normalize participants to a consistent format for display
  const displayParticipantNames = useMemo((): Array<{ id: string; name: string }> => {
    if (currentMeeting.participants.length > 0) {
      // Meeting participants are MeetingParticipant[]
      return currentMeeting.participants.map((participant, index) => ({
        id: participant.id || String(index),
        name: participant.name || participant.email || 'Unknown'
      }))
    } else {
      // Extracted participants are { id: string; name: string }[]
      return extractedParticipants.map((participant, index) => ({
        id: participant.id || String(index),
        name: participant.name || 'Unknown'
      }))
    }
  }, [currentMeeting.participants, extractedParticipants])

  const getDuration = (): number => {
    // If duration is provided in seconds, return it
    if (currentMeeting.duration) {
      return currentMeeting.duration
    }
    
    // Calculate duration from startTime and endTime
    if (currentMeeting.endTime && currentMeeting.startTime) {
      const duration = new Date(currentMeeting.endTime).getTime() - new Date(currentMeeting.startTime).getTime()
      return Math.round(duration / 1000) // Return in seconds
    }
    
    // If startTime is null, use createdAt from the meeting object as start time
    const meetingWithCreatedAt = currentMeeting as MeetingSession & { createdAt?: string | Date }
    if (currentMeeting.endTime && meetingWithCreatedAt.createdAt) {
      const startTime = new Date(meetingWithCreatedAt.createdAt)
      const endTime = new Date(currentMeeting.endTime)
      const duration = endTime.getTime() - startTime.getTime()
      return Math.round(duration / 1000) // Return in seconds
    }
    
    // For active/recording meetings, calculate from startTime or createdAt
    if (currentMeeting.status === 'active' || currentMeeting.status === 'recording') {
      const startTime = currentMeeting.startTime 
        ? new Date(currentMeeting.startTime)
        : (meetingWithCreatedAt.createdAt ? new Date(meetingWithCreatedAt.createdAt) : null)
      
      if (startTime) {
        const duration = Date.now() - startTime.getTime()
        return Math.round(duration / 1000) // Return in seconds
      }
    }
    
    return 0
  }

  const getStatusVariant = () => {
    switch (currentMeeting.status) {
      case 'active':
        return 'default'
      case 'recording':
        return 'destructive'
      case 'completed':
        return 'secondary'
      case 'failed':
        return 'destructive'
      case 'processing':
        return 'outline'
      default:
        return 'outline'
    }
  }

  const formatDuration = (seconds: number): string => {
    if (seconds < 0) return '0s'
    
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    
    // Always show hours, minutes, and seconds when there are hours
    if (hours > 0) {
      return `${hours}h ${mins}m ${secs}s`
    }
    // Show minutes and seconds when there are minutes
    if (mins > 0) {
      return `${mins}m ${secs}s`
    }
    // Show only seconds when less than a minute
    return `${secs}s`
  }

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return 'Not available'
    const d = date instanceof Date ? date : new Date(date)
    if (isNaN(d.getTime())) return 'Invalid date'
    
    // Use Intl.DateTimeFormat to explicitly use user's locale and timezone
    return new Intl.DateTimeFormat(navigator.language || 'en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    }).format(d)
  }

  const getMeetingDate = (meeting: MeetingSession & { createdAt?: string | Date }): Date | string | null | undefined => {
    return meeting.startTime || meeting.createdAt || null
  }

  const formatDateForFilename = (date: Date | string | null | undefined): string => {
    if (!date) return 'meeting'
    const d = date instanceof Date ? date : new Date(date)
    if (isNaN(d.getTime())) return 'meeting'
    
    // Format as YYYY-MM-DD_HH-MM for filename compatibility
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}_${hours}-${minutes}`
  }

  const handleDownloadRecording = useCallback(async () => {
    if (!currentMeeting.recordingUrl) return
    
    try {
      setIsLoading(true)
      const result = await ApiService.MeetingAgent.downloadRecording(currentMeeting.id)
      
      if (result.success && result.downloadUrl) {
        const link = document.createElement('a')
        link.href = result.downloadUrl
        const meetingTitle = currentMeeting.title || formatDateForFilename(getMeetingDate(currentMeeting as MeetingSession & { createdAt?: string | Date }))
        link.download = `${meetingTitle}_recording.mp4`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        toast({
          title: 'Success',
          description: 'Recording download started'
        })
      } else {
        throw new Error(result.message)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to download recording'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }, [currentMeeting.id, currentMeeting.title, toast])

  const handleDownloadTranscription = useCallback(async () => {
    try {
      setIsLoading(true)
      const transcriptionData = await ApiService.MeetingAgent.getTranscription(currentMeeting.id)
      
      const meetingTitle = currentMeeting.title || formatDate(getMeetingDate(currentMeeting as MeetingSession & { createdAt?: string | Date }))
      const content = `Meeting: ${meetingTitle}
Date: ${formatDate(getMeetingDate(currentMeeting as MeetingSession & { createdAt?: string | Date }))}
Platform: ${currentMeeting.platform?.name || 'Desktop Recording'}
Duration: ${formatDuration(getDuration())}

FULL TRANSCRIPTION:
${transcriptionData.fullText || ''}

SEGMENTED TRANSCRIPTION:
${transcriptionData.segments?.map((segment: any) => 
  `[${Math.floor(segment.startTime / 60)}:${String(Math.floor(segment.startTime % 60)).padStart(2, '0')}] ${segment.speakerName}: ${segment.text}`
).join('\n') || 'No segments available'}
`
      
      const blob = new Blob([content], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `${meetingTitle || 'meeting'}_transcription.txt`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      URL.revokeObjectURL(url)
      
      toast({
        title: 'Success',
        description: 'Transcription downloaded'
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to download transcription'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }, [currentMeeting.id, currentMeeting.title, currentMeeting.startTime, currentMeeting.platform?.name, getDuration, toast])


  // Format time helper
  const formatTime = (seconds: number): string => {
    if (isNaN(seconds)) return '00:00'
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  // Format timestamp for transcript
  const formatTimestamp = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Video player handlers
  const toggleVideoPlayPause = useCallback(() => {
    if (!videoRef.current) return
    if (isVideoPlaying) {
      videoRef.current.pause()
    } else {
      videoRef.current.play()
    }
  }, [isVideoPlaying])

  const handleVideoSeek = useCallback((value: number[]) => {
    if (!videoRef.current) return
    const newTime = value[0]
    videoRef.current.currentTime = newTime
    setVideoCurrentTime(newTime)
  }, [])

  const handleVideoVolumeChange = useCallback((value: number[]) => {
    if (!videoRef.current) return
    const newVolume = value[0]
    videoRef.current.volume = newVolume
    setVideoVolume(newVolume)
    setIsVideoMuted(newVolume === 0)
  }, [])

  const toggleVideoMute = useCallback(() => {
    if (!videoRef.current) return
    const newMuted = !isVideoMuted
    videoRef.current.muted = newMuted
    setIsVideoMuted(newMuted)
  }, [isVideoMuted])

  // Load video stream URL
  useEffect(() => {
    const videoUrl = currentMeeting.recordingUrl || currentMeeting.recallBot?.videoUrl
    if (!videoUrl) return

    const fetchStreamUrl = async () => {
      try {
        setIsVideoLoading(true)
        setVideoError(null)
        
        // If we have a recordingUrl (from meeting details), use it directly
        if (currentMeeting.recordingUrl) {
          setVideoStreamUrl(currentMeeting.recordingUrl)
          return
        }
        
        // If we have a Recall bot video URL, use it directly
        if (currentMeeting.recallBot?.videoUrl) {
          setVideoStreamUrl(currentMeeting.recallBot.videoUrl)
          return
        }
        
        // Otherwise, try to get secure stream URL from our service
        const result = await ApiService.MeetingAgent.getVideoStreamUrl(currentMeeting.id)
        if (result.success && result.streamUrl) {
          setVideoStreamUrl(result.streamUrl)
        } else {
          // Fallback to direct URL
          setVideoStreamUrl(videoUrl)
        }
      } catch (error) {
        console.error('Failed to get stream URL:', error)
        setVideoError('Failed to load video stream')
        setVideoStreamUrl(videoUrl) // Fallback to direct URL
      } finally {
        setIsVideoLoading(false)
      }
    }

    fetchStreamUrl()
  }, [currentMeeting.id, currentMeeting.recordingUrl, currentMeeting.recallBot?.videoUrl])

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleLoadedData = () => {
      setVideoDuration(video.duration)
      setIsVideoLoading(false)
      setVideoError(null)
    }

    const handleTimeUpdate = () => {
      setVideoCurrentTime(video.currentTime)
    }

    const handlePlay = () => setIsVideoPlaying(true)
    const handlePause = () => setIsVideoPlaying(false)
    
    const handleError = () => {
      setVideoError('Failed to load video. The recording may not be available yet.')
      setIsVideoLoading(false)
    }

    video.addEventListener('loadeddata', handleLoadedData)
    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('error', handleError)

    return () => {
      video.removeEventListener('loadeddata', handleLoadedData)
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('error', handleError)
    }
  }, [videoStreamUrl])

  // Fetch transcript from URL if available
  useEffect(() => {
    const transcriptUrl = currentMeeting.transcriptionUrl || currentMeeting.recallBot?.transcriptUrl
    if (!transcriptUrl || isLiveRecording) return

    const fetchTranscript = async () => {
      try {
        setIsTranscriptionLoading(true)
        // Use proxy endpoint to avoid CORS issues
        const transcriptData = await ApiService.MeetingAgent.proxyTranscript(transcriptUrl)
        
        // Handle different transcript formats from Recall API
        if (transcriptData.utterances && Array.isArray(transcriptData.utterances)) {
          // Format: { utterances: [{ speaker: string, text: string, start: number, end: number }] }
          const segments: TranscriptionSegment[] = transcriptData.utterances.map((utterance: any, index: number) => ({
            id: utterance.id || `segment-${index}`,
            speakerId: utterance.speaker || 'unknown',
            speakerName: utterance.speaker_name || `Speaker ${utterance.speaker || 'Unknown'}`,
            text: utterance.text || '',
            startTime: utterance.start || 0,
            endTime: utterance.end || 0,
            confidence: utterance.confidence || 1.0
          }))
          setTranscriptionSegments(segments)
          
          // Also set full text
          const fullText = segments.map(s => `${s.speakerName}: ${s.text}`).join('\n\n')
          setTranscriptionFullText(fullText)
        } else if (transcriptData.text) {
          // Format: { text: string }
          setTranscriptionFullText(transcriptData.text)
        } else if (typeof transcriptData === 'string') {
          // Format: plain text string
          setTranscriptionFullText(transcriptData)
        } else {
          // Try to extract text from any structure
          const text = JSON.stringify(transcriptData, null, 2)
          setTranscriptionFullText(text)
        }
      } catch (error) {
        console.error('Failed to fetch transcript from URL:', error)
        // Don't set error state, just log it
      } finally {
        setIsTranscriptionLoading(false)
      }
    }

    fetchTranscript()
  }, [currentMeeting.transcriptionUrl, currentMeeting.recallBot?.transcriptUrl, isLiveRecording])

  // Use transcription data from the meeting object (from sessions endpoint)
  useEffect(() => {
    // Use transcriptionText from the meeting object if available
    if (currentMeeting.transcriptionText) {
      setTranscriptionFullText(currentMeeting.transcriptionText)
    }
  }, [currentMeeting.transcriptionText])

  // Handle transcript segment click to seek video
  const handleTranscriptSegmentClick = useCallback((startTime: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = startTime
      setVideoCurrentTime(startTime)
    }
  }, [])

  const duration = getDuration()

  return (
    <div className="h-full flex flex-col bg-card">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-card border-b border-border">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {onBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="flex-shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div className="flex-1 min-w-0">
            <Typography variant="h3" className="text-lg font-semibold truncate">
              {currentMeeting.title || formatDate(getMeetingDate(currentMeeting as MeetingSession & { createdAt?: string | Date }))}
            </Typography>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-6 py-3 bg-card border-b border-border flex items-center gap-4 flex-wrap">
        {/* Compact Meeting Details - Single line with icons */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5" title="Duration">
            <Clock className="h-3.5 w-3.5" />
            <span>{formatDuration(duration)}</span>
          </div>
          {displayParticipantNames.length > 0 ? (
            <Popover>
              <PopoverTrigger asChild>
                <div className="flex items-center gap-1.5 cursor-pointer hover:text-foreground transition-colors" title="Participants">
                  <Users className="h-3.5 w-3.5" />
                  <span>{displayParticipantNames.length}</span>
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-3" align="start">
                <div className="space-y-2">
                  <Typography variant="small" className="font-semibold text-xs text-muted-foreground uppercase mb-2">
                    Participants ({displayParticipantNames.length})
                  </Typography>
                  <div className="space-y-1.5">
                    {displayParticipantNames.map((participant) => (
                      <div key={participant.id} className="flex items-start gap-2">
                        <Typography variant="p" className="text-sm leading-snug">
                          {participant.name}
                        </Typography>
                      </div>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          ) : (
            <div className="flex items-center gap-1.5" title="Participants">
              <Users className="h-3.5 w-3.5" />
              <span>0</span>
            </div>
          )}
          <div className="flex items-center gap-1.5" title={`Recording: ${currentMeeting.metadata.recordingEnabled ? 'Enabled' : 'Disabled'}`}>
            {currentMeeting.metadata.recordingEnabled ? (
              <Video className="h-3.5 w-3.5 text-green-500" />
            ) : (
              <VideoOff className="h-3.5 w-3.5" />
            )}
          </div>
          <div className="flex items-center gap-1.5" title={`Transcription: ${currentMeeting.metadata.transcriptionEnabled ? 'Enabled' : 'Disabled'}`}>
            {currentMeeting.metadata.transcriptionEnabled ? (
              <Mic className="h-3.5 w-3.5 text-green-500" />
            ) : (
              <MicOff className="h-3.5 w-3.5" />
            )}
          </div>
          {/* Progress for active sessions */}
          {(currentMeeting.status === 'active' || currentMeeting.status === 'recording') && currentMeeting.metadata.maxDuration && (
            <div className="flex items-center gap-1.5" title="Progress">
              <div className="w-16 h-1 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary" 
                  style={{ width: `${Math.min((duration / (currentMeeting.metadata.maxDuration * 60)) * 100, 100)}%` }}
                />
              </div>
              <span className="text-xs">{formatDuration(duration)}/{currentMeeting.metadata.maxDuration}m</span>
            </div>
          )}
        </div>

        <Separator orientation="vertical" className="h-5" />

        {currentMeeting.status === 'completed' && (currentMeeting.recordingUrl || videoStreamUrl) && (
          <Button
            size="xs"
            variant="outline"
            onClick={handleDownloadRecording}
            disabled={isLoading}
          >
            <Download className="h-4 w-4 mr-2" />
            Download Recording
          </Button>
        )}
        {(currentMeeting.status === 'active' || currentMeeting.status === 'completed') && !currentMeeting.recordingUrl && !videoStreamUrl && (
          <Button
            size="xs"
            variant="outline"
            onClick={() => setIsUploadDialogOpen(true)}
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Recording
          </Button>
        )}
        {(currentMeeting.transcriptionText || transcriptionFullText) && (
          <Button
            size="xs"
            variant="outline"
            onClick={handleDownloadTranscription}
            disabled={isLoading}
          >
            <FileText className="h-4 w-4 mr-2" />
            Download Transcription
          </Button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-6 py-6 space-y-6">
          {/* Two-column layout: Video/Notes on left, Transcript on right */}
          <div className="flex gap-6">
            {/* Left Column: Video and Notes */}
            <div className="flex-1 space-y-6 min-w-0">
              {/* Video Player */}
              {(currentMeeting.recordingUrl || currentMeeting.recallBot?.videoUrl || videoStreamUrl) && (
                <div>
                  <Card className="bg-muted/50 border-border">
                    <div className="relative aspect-video bg-black rounded-t-lg overflow-hidden">
                      {isVideoLoading && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center text-muted-foreground">
                            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                            <p>Loading video...</p>
                          </div>
                        </div>
                      )}
                      
                      {videoError && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center text-muted-foreground">
                            <Video className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                            <p className="text-destructive mb-2">{videoError}</p>
                            <Button 
                              onClick={() => {
                                setVideoError(null)
                                setIsVideoLoading(true)
                                if (videoRef.current) {
                                  videoRef.current.load()
                                }
                              }}
                              variant="outline"
                              size="sm"
                            >
                              Retry
                            </Button>
                          </div>
                        </div>
                      )}

                      {videoStreamUrl && (
                        <video
                          ref={videoRef}
                          src={videoStreamUrl}
                          className="w-full h-full object-contain"
                          preload="metadata"
                          onLoadStart={() => setIsVideoLoading(true)}
                          crossOrigin="anonymous"
                        />
                      )}

                      {/* Video Overlay Controls */}
                      {!isVideoLoading && !videoError && videoStreamUrl && (
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-200">
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Button
                              variant="ghost"
                              size="lg"
                              onClick={toggleVideoPlayPause}
                              className="bg-black/50 hover:bg-black/70 text-white rounded-full w-16 h-16"
                            >
                              {isVideoPlaying ? (
                                <Pause className="h-8 w-8" />
                              ) : (
                                <Play className="h-8 w-8 ml-1" />
                              )}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Video Controls */}
                    {!isVideoLoading && !videoError && videoStreamUrl && (
                      <div className="bg-card p-4 space-y-3 rounded-b-lg border-t border-border">
                        {/* Progress Bar */}
                        <div className="space-y-2">
                          <Slider
                            value={[videoCurrentTime]}
                            max={videoDuration || 100}
                            step={0.1}
                            onValueChange={handleVideoSeek}
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{formatTime(videoCurrentTime)}</span>
                            <span>{formatTime(videoDuration)}</span>
                          </div>
                        </div>

                        {/* Control Buttons */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={toggleVideoPlayPause}
                            >
                              {isVideoPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                            </Button>

                            {/* Volume Control */}
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={toggleVideoMute}
                              >
                                {isVideoMuted || videoVolume === 0 ? (
                                  <VolumeX className="h-4 w-4" />
                                ) : (
                                  <Volume2 className="h-4 w-4" />
                                )}
                              </Button>
                              <Slider
                                value={[isVideoMuted ? 0 : videoVolume]}
                                max={1}
                                step={0.1}
                                onValueChange={handleVideoVolumeChange}
                                className="w-20"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </Card>
                </div>
              )}

              {/* Notes Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <Typography variant="h4" className="text-base font-semibold">
                   Summary 
                  </Typography>
                  <div className="flex items-center gap-2">
                    {hasUnsavedChanges && (
                      <Button
                        size="xs"
                        variant="default"
                        onClick={async () => {
                          try {
                            setIsSavingSummary(true)
                            const editor = summaryEditorRef.current?.editor
                            if (!editor) {
                              toast({
                                title: 'Error',
                                description: 'Editor not ready. Please try again.',
                                variant: 'destructive'
                              })
                              return
                            }

                            const htmlContent = editor.getHTML()
                            
                            await handleSaveEditedSummary(
                              currentMeeting.id,
                              htmlContent,
                              currentMeeting.summary,
                              undefined, // Action item states are extracted from HTML
                              (updatedMeeting) => {
                                setCurrentMeeting(updatedMeeting)
                                onMeetingUpdated?.(updatedMeeting)
                                setSummaryHtml(updatedMeeting.summary?.summary || htmlContent)
                                setHasUnsavedChanges(false)
                                // Update checked states from the saved meeting
                                if (updatedMeeting.summary?.actionItems) {
                                  const checkedStates = new Map<string, boolean>()
                                  updatedMeeting.summary.actionItems.forEach(item => {
                                    checkedStates.set(item.id, item.status === 'completed')
                                  })
                                  setActionItemCheckedStates(checkedStates)
                                }
                                toast({
                                  title: 'Success',
                                  description: 'Summary saved successfully'
                                })
                              },
                              (error) => {
                                toast({
                                  title: 'Error',
                                  description: error,
                                  variant: 'destructive'
                                })
                              }
                            )
                          } catch (error) {
                            const errorMessage = error instanceof Error ? error.message : 'Failed to save summary'
                            toast({
                              title: 'Error',
                              description: errorMessage,
                              variant: 'destructive'
                            })
                          } finally {
                            setIsSavingSummary(false)
                          }
                        }}
                        disabled={isSavingSummary || isGeneratingSummary}
                      >
                        {isSavingSummary ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Save
                          </>
                        )}
                      </Button>
                    )}
                    {(currentMeeting.summary || summaryHtml) && (
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={async () => {
                          try {
                            setIsGeneratingSummary(true)
                            setSummaryHtml('')
                            setHasUnsavedChanges(false)
                            const availableTranscription = currentMeeting.transcriptionText || transcriptionFullText
                            const editor = summaryEditorRef.current?.editor
                            
                            await handleRegenerateSummary({
                              sessionId: currentMeeting.id,
                              transcriptionText: availableTranscription,
                              editor,
                              onSuccess: (updatedMeeting) => {
                                setCurrentMeeting(updatedMeeting)
                                onMeetingUpdated?.(updatedMeeting)
                                setSummaryHtml(updatedMeeting.summary?.summary || '')
                                setHasUnsavedChanges(false)
                                // Reset action item checked states from regenerated summary
                                if (updatedMeeting.summary?.actionItems) {
                                  const checkedStates = new Map<string, boolean>()
                                  updatedMeeting.summary.actionItems.forEach(item => {
                                    checkedStates.set(item.id, item.status === 'completed')
                                  })
                                  setActionItemCheckedStates(checkedStates)
                                }
                                toast({
                                  title: 'Success',
                                  description: 'Summary regenerated and saved successfully'
                                })
                              },
                              onError: (error) => {
                                toast({
                                  title: 'Error',
                                  description: error,
                                  variant: 'destructive'
                                })
                              },
                              onProgress: (html) => {
                                setSummaryHtml(html)
                              }
                            })
                          } catch (error) {
                            const errorMessage = error instanceof Error ? error.message : 'Failed to regenerate summary'
                            toast({
                              title: 'Error',
                              description: errorMessage,
                              variant: 'destructive'
                            })
                          } finally {
                            setIsGeneratingSummary(false)
                          }
                        }}
                        disabled={isGeneratingSummary || isSavingSummary || (!currentMeeting.transcriptionText && !transcriptionFullText)}
                      >
                        {isGeneratingSummary ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Regenerating...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Regenerate
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
                    {(currentMeeting.summary || summaryHtml) ? (
                      <>
                        <div className="min-h-[200px]">
                          <MeetingSummaryEditor
                            key={currentMeeting.id}
                            initialContent={currentMeeting.summary?.summary || summaryHtml || ''}
                            isReadOnly={isGeneratingSummary}
                            isLoading={isGeneratingSummary}
                            placeholder="Summary will appear here..."
                            onContentChange={(content) => {
                              if (!isGeneratingSummary) {
                                setHasUnsavedChanges(true)
                              }
                            }}
                            ref={summaryEditorRef}
                          />
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12">
                        <Typography variant="h4" className="text-lg font-semibold mb-2">
                          No Summary Available
                        </Typography>
                        <Typography variant="p" className="text-sm text-muted-foreground mb-6 text-center max-w-md">
                          Generate an AI-powered summary based on the meeting transcription
                        </Typography>
                        <Button
                          onClick={async () => {
                            if (!currentMeeting.transcriptionText && !transcriptionFullText) {
                              toast({
                                title: 'Error',
                                description: 'No transcription available. Please wait for transcription to complete.',
                                variant: 'destructive'
                              })
                              return
                            }

                            const editor = summaryEditorRef.current?.editor
                            if (!editor) {
                              toast({
                                title: 'Error',
                                description: 'Editor not ready. Please try again.',
                                variant: 'destructive'
                              })
                              return
                            }

                            try {
                              setIsGeneratingSummary(true)
                              setSummaryHtml('')
                              const availableTranscription = currentMeeting.transcriptionText || transcriptionFullText
                              
                              await handleGenerateAnthropicSummaryWithSave(
                                currentMeeting.id,
                                availableTranscription,
                                editor,
                                (updatedMeeting) => {
                                  setCurrentMeeting(updatedMeeting)
                                  onMeetingUpdated?.(updatedMeeting)
                                  setSummaryHtml(updatedMeeting.summary?.summary || '')
                                  setHasUnsavedChanges(false)
                                  // Initialize action item checked states from generated summary
                                  if (updatedMeeting.summary?.actionItems) {
                                    const checkedStates = new Map<string, boolean>()
                                    updatedMeeting.summary.actionItems.forEach(item => {
                                      checkedStates.set(item.id, item.status === 'completed')
                                    })
                                    setActionItemCheckedStates(checkedStates)
                                  }
                                  toast({
                                    title: 'Success',
                                    description: 'Summary generated successfully'
                                  })
                                },
                                (error) => {
                                  toast({
                                    title: 'Error',
                                    description: error,
                                    variant: 'destructive'
                                  })
                                },
                                (html) => {
                                  setSummaryHtml(html)
                                }
                              )
                            } catch (error) {
                              const errorMessage = error instanceof Error ? error.message : 'Failed to generate summary'
                              toast({
                                title: 'Error',
                                description: errorMessage,
                                variant: 'destructive'
                              })
                            } finally {
                              setIsGeneratingSummary(false)
                            }
                          }}
                          disabled={isGeneratingSummary || (!currentMeeting.transcriptionText && !transcriptionFullText)}
                        >
                          {isGeneratingSummary ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Generating Summary...
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-4 w-4 mr-2" />
                              Generate Summary
                            </>
                          )}
                        </Button>
                      </div>
                    )}
              </div>
            </div>

            {/* Right Column: Transcript */}
            {(allSegments.length > 0 || transcriptionFullText || currentMeeting.transcriptionText || isLiveRecording || currentMeeting.transcriptionUrl || currentMeeting.recallBot?.transcriptUrl) && (
              <div className="w-96 flex-shrink-0">
                <div className="flex items-center justify-between mb-4">
                  {/* Live connection status indicator */}
                  {isLiveRecording && (
                    <div className="flex items-center gap-2">
                      {isLiveConnecting ? (
                        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          Connecting...
                        </Badge>
                      ) : isLiveConnected && isLivePolling ? (
                        <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                          <div className="h-2 w-2 mr-1.5 bg-blue-500 rounded-full animate-pulse" />
                          Polling
                        </Badge>
                      ) : isLiveConnected ? (
                        <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                          <div className="h-2 w-2 mr-1.5 bg-green-500 rounded-full animate-pulse" />
                          Live
                        </Badge>
                      ) : (
                        <Badge 
                          variant="outline" 
                          className="bg-red-500/10 text-red-500 border-red-500/20 cursor-pointer"
                          onClick={reconnectLive}
                        >
                          <WifiOff className="h-3 w-3 mr-1" />
                          Disconnected
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
                {isTranscriptionLoading && !isLiveRecording ? (
                  <Card className="border-border">
                    <div className="flex items-center justify-center p-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  </Card>
                ) : allSegments.length > 0 ? (
                  <Card className="border-border">
                    <div ref={transcriptScrollRef} className="p-1 max-h-[calc(100vh-300px)] overflow-y-auto space-y-1">
                      {allSegments.map((segment, index) => (
                        <div
                          key={segment.id || index}
                          data-segment-start={Math.floor(segment.startTime)}
                          className={`px-1.5 py-1 rounded-md cursor-pointer transition-colors ${
                            videoCurrentTime >= segment.startTime && videoCurrentTime < segment.endTime
                              ? 'bg-primary/20 border border-primary/30'
                              : 'hover:bg-muted border border-transparent'
                          }`}
                          onClick={() => handleTranscriptSegmentClick(segment.startTime)}
                        >
                          <div className="flex items-start gap-1.5">
                            <div className="flex-shrink-0">
                              <Badge variant="outline" className="text-xs py-0 px-1.5">
                                {formatTimestamp(segment.startTime)}
                              </Badge>
                            </div>
                            <div className="flex-1 min-w-0">
                              <Typography variant="small" className="font-medium text-foreground leading-tight">
                                {segment.speakerName || 'Speaker'}
                              </Typography>
                              <Typography variant="p" className="text-sm text-muted-foreground leading-snug">
                                {segment.text}
                              </Typography>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                ) : transcriptionFullText || currentMeeting.transcriptionText ? (
                  <Card className="border-border">
                    <div className="p-1 max-h-[calc(100vh-300px)] overflow-y-auto">
                      <Typography variant="p" className="text-sm whitespace-pre-wrap leading-snug">
                        {transcriptionFullText || currentMeeting.transcriptionText}
                      </Typography>
                    </div>
                  </Card>
                ) : isLiveRecording ? (
                  <Card className="bg-muted/50 border-border">
                    <div className="p-8 text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Radio className="h-5 w-5 text-muted-foreground animate-pulse" />
                        <Typography variant="p" className="text-muted-foreground">
                          {isLiveConnecting ? 'Connecting to live transcription...' : 
                           isLiveConnected ? 'Waiting for transcription...' :
                           liveError ? 'Connection error - click to retry' :
                           'Preparing transcription...'}
                        </Typography>
                      </div>
                      <Typography variant="small" className="text-muted-foreground/70">
                        Speech will appear here as it&apos;s transcribed in real-time
                      </Typography>
                      {liveError && !isLiveConnected && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-3"
                          onClick={reconnectLive}
                        >
                          <Wifi className="h-4 w-4 mr-2" />
                          Reconnect
                        </Button>
                      )}
                    </div>
                  </Card>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Video Player Dialog */}
      {(currentMeeting.recordingUrl || videoStreamUrl) && (
        <VideoPlayerDialog
          open={isVideoPlayerOpen}
          onOpenChange={setIsVideoPlayerOpen}
          session={currentMeeting}
          videoUrl={currentMeeting.recordingUrl || videoStreamUrl || ''}
        />
      )}

      {/* Recording Upload Dialog */}
      <RecordingUploadDialog
        open={isUploadDialogOpen}
        onOpenChange={setIsUploadDialogOpen}
        sessionId={currentMeeting.id}
        sessionTitle={currentMeeting.title}
        onUploadComplete={() => {
          toast({
            title: 'Recording Uploaded',
            description: 'Your meeting recording has been saved successfully'
          })
          // Refresh meeting data would be handled by parent
          onMeetingUpdated?.(currentMeeting)
        }}
      />
    </div>
  )
}

