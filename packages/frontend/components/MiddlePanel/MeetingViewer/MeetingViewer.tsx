import { ArrowLeft, Trash2, Download, FileText, Users, Clock, Video, VideoOff, Mic, MicOff, Play, ExternalLink, Share2, Upload, Pause, Volume2, VolumeX, Loader2, Radio, Wifi, WifiOff } from "lucide-react"
import { useState, useCallback, useEffect, useRef } from "react"
import { Button } from "../../ui/button"
import { useToast } from "../../ui/use-toast"
import { Typography } from "../../ui/typography"
import { Badge } from "../../ui/badge"
import { Separator } from "../../ui/separator"
import { Progress } from "../../ui/progress"
import { Slider } from "../../ui/slider"
import { MeetingSession, TranscriptionSegment } from "../../../types/meeting-types"
import { ApiService } from "../../../../backend/api/apiService"
import { VideoPlayerDialog } from "../../../pages/MeetingAgent/components/VideoPlayerDialog"
import { RecordingUploadDialog } from "../../../pages/MeetingAgent/components/RecordingUploadDialog"
import { Card } from "../../ui/card"
import { useLiveTranscription } from "../../../hooks/useLiveTranscription"

interface MeetingViewerProps {
  meeting: MeetingSession
  onBack?: () => void
  onMeetingUpdated?: (meeting: MeetingSession) => void
  onMeetingDeleted?: (meetingId: string) => void
}

export function MeetingViewer({ meeting, onBack, onMeetingUpdated, onMeetingDeleted }: MeetingViewerProps) {
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
  
  // Live transcription - only enabled when meeting is recording
  const isLiveRecording = currentMeeting.status === 'recording' || currentMeeting.status === 'active'
  const {
    segments: liveSegments,
    isConnected: isLiveConnected,
    isConnecting: isLiveConnecting,
    error: liveError,
    reconnect: reconnectLive
  } = useLiveTranscription({
    sessionId: currentMeeting.id,
    enabled: isLiveRecording,
    onSegment: (segment) => {
      // Auto-scroll to latest segment
      if (transcriptScrollRef.current) {
        setTimeout(() => {
          transcriptScrollRef.current?.scrollTo({
            top: transcriptScrollRef.current.scrollHeight,
            behavior: 'smooth'
          })
        }, 100)
      }
    }
  })
  
  // Combine stored segments with live segments
  const allSegments = isLiveRecording && liveSegments.length > 0 
    ? liveSegments 
    : transcriptionSegments

  const getDuration = () => {
    if (currentMeeting.duration) {
      return Math.round(currentMeeting.duration / 60)
    }
    
    if (currentMeeting.endTime) {
      const duration = new Date(currentMeeting.endTime).getTime() - new Date(currentMeeting.startTime).getTime()
      return Math.round(duration / (1000 * 60))
    }
    
    if (currentMeeting.status === 'active' || currentMeeting.status === 'recording') {
      const duration = Date.now() - new Date(currentMeeting.startTime).getTime()
      return Math.round(duration / (1000 * 60))
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

  const formatDate = (date: Date | string) => {
    if (!date) return 'Not available'
    const d = date instanceof Date ? date : new Date(date)
    if (isNaN(d.getTime())) return 'Invalid date'
    return d.toLocaleString([], { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleDownloadRecording = useCallback(async () => {
    if (!currentMeeting.recordingUrl) return
    
    try {
      setIsLoading(true)
      const result = await ApiService.MeetingAgent.downloadRecording(currentMeeting.id)
      
      if (result.success && result.downloadUrl) {
        const link = document.createElement('a')
        link.href = result.downloadUrl
        link.download = `${currentMeeting.title || 'meeting'}_recording.mp4`
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
      
      const content = `Meeting: ${currentMeeting.title || 'Untitled Meeting'}
Date: ${formatDate(currentMeeting.startTime)}
Platform: ${currentMeeting.platform?.name || 'Desktop Recording'}
Duration: ${getDuration()} minutes

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
      link.download = `${currentMeeting.title || 'meeting'}_transcription.txt`
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

  const handleDelete = useCallback(async () => {
    if (!confirm('Are you sure you want to delete this meeting session? This action cannot be undone.')) {
      return
    }
    
    try {
      setIsLoading(true)
      const result = await ApiService.MeetingAgent.deleteMeetingSession(currentMeeting.id)
      
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Meeting session deleted'
        })
        onMeetingDeleted?.(currentMeeting.id)
        onBack?.()
      } else {
        throw new Error(result.message)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete session'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }, [currentMeeting.id, onMeetingDeleted, onBack, toast])

  const handleCopyUrl = useCallback(() => {
    navigator.clipboard.writeText(currentMeeting.meetingUrl)
    toast({
      title: 'Success',
      description: 'Meeting URL copied to clipboard'
    })
  }, [currentMeeting.meetingUrl, toast])

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

  // Load transcription
  useEffect(() => {
    const loadTranscription = async () => {
      // Only load if we have transcription text or if status suggests transcription is available
      if (!currentMeeting.transcriptionText && 
          currentMeeting.status !== 'completed' && 
          currentMeeting.status !== 'processing') {
        return
      }

      try {
        setIsTranscriptionLoading(true)
        
        const result = await ApiService.MeetingAgent.getTranscription(currentMeeting.id)
        
        const segments = result.segments || []
        const fullText = result.fullText || ''
        
        if (segments.length > 0 || fullText) {
          setTranscriptionSegments(segments)
          setTranscriptionFullText(fullText)
        } else if (currentMeeting.transcriptionText) {
          // Fallback to stored transcription text
          setTranscriptionFullText(currentMeeting.transcriptionText)
        }
      } catch (err) {
        console.error('Failed to load transcription:', err)
        // Don't show error if transcription just isn't available yet
        if (currentMeeting.transcriptionText) {
          setTranscriptionFullText(currentMeeting.transcriptionText)
        }
      } finally {
        setIsTranscriptionLoading(false)
      }
    }

    loadTranscription()
  }, [currentMeeting.id, currentMeeting.transcriptionText, currentMeeting.status])

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
              {currentMeeting.title || 'Untitled Meeting'}
            </Typography>
            <Typography variant="small" className="text-muted-foreground">
              {currentMeeting.platform?.name || 'Desktop Recording'} • {formatDate(currentMeeting.startTime)}
            </Typography>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge variant={getStatusVariant()}>
            {currentMeeting.status}
          </Badge>
        </div>
      </div>

      {/* Actions */}
      <div className="px-6 py-3 bg-card border-b border-border flex items-center gap-2 flex-wrap">
        <Button
          size="sm"
          variant="outline"
          onClick={() => window.open(currentMeeting.meetingUrl, '_blank')}
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          View Meeting URL
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleCopyUrl}
        >
          <Share2 className="h-4 w-4 mr-2" />
          Copy URL
        </Button>
        {currentMeeting.status === 'completed' && currentMeeting.recordingUrl && (
          <>
            <Button
              size="sm"
              variant="default"
              onClick={() => setIsVideoPlayerOpen(true)}
            >
              <Play className="h-4 w-4 mr-2" />
              Watch Recording
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleDownloadRecording}
              disabled={isLoading}
            >
              <Download className="h-4 w-4 mr-2" />
              Download Recording
            </Button>
          </>
        )}
        {(currentMeeting.status === 'active' || currentMeeting.status === 'completed') && !currentMeeting.recordingUrl && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsUploadDialogOpen(true)}
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Recording
          </Button>
        )}
        {currentMeeting.transcriptionText && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleDownloadTranscription}
            disabled={isLoading}
          >
            <FileText className="h-4 w-4 mr-2" />
            Download Transcription
          </Button>
        )}
        <Button
          size="sm"
          variant="destructive"
          onClick={handleDelete}
          disabled={isLoading}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-6 py-6 space-y-6">
          {/* Video Player */}
          {(currentMeeting.recordingUrl || currentMeeting.recallBot?.videoUrl) && (
            <>
              <div>
                <Typography variant="h4" className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Video className="h-4 w-4" />
                  Meeting Recording
                </Typography>
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
              <Separator />
            </>
          )}

          {/* Transcript - Show for completed meetings or live recordings */}
          {(allSegments.length > 0 || transcriptionFullText || currentMeeting.transcriptionText || isLiveRecording) && (
            <>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Typography variant="h4" className="text-sm font-semibold flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    {isLiveRecording ? 'Live Transcription' : 'Transcript'}
                  </Typography>
                  {/* Live connection status indicator */}
                  {isLiveRecording && (
                    <div className="flex items-center gap-2">
                      {isLiveConnecting ? (
                        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          Connecting...
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
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : allSegments.length > 0 ? (
                  <Card className="bg-muted/50 border-border">
                    <div ref={transcriptScrollRef} className="p-4 max-h-[600px] overflow-y-auto space-y-3">
                      {allSegments.map((segment, index) => (
                        <div
                          key={segment.id || index}
                          data-segment-start={Math.floor(segment.startTime)}
                          className={`p-3 rounded-lg cursor-pointer transition-colors ${
                            videoCurrentTime >= segment.startTime && videoCurrentTime < segment.endTime
                              ? 'bg-primary/20 border border-primary/30'
                              : 'bg-background hover:bg-muted border border-transparent'
                          }`}
                          onClick={() => handleTranscriptSegmentClick(segment.startTime)}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0">
                              <Badge variant="outline" className="text-xs">
                                {formatTimestamp(segment.startTime)}
                              </Badge>
                            </div>
                            <div className="flex-1 min-w-0">
                              <Typography variant="small" className="font-medium text-foreground mb-1">
                                {segment.speakerName || 'Speaker'}
                              </Typography>
                              <Typography variant="p" className="text-sm text-muted-foreground">
                                {segment.text}
                              </Typography>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                ) : transcriptionFullText || currentMeeting.transcriptionText ? (
                  <Card className="bg-muted/50 border-border">
                    <div className="p-4 max-h-[600px] overflow-y-auto">
                      <Typography variant="p" className="text-sm whitespace-pre-wrap">
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
              <Separator />
            </>
          )}

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Typography variant="small" className="text-muted-foreground mb-1">
                Duration
              </Typography>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <Typography variant="p" className="text-sm">
                  {duration} min
                </Typography>
              </div>
            </div>

            <div>
              <Typography variant="small" className="text-muted-foreground mb-1">
                Participants
              </Typography>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <Typography variant="p" className="text-sm">
                  {currentMeeting.participants.length}
                </Typography>
              </div>
            </div>

            <div>
              <Typography variant="small" className="text-muted-foreground mb-1">
                Recording
              </Typography>
              <div className="flex items-center gap-2">
                {currentMeeting.metadata.recordingEnabled ? (
                  <Video className="h-4 w-4 text-green-500" />
                ) : (
                  <VideoOff className="h-4 w-4 text-muted-foreground" />
                )}
                <Typography variant="p" className="text-sm">
                  {currentMeeting.metadata.recordingEnabled ? 'Enabled' : 'Disabled'}
                </Typography>
              </div>
            </div>

            <div>
              <Typography variant="small" className="text-muted-foreground mb-1">
                Transcription
              </Typography>
              <div className="flex items-center gap-2">
                {currentMeeting.metadata.transcriptionEnabled ? (
                  <Mic className="h-4 w-4 text-green-500" />
                ) : (
                  <MicOff className="h-4 w-4 text-muted-foreground" />
                )}
                <Typography variant="p" className="text-sm">
                  {currentMeeting.metadata.transcriptionEnabled ? 'Enabled' : 'Disabled'}
                </Typography>
              </div>
            </div>

            {currentMeeting.endTime && (
              <div>
                <Typography variant="small" className="text-muted-foreground mb-1">
                  End Time
                </Typography>
                <Typography variant="p" className="text-sm">
                  {formatDate(currentMeeting.endTime)}
                </Typography>
              </div>
            )}
          </div>

          {/* Progress bar for active sessions */}
          {(currentMeeting.status === 'active' || currentMeeting.status === 'recording') && currentMeeting.metadata.maxDuration && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <Typography variant="small">Progress</Typography>
                  <Typography variant="small">{duration} / {currentMeeting.metadata.maxDuration} min</Typography>
                </div>
                <Progress 
                  value={(duration / currentMeeting.metadata.maxDuration) * 100} 
                  className="h-2"
                />
              </div>
            </>
          )}

          {/* Participants */}
          {currentMeeting.participants.length > 0 && (
            <>
              <Separator />
              <div>
                <Typography variant="h4" className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Participants ({currentMeeting.participants.length})
                </Typography>
                <div className="space-y-2">
                  {currentMeeting.participants.map((participant, index) => (
                    <div key={participant.id || index} className="flex items-center justify-between p-2 rounded bg-muted">
                      <Typography variant="p" className="text-sm">
                        {typeof participant === 'string' 
                          ? participant 
                          : participant.name || participant.email || 'Unknown'
                        }
                      </Typography>
                      <Badge variant="outline" className="text-xs">
                        {typeof participant === 'object' && participant.role ? participant.role : 'participant'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

        </div>
      </div>

      {/* Video Player Dialog */}
      {currentMeeting.recordingUrl && (
        <VideoPlayerDialog
          open={isVideoPlayerOpen}
          onOpenChange={setIsVideoPlayerOpen}
          session={currentMeeting}
          videoUrl={currentMeeting.recordingUrl}
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

