import { Loader2, Video, Play, Pause, Volume2, VolumeX } from "lucide-react"
import { RefObject, useEffect } from "react"
import { Button } from "../../../common/ui/button"
import { Card } from "../../../common/ui/card"
import { Slider } from "../../../common/ui/slider"
import { formatTime } from "../utils/duration-formatters"

interface VideoPlayerProps {
  videoRef: RefObject<HTMLVideoElement>
  videoStreamUrl: string | null
  isVideoLoading: boolean
  isVideoPlaying: boolean
  videoError: string | null
  videoCurrentTime: number
  videoDuration: number
  videoVolume: number
  isVideoMuted: boolean
  onTogglePlayPause: () => void
  onVideoSeek: (value: number[]) => void
  onVolumeChange: (value: number[]) => void
  onToggleMute: () => void
  onLoadStart: () => void
  setVideoError: (error: string | null) => void
  setIsVideoLoading: (loading: boolean) => void
}

export function VideoPlayer({
  videoRef,
  videoStreamUrl,
  isVideoLoading,
  isVideoPlaying,
  videoError,
  videoCurrentTime,
  videoDuration,
  videoVolume,
  isVideoMuted,
  onTogglePlayPause,
  onVideoSeek,
  onVolumeChange,
  onToggleMute,
  onLoadStart,
  setVideoError,
  setIsVideoLoading
}: VideoPlayerProps) {
  return (
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
            onLoadStart={onLoadStart}
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
                onClick={onTogglePlayPause}
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
              onValueChange={onVideoSeek}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatTime(videoCurrentTime)}</span>
              <span>{formatTime(videoDuration)}</span>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between overflow-hidden">
            <div className="flex items-center gap-2 min-w-0 flex-shrink">
              <Button
                variant="ghost"
                size="sm"
                onClick={onTogglePlayPause}
                className="flex-shrink-0"
              >
                {isVideoPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>

              {/* Volume Control */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggleMute}
                  className="flex-shrink-0"
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
                  onValueChange={onVolumeChange}
                  className="w-20 flex-shrink-0"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}
