import { AlertCircle, Download, Play, Pause, Volume2, VolumeX, Maximize2, RotateCcw } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { Button } from '../../ui/button';
import { ApiService } from '../../../services/apiService';
import { FileSystemItem } from '../../../utils/fileTreeUtils';

interface VideoViewerProps {
  file: FileSystemItem;
  userInfo?: {
    username: string;
    email?: string;
  } | null;
}

export function VideoViewer({ file, userInfo }: VideoViewerProps) {
  console.log('VideoViewer component mounted with file:', file.name, 'file_id:', file.file_id);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Prevent duplicate loads (e.g., React StrictMode) for the same file
  const lastFetchKeyRef = useRef<string | null>(null);

  useEffect(() => {
    let currentUrl: string | null = null;

    const fetchVideoUrl = async () => {
      console.log('fetchVideoUrl called for file:', file.name, 'file_id:', file.file_id);

      const fetchKey = `${file.file_id}_${file.last_modified}`;
      if (lastFetchKeyRef.current === fetchKey) {
        console.log('Duplicate fetch prevented for key:', fetchKey);
        return; // Prevent duplicate fetches
      }
      lastFetchKeyRef.current = fetchKey;

      try {
        console.log('Starting video download for file_id:', file.file_id);
        setLoading(true);
        setError(null);

        const result = await ApiService.downloadS3File(file.file_id || '', file.name);
        console.log('Video download result:', result);
        
        if (result.success && result.url) {
          console.log('Video URL obtained successfully:', result.url);
          currentUrl = result.url;
          setVideoUrl(currentUrl);
        } else {
          console.log('Failed to get video download URL, result:', result);
          throw new Error('Failed to get video download URL');
        }
      } catch (err) {
        console.error('Error fetching video URL:', err);
        setError(err instanceof Error ? err.message : 'Failed to load video');
      } finally {
        console.log('Video fetch completed, setting loading to false');
        setLoading(false);
      }
    };

    fetchVideoUrl();

    return () => {
      // Cleanup: revoke object URL if it was created
      if (currentUrl && currentUrl.startsWith('blob:')) {
        URL.revokeObjectURL(currentUrl);
      }
    };
  }, [file.file_id, file.last_modified, userInfo?.username]);

  const handleDownload = async () => {
    if (!file.file_id) return;
    
    try {
      // Prefer reusing the existing blob URL to avoid another fetch
      if (videoUrl) {
        const a = document.createElement('a');
        a.href = videoUrl;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return;
      }
      // Fallback to fetching if no URL is available
      const result = await ApiService.downloadS3File(file.file_id, file.name);
      if (result.success && result.url) {
        const a = document.createElement('a');
        a.href = result.url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => window.URL.revokeObjectURL(result.url), 1000);
      }
    } catch (err) {
      console.error('Error downloading video:', err);
    }
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
      if (newVolume === 0) {
        setIsMuted(true);
      } else if (isMuted) {
        setIsMuted(false);
      }
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setIsVideoReady(true);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (videoRef.current && isVideoReady) {
      setIsSeeking(true);
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      // Reset seeking state after a short delay
      setTimeout(() => setIsSeeking(false), 100);
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.requestFullscreen();
      }
    }
  };

  const restart = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      setCurrentTime(0);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-[#27272a]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading video...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-[#27272a]">
        <div className="flex flex-col items-center gap-4 text-center">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Failed to load video</h3>
            <p className="text-muted-foreground">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#27272a]">
      {/* Video display area */}
      <div className="flex-1 flex justify-center overflow-auto bg-[#27272a] p-6 relative">
        {videoUrl ? (
          <div className="relative max-w-full max-h-full">
            <video
              ref={videoRef}
              src={videoUrl}
              className="max-w-full max-h-full object-contain rounded-lg shadow-lg cursor-pointer"
              onClick={togglePlayPause}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onEnded={() => setIsPlaying(false)}
              onSeeking={() => setIsSeeking(true)}
              onSeeked={() => setIsSeeking(false)}
              onError={(e) => {
                console.error('Video error:', e);
                setError('Failed to load video content');
              }}
            />
            
            {/* Video Controls Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 rounded-b-lg">
              <div className="flex flex-col gap-2">
                {/* Progress Bar */}
                <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  value={currentTime}
                  onChange={handleSeek}
                  disabled={!isVideoReady}
                  className={`w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider ${
                    !isVideoReady ? 'opacity-50 cursor-not-allowed' : ''
                  } ${isSeeking ? 'opacity-80' : ''}`}
                  style={{
                    background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(currentTime / (duration || 1)) * 100}%, #4b5563 ${(currentTime / (duration || 1)) * 100}%, #4b5563 100%)`
                  }}
                />
                
                {/* Control Buttons */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={togglePlayPause}
                      className="text-white hover:bg-white/20"
                    >
                      {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={restart}
                      className="text-white hover:bg-white/20"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                    
                    <span className="text-white text-sm">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleMute}
                      className="text-white hover:bg-white/20"
                    >
                      {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    </Button>
                    
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={volume}
                      onChange={handleVolumeChange}
                      className="w-20 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                    />
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDownload}
                      className="text-white hover:bg-white/20"
                      title="Download video"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleFullscreen}
                      className="text-white hover:bg-white/20"
                    >
                      <Maximize2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Video URL not available</p>
          </div>
        )}
      </div>

      {/* Custom slider styles */}
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #ffffff;
          cursor: pointer;
        }
        
        .slider::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #ffffff;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  );
}
