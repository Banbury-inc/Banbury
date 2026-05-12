import { Loader2, Video, Play, Pause, Volume2, VolumeX, Maximize, Minimize } from "lucide-react"
import { RefObject, useEffect, useState } from "react"
import { Button } from "../../../common/ui/button"
import { Slider } from "../../../common/ui/slider"
import { formatTime } from "../utils/duration-formatters"

interface VideoPlayerProps {
  videoRef: RefObject<HTMLVideoElement>
  containerRef: RefObject<HTMLDivElement>
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
  onToggleFullscreen: () => void
  onLoadStart: () => void
  setVideoError: (error: string | null) => void
  setIsVideoLoading: (loading: boolean) => void
}

export function VideoPlayer({
  videoRef,
  containerRef,
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
  onToggleFullscreen,
  onLoadStart,
  setVideoError,
  setIsVideoLoading
}: VideoPlayerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="group relative h-full overflow-hidden border border-border bg-background shadow-sm ring-1 ring-border/40"
    >
      <div className="absolute inset-x-0 top-0 z-10 h-20 bg-gradient-to-b from-background/45 to-transparent pointer-events-none" />
      {isVideoLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
          <div className="rounded-2xl border border-border bg-card px-5 py-4 text-center text-muted-foreground shadow-sm">
            <Loader2 className="mx-auto mb-2 h-8 w-8 animate-spin" />
            <p className="text-sm font-medium">Loading video…</p>
          </div>
        </div>
      )}

      {videoError && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50 p-6">
          <div className="max-w-sm rounded-2xl border border-border bg-card px-6 py-5 text-center text-muted-foreground shadow-sm">
            <Video className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-sm text-destructive mb-3">{videoError}</p>
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
          className="h-full w-full bg-background object-contain outline-none focus:outline-none focus-visible:outline-none"
          preload="metadata"
          onLoadStart={onLoadStart}
          crossOrigin="anonymous"
        />
      )}

      {/* Video overlay controls — revealed on hover */}
      {!isVideoLoading && !videoError && videoStreamUrl && (
        <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/20 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100 focus-within:opacity-100">
          {/* Center play/pause */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Button
              variant="ghost"
              size="lg"
              onClick={onTogglePlayPause}
              aria-label={isVideoPlaying ? 'Pause' : 'Play'}
              className="h-16 w-16 rounded-full border border-border bg-background/85 text-foreground shadow-lg backdrop-blur hover:bg-background"
            >
              {isVideoPlaying ? (
                <Pause className="h-8 w-8" />
              ) : (
                <Play className="h-8 w-8 ml-1" />
              )}
            </Button>
          </div>

          {/* Bottom controls bar */}
          <div className="absolute bottom-0 left-0 right-0 space-y-3 p-4">
            {/* Progress bar */}
            <div className="space-y-1.5">
              <Slider
                value={[videoCurrentTime]}
                max={videoDuration || 100}
                step={0.1}
                onValueChange={onVideoSeek}
                className="w-full"
                aria-label="Seek"
              />
              <div className="flex justify-between text-xs tabular-nums text-foreground/80">
                <span>{formatTime(videoCurrentTime)}</span>
                <span>{formatTime(videoDuration)}</span>
              </div>
            </div>

            {/* Control row */}
            <div className="flex items-center justify-between rounded-xl border border-border/70 bg-background/65 px-2 py-1.5 shadow-sm backdrop-blur">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onTogglePlayPause}
                  aria-label={isVideoPlaying ? 'Pause' : 'Play'}
                  className="text-foreground hover:bg-muted"
                >
                  {isVideoPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>

                <div className="flex items-center gap-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onToggleMute}
                    aria-label={isVideoMuted || videoVolume === 0 ? 'Unmute' : 'Mute'}
                    className="text-foreground hover:bg-muted"
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
                    className="w-20"
                    aria-label="Volume"
                  />
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleFullscreen}
                aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                className="text-foreground hover:bg-muted"
              >
                {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
