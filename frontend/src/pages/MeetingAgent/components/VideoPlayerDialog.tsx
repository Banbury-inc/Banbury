import { useState, useRef, useEffect } from 'react'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { Slider } from '../../../components/ui/slider'
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize,
  SkipBack,
  SkipForward,
  Download,
  X,
  Clock,
  Video,
  Loader2
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog'
import { MeetingSession } from '../../../types/meeting-types'
import { MeetingAgentService } from '../../../services/meetingAgentService'
import { useToast } from '../../../components/ui/use-toast'

interface VideoPlayerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  session: MeetingSession
  videoUrl: string
}

export function VideoPlayerDialog({
  open,
  onOpenChange,
  session,
  videoUrl
}: VideoPlayerDialogProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [streamUrl, setStreamUrl] = useState<string | null>(null)
  const { toast } = useToast()

  // Format time in MM:SS or HH:MM:SS format
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

  // Handle play/pause
  const togglePlayPause = () => {
    if (!videoRef.current) return
    
    if (isPlaying) {
      videoRef.current.pause()
    } else {
      videoRef.current.play()
    }
  }

  // Handle seek
  const handleSeek = (value: number[]) => {
    if (!videoRef.current) return
    const newTime = value[0]
    videoRef.current.currentTime = newTime
    setCurrentTime(newTime)
  }

  // Handle volume change
  const handleVolumeChange = (value: number[]) => {
    if (!videoRef.current) return
    const newVolume = value[0]
    videoRef.current.volume = newVolume
    setVolume(newVolume)
    setIsMuted(newVolume === 0)
  }

  // Toggle mute
  const toggleMute = () => {
    if (!videoRef.current) return
    const newMuted = !isMuted
    videoRef.current.muted = newMuted
    setIsMuted(newMuted)
  }

  // Skip forward/backward
  const skipTime = (seconds: number) => {
    if (!videoRef.current) return
    videoRef.current.currentTime = Math.max(0, Math.min(duration, currentTime + seconds))
  }

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!videoRef.current) return
    
    if (!isFullscreen) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen()
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      }
    }
  }

  // Handle playback rate change
  const handlePlaybackRateChange = (rate: number) => {
    if (!videoRef.current) return
    videoRef.current.playbackRate = rate
    setPlaybackRate(rate)
  }

  // Download recording
  const handleDownload = async () => {
    try {
      // Use Recall video URL if available
      if (session.recallBot?.videoUrl) {
        const link = document.createElement('a')
        link.href = session.recallBot.videoUrl
        link.download = `${session.title || 'meeting'}_recall_recording.mp4`
        link.target = '_blank'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        toast({
          title: 'Download Started',
          description: 'Your Recall recording download has started'
        })
        return
      }
      
      // Fallback to our service for non-Recall recordings
      const result = await MeetingAgentService.downloadRecording(session.id)
      if (result.success && result.downloadUrl) {
        const link = document.createElement('a')
        link.href = result.downloadUrl
        link.download = `${session.title || 'meeting'}_recording.mp4`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        toast({
          title: 'Download Started',
          description: 'Your meeting recording download has started'
        })
      } else {
        throw new Error(result.message || 'Download failed')
      }
    } catch (error) {
      toast({
        title: 'Download Failed',
        description: 'Failed to download recording',
        variant: 'destructive'
      })
    }
  }

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleLoadedData = () => {
      setDuration(video.duration)
      setIsLoading(false)
      setError(null)
    }

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime)
    }

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    
    const handleError = () => {
      setError('Failed to load video. The recording may not be available yet.')
      setIsLoading(false)
    }

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    video.addEventListener('loadeddata', handleLoadedData)
    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('error', handleError)
    document.addEventListener('fullscreenchange', handleFullscreenChange)

    return () => {
      video.removeEventListener('loadeddata', handleLoadedData)
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('error', handleError)
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [streamUrl])

  // Fetch secure stream URL when dialog opens
  useEffect(() => {
    if (open) {
      setIsLoading(true)
      setError(null)
      setCurrentTime(0)
      setIsPlaying(false)
      setStreamUrl(null)
      
      // Get video URL - prioritize Recall video URL
      const fetchStreamUrl = async () => {
        try {
          // If we have a Recall bot video URL, use it directly
          if (session.recallBot?.videoUrl) {
            setStreamUrl(session.recallBot.videoUrl)
            return
          }
          
          // Otherwise, try to get secure stream URL from our service
          const result = await MeetingAgentService.getVideoStreamUrl(session.id)
          if (result.success && result.streamUrl) {
            setStreamUrl(result.streamUrl)
          } else {
            // Fallback to direct URL if stream URL fails
            setStreamUrl(videoUrl)
          }
        } catch (error) {
          console.error('Failed to get stream URL:', error)
          // Fallback to direct URL
          setStreamUrl(videoUrl)
        }
      }
      
      fetchStreamUrl()
    }
  }, [open, session.id, videoUrl, session.recallBot?.videoUrl])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-700 max-w-5xl max-h-[90vh] p-0">
        <div className="p-6">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Video className="h-5 w-5" />
              {session.title || 'Untitled Meeting'}
              {session.recallBot?.videoUrl && (
                <Badge variant="outline" className="bg-blue-600/20 border-blue-500/30 text-blue-300 text-xs">
                  Recall AI
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              {session.platform.name} • {new Date(session.startTime).toLocaleString()}
              {session.duration && ` • ${Math.round(session.duration / 60)} minutes`}
              {session.recallBot?.videoUrl && (
                <span className="text-blue-400"> • Recorded by Recall AI</span>
              )}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="relative bg-black">
          {/* Video Player */}
          <div className="relative aspect-video">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-zinc-800">
                <div className="text-center text-zinc-400">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                  <p>Loading video...</p>
                </div>
              </div>
            )}
            
            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-zinc-800">
                <div className="text-center text-zinc-400">
                  <Video className="h-12 w-12 mx-auto mb-4 text-zinc-500" />
                  <p className="text-red-400 mb-2">{error}</p>
                  <Button 
                    onClick={() => {
                      setError(null)
                      setIsLoading(true)
                      if (videoRef.current) {
                        videoRef.current.load()
                      }
                    }}
                    variant="outline"
                    size="sm"
                    className="text-white border-zinc-600"
                  >
                    Retry
                  </Button>
                </div>
              </div>
            )}

            {streamUrl && (
              <video
                ref={videoRef}
                src={streamUrl}
                className="w-full h-full object-contain"
                preload="metadata"
                onLoadStart={() => setIsLoading(true)}
                crossOrigin="anonymous"
              />
            )}

            {/* Video Overlay Controls */}
            {!isLoading && !error && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-200">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Button
                    variant="ghost"
                    size="lg"
                    onClick={togglePlayPause}
                    className="bg-black/50 hover:bg-black/70 text-white rounded-full w-16 h-16"
                  >
                    {isPlaying ? (
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
          {!isLoading && !error && (
            <div className="bg-zinc-900 p-4 space-y-3">
              {/* Progress Bar */}
              <div className="space-y-2">
                <Slider
                  value={[currentTime]}
                  max={duration}
                  step={0.1}
                  onValueChange={handleSeek}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-zinc-400">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Control Buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={togglePlayPause}
                    className="text-white hover:bg-zinc-800"
                  >
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => skipTime(-10)}
                    className="text-white hover:bg-zinc-800"
                  >
                    <SkipBack className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => skipTime(10)}
                    className="text-white hover:bg-zinc-800"
                  >
                    <SkipForward className="h-4 w-4" />
                  </Button>

                  {/* Volume Control */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleMute}
                      className="text-white hover:bg-zinc-800"
                    >
                      {isMuted || volume === 0 ? (
                        <VolumeX className="h-4 w-4" />
                      ) : (
                        <Volume2 className="h-4 w-4" />
                      )}
                    </Button>
                    <Slider
                      value={[isMuted ? 0 : volume]}
                      max={1}
                      step={0.1}
                      onValueChange={handleVolumeChange}
                      className="w-20"
                    />
                  </div>

                  {/* Playback Speed */}
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-zinc-400 mr-1">Speed:</span>
                    {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                      <Button
                        key={rate}
                        variant={playbackRate === rate ? "default" : "ghost"}
                        size="sm"
                        onClick={() => handlePlaybackRateChange(rate)}
                        className={`text-xs h-7 px-2 ${
                          playbackRate === rate 
                            ? 'bg-zinc-700 text-white' 
                            : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                        }`}
                      >
                        {rate}x
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDownload}
                    className="text-white hover:bg-zinc-800"
                  >
                    <Download className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleFullscreen}
                    className="text-white hover:bg-zinc-800"
                  >
                    {isFullscreen ? (
                      <Minimize className="h-4 w-4" />
                    ) : (
                      <Maximize className="h-4 w-4" />
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onOpenChange(false)}
                    className="text-white hover:bg-zinc-800"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Meeting Info */}
        <div className="p-6 pt-0">
          <Card className="bg-zinc-800 border-zinc-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-sm">Meeting Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-zinc-400" />
                  <div>
                    <p className="text-zinc-400">Duration</p>
                    <p className="text-white font-medium">
                      {session.duration ? `${Math.round(session.duration / 60)} min` : formatTime(duration)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Video className="h-4 w-4 text-zinc-400" />
                  <div>
                    <p className="text-zinc-400">Platform</p>
                    <p className="text-white font-medium">{session.platform.name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-zinc-400" />
                  <div>
                    <p className="text-zinc-400">Started</p>
                    <p className="text-white font-medium">
                      {new Date(session.startTime).toLocaleTimeString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-zinc-700 text-zinc-300">
                    {session.status}
                  </Badge>
                </div>
              </div>

              {/* Participants */}
              {session.participants.length > 0 && (
                <div className="mt-4 pt-4 border-t border-zinc-700">
                  <p className="text-zinc-400 text-sm mb-2">
                    Participants ({session.participants.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {session.participants.slice(0, 6).map((participant) => (
                      <Badge
                        key={participant.id}
                        variant="outline"
                        className="bg-zinc-700 border-zinc-600 text-zinc-300"
                      >
                        {participant.name}
                      </Badge>
                    ))}
                    {session.participants.length > 6 && (
                      <Badge variant="outline" className="bg-zinc-700 border-zinc-600 text-zinc-400">
                        +{session.participants.length - 6} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
