import { AlertCircle, Download, Play, Pause, Volume2, VolumeX, Maximize2, RotateCcw } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { Button } from '../../ui/button';
import { ApiService } from '../../../../backend/api/apiService';
import { FileSystemItem } from '../../../utils/fileTreeUtils';
import { CONFIG } from '../../../config/config';
import { RecallVideoViewer } from './RecallVideoViewer';

interface VideoViewerProps {
  file: FileSystemItem;
  userInfo?: {
    username: string;
    email?: string;
  } | null;
}

export function VideoViewer({ file, userInfo }: VideoViewerProps) {
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
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Check if this is a Recall AI video
  const isRecallVideo = file.s3_url && (file.s3_url.includes('recall.ai') || file.s3_url.includes('recallai'));

  const retryVideoLoad = () => {
    if (isRetrying) return; // Prevent multiple simultaneous retries
    
    console.log('Retrying video load, attempt:', retryCount + 1);
    setRetryCount(prev => prev + 1);
    setError(null);
    setLoading(true);
    setIsRetrying(true);

    const isDriveFile = file.path?.startsWith('drive://');

    // For regular videos, retry the download
    const fetchPromise = isDriveFile
      ? ApiService.Drive.getFileBlob(file.file_id || '').then(blob => {
          const url = window.URL.createObjectURL(blob);
          return { success: true, url };
        })
      : ApiService.downloadFromS3(file.file_id || '', file.name);

    fetchPromise
      .then(result => {
        if (result.success && result.url) {
          setVideoUrl(result.url);
        } else {
          throw new Error('Failed to get video download URL');
        }
      })
      .catch(err => {
        console.error('Error in retry:', err);
        setError(err instanceof Error ? err.message : 'Failed to load video');
      })
      .finally(() => {
        setLoading(false);
        setIsRetrying(false);
      });
  };

  useEffect(() => {
    console.log('VideoViewer useEffect called for file:', file.name, 'file_id:', file.file_id);
    console.log('File object:', file);

    setLoading(true);
    setError(null);

    const isDriveFile = file.path?.startsWith('drive://');

    // For regular videos, use the download endpoint
    const fetchRegularVideo = async () => {
      try {
        console.log('Starting video download for file_id:', file.file_id);
        
        if (isDriveFile) {
          // Handle Google Drive video
          const blob = await ApiService.Drive.getFileBlob(file.file_id || '');
          const url = window.URL.createObjectURL(blob);
          console.log('Drive video URL obtained successfully:', url);
          setVideoUrl(url);
        } else {
          // Handle local/S3 video
          const result = await ApiService.downloadFromS3(file.file_id || '', file.name);
          console.log('Video download result:', result);
          
          if (result.success && result.url) {
            console.log('Video URL obtained successfully:', result.url);
            setVideoUrl(result.url);
          } else {
            console.log('Failed to get video download URL, result:', result);
            throw new Error('Failed to get video download URL');
          }
        }
      } catch (err) {
        console.error('Error fetching video URL:', err);
        setError(err instanceof Error ? err.message : 'Failed to load video');
      } finally {
        setLoading(false);
      }
    };

    fetchRegularVideo();
  }, [file.file_id, file.name, file.s3_url, file.path]);

  // If this is a Recall video, use the specialized component
  if (isRecallVideo) {
    return <RecallVideoViewer file={file} userInfo={userInfo} />;
  }

  const handleDownload = () => {
    // For regular videos, use the existing videoUrl or fetch if needed
    if (videoUrl) {
      const a = document.createElement('a');
      a.href = videoUrl;
      a.download = file.name;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }

    // Fallback: fetch the URL
    ApiService.downloadFromS3(file.file_id || '', file.name)
      .then(result => {
        if (result.success && result.url) {
          const a = document.createElement('a');
          a.href = result.url;
          a.download = file.name;
          a.target = '_blank';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          // Only revoke blob URLs, not direct URLs
          if (result.url.startsWith('blob:')) {
            setTimeout(() => window.URL.revokeObjectURL(result.url), 1000);
          }
        }
      })
      .catch(err => {
        console.error('Error downloading video:', err);
      });
  };

  // Video control functions for regular videos
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
      <div className="flex items-center justify-center h-full bg-white dark:bg-zinc-900">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading video...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-white dark:bg-zinc-900">
        <div className="flex flex-col items-center gap-4 text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Failed to load video</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            
            {/* Retry button */}
            {retryCount < 3 && (
              <div className="flex flex-col gap-2 mb-4">
                <Button
                  onClick={retryVideoLoad}
                  variant="outline"
                  className="text-foreground border-foreground hover:bg-foreground hover:text-background"
                  disabled={isRetrying}
                >
                  {isRetrying ? (
                    <>
                      <RotateCcw className="h-4 w-4 mr-2 animate-spin" />
                      Retrying...
                    </>
                  ) : (
                    <>
                      <RotateCcw className="h-4 w-4 mr-2" />
                      {isRecallVideo ? 'Retry with Fresh URL' : 'Retry Loading'}
                    </>
                  )}
                </Button>
                <p className="text-sm text-muted-foreground">
                  Attempt {retryCount + 1} of 3
                </p>
              </div>
            )}
            
            {/* Download button as fallback */}
            <Button
              onClick={handleDownload}
              variant="secondary"
              className="text-foreground bg-secondary hover:bg-secondary/80"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Video
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-zinc-900">
      {/* Video display area */}
      <div className="flex-1 flex justify-center overflow-auto bg-white dark:bg-zinc-900 p-6 relative">
        {videoUrl ? (
          <div className="w-full h-full flex items-center justify-center">
            {isRecallVideo ? (
              // Simplified display for Recall AI videos (like MeetingAgent)
              <video 
                controls 
                className="w-full rounded max-h-full"
                src={videoUrl}
                crossOrigin="anonymous"
                preload="metadata"
                onLoadStart={() => console.log('Video load started for URL:', videoUrl?.substring(0, 100) + '...')}
                onLoadedMetadata={() => console.log('Video metadata loaded successfully')}
                onCanPlay={() => console.log('Video can start playing')}
                onError={(e) => {
                  console.error('Video error:', e);
                  const videoElement = e.target as HTMLVideoElement;
                  const error = videoElement.error;
                  let errorMessage = 'Failed to load video content';
                  
                  if (error) {
                    console.error('Video error details:', {
                      code: error.code,
                      message: error.message,
                      networkState: videoElement.networkState,
                      readyState: videoElement.readyState,
                      src: videoElement.src
                    });
                    
                    switch (error.code) {
                      case MediaError.MEDIA_ERR_ABORTED:
                        errorMessage = 'Video loading was aborted';
                        break;
                      case MediaError.MEDIA_ERR_NETWORK:
                        errorMessage = 'Network error while loading video - this may be a CORS issue or the URL is not accessible';
                        break;
                      case MediaError.MEDIA_ERR_DECODE:
                        errorMessage = 'Video decoding error - the video format may not be supported';
                        break;
                      case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
                        errorMessage = 'Video format not supported or CORS issue - the video URL may be invalid or blocked';
                        break;
                      default:
                        errorMessage = `Video error: ${error.message || 'Unknown error'}`;
                    }
                  }
                  
                  // For Recall AI URLs, provide more specific error information
                  if (videoUrl && (videoUrl.includes('recall.ai') || videoUrl.includes('recallai'))) {
                    errorMessage = `Recall AI video error: ${errorMessage}. The presigned URL may have expired or there may be a CORS issue. URL: ${videoUrl.substring(0, 100)}...`;
                  }
                  
                  setError(errorMessage);
                }}
              >
                Your browser does not support the video tag.
              </video>
            ) : (
              // Full-featured video player for regular videos
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
                    const videoElement = e.target as HTMLVideoElement;
                    const error = videoElement.error;
                    let errorMessage = 'Failed to load video content';
                    
                    if (error) {
                      switch (error.code) {
                        case MediaError.MEDIA_ERR_ABORTED:
                          errorMessage = 'Video loading was aborted';
                          break;
                        case MediaError.MEDIA_ERR_NETWORK:
                          errorMessage = 'Network error while loading video';
                          break;
                        case MediaError.MEDIA_ERR_DECODE:
                          errorMessage = 'Video decoding error';
                          break;
                        case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
                          errorMessage = 'Video format not supported or CORS issue';
                          break;
                        default:
                          errorMessage = `Video error: ${error.message || 'Unknown error'}`;
                      }
                    }
                    
                    setError(errorMessage);
                  }}
                  crossOrigin="anonymous"
                  controls={false}
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
            )}
          </div>
        ) : (
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Video URL not available</p>
          </div>
        )}
      </div>

      {/* Custom slider styles for regular videos */}
      {!isRecallVideo && (
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
      )}
    </div>
  );
}
