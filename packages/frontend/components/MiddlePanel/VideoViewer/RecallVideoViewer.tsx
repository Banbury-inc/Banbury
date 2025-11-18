import { Video, AlertCircle, Download, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '../../ui/button';
import { FileSystemItem } from '../../../utils/fileTreeUtils';
import { ApiService } from 'backend/api/apiService';

interface RecallVideoViewerProps {
  file: FileSystemItem;
  userInfo?: {
    username: string;
    email?: string;
  } | null;
}

export function RecallVideoViewer({ file, userInfo }: RecallVideoViewerProps) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  // Check if this is a Recall AI video
  const isRecallVideo = videoUrl && (videoUrl.includes('recall.ai') || videoUrl.includes('recallai'));

  const retryVideoLoad = () => {
    if (isRetrying) return; // Prevent multiple simultaneous retries
    
    console.log('Retrying video load, attempt:', retryCount + 1);
    setRetryCount(prev => prev + 1);
    setError(null);
    setLoading(true);
    setIsRetrying(true);
    
    // For Recall AI videos, get fresh URL from session data
    if (file.s3_url && (file.s3_url.includes('recall.ai') || file.s3_url.includes('recallai'))) {
      console.log('Retry: Getting fresh Recall AI URL from session data...');
      
      // Get the session ID from file metadata or extract from file path
      let sessionId = (file as any).meeting_session_id || (file as any).session_id;
      
      // If not found in metadata, try to extract from file path
      // File path format: meetings/{session_id}/recording.mp4
      if (!sessionId && file.path) {
        const pathParts = file.path.split('/');
        if (pathParts.length >= 3 && pathParts[0] === 'meetings') {
          sessionId = pathParts[1];
          console.log('Retry: Extracted session ID from file path:', sessionId);
        }
      }
      
      if (sessionId) {
        console.log('Retry: Getting fresh Recall AI URL from backend...');
        
        ApiService.MeetingAgent.getMeetingSessions(20, 0)
          .then((result: any) => {
            console.log('RecallVideoViewer Retry: Session response:', result);
            const session = result.sessions.find((session: any) => session.id === sessionId);

            if (session) {
              console.log('RecallVideoViewer Retry: Session found:', session);
              // Use EXACT same logic as MeetingAgent.tsx
              const videoUrl = session.recallBot?.videoUrl || session.recordingUrl;
              
              console.log('RecallVideoViewer Retry: Video URL selection (matching MeetingAgent):', {
                sessionId,
                recallBotVideoUrl: session.recallBot?.videoUrl,
                recordingUrl: session.recordingUrl,
                finalVideoUrl: videoUrl,
                sessionTitle: session.title
              });
              
              setVideoUrl(videoUrl);
              setLoading(false);
              setIsRetrying(false);
            } else {
              console.log('RecallVideoViewer Retry: Session not found, no video available');
              setError('Session not found - no video available');
              setLoading(false);
              setIsRetrying(false);
            }
          })
          .catch((err: any) => {
            console.log('Retry: Session request error:', err);
            setError('Failed to load session data - no video available');
            setLoading(false);
            setIsRetrying(false);
          });
      } else {
        console.log('Retry: No session ID found, no video available');
        setError('No session ID found - no video available');
        setLoading(false);
        setIsRetrying(false);
      }
      return;
    }

    // This should not happen since RecallVideoViewer is only for Recall videos
    console.log('RecallVideoViewer retry called with non-Recall video, showing error');
    setError('This component is only for Recall AI videos');
    setLoading(false);
    setIsRetrying(false);
  };

  useEffect(() => {
    console.log('RecallVideoViewer useEffect called for file:', file.name, 'file_id:', file.file_id);
    console.log('File object:', file);

    // Check if this is a Recall AI video by looking at the S3 URL
    if (file.s3_url && (file.s3_url.includes('recall.ai') || file.s3_url.includes('recallai'))) {
      console.log('This is a Recall AI video, getting fresh URL from session data...');
      
      // Get the session ID from file metadata or extract from file path
      let sessionId = (file as any).meeting_session_id || (file as any).session_id;
      
      // If not found in metadata, try to extract from file path
      // File path format: meetings/{session_id}/recording.mp4
      if (!sessionId && file.path) {
        const pathParts = file.path.split('/');
        if (pathParts.length >= 3 && pathParts[0] === 'meetings') {
          sessionId = pathParts[1];
          console.log('Extracted session ID from file path:', sessionId);
        }
      }
      
      if (sessionId) {
        // For Recall AI videos, get the URL directly from JSON response (not as blob)
        console.log('Getting fresh Recall AI URL from backend...');
        console.log('Session ID:', sessionId);

        ApiService.MeetingAgent.getMeetingSessions(20, 0)
          .then((result: any) => {
            console.log('RecallVideoViewer Session response:', result);
            const session = result.sessions.find((session: any) => session.id === sessionId);

            if (session) {
              console.log('RecallVideoViewer Session found:', session);
              console.log('RecallVideoViewer Full session.recallbot:', session.recallbot);
              
              // Use EXACT same logic as MeetingAgent.tsx
              const videoUrl = session.recallBot?.videoUrl || session.recordingUrl;
              
              console.log('RecallVideoViewer Video URL selection (matching MeetingAgent):', {
                sessionId,
                recallBotVideoUrl: session.recallBot?.videoUrl,
                recordingUrl: session.recordingUrl,
                finalVideoUrl: videoUrl,
                sessionTitle: session.title
              });
              
              // Log additional session data for debugging
              console.log('RecallVideoViewer Additional session data:', {
                hasRecallBot: !!session.recallBot,
                recallBotStatus: session.recallBot?.status,
                recordingStatus: session.recallBot?.recordingStatus,
                recallBotKeys: session.recallBot ? Object.keys(session.recallBot) : 'no recallBot'
              });
              
              setVideoUrl(videoUrl);
              setLoading(false);
            } else {
              console.log('RecallVideoViewer Session not found, no video available');
              setError('Session not found - no video available');
              setLoading(false);
            }
          })
          .catch((err: any) => {
            console.log('Session request error:', err);
            setError('Failed to load session data - no video available');
            setLoading(false);
          });
      } else {
        console.log('No session ID found, no video available');
        setError('No session ID found - no video available');
        setLoading(false);
      }
    } else {
      // This should not happen since RecallVideoViewer is only for Recall videos
      console.log('RecallVideoViewer called with non-Recall video, showing error');
      setError('This component is only for Recall AI videos');
      setLoading(false);
    }
  }, [file]);

  const handleDownload = () => {
    if (videoUrl) {
      const link = document.createElement('a');
      link.href = videoUrl;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-[#27272a]">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading video...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-[#27272a]">
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
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Retrying...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
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

  // Main video display - matches MeetingAgent.tsx exactly
  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Video Section - matches MeetingAgent.tsx styling exactly */}
      <div>
        <h4 className="text-foreground font-medium mb-3 flex items-center gap-2">
          <Video className="h-4 w-4" />
          Recording
        </h4>
        <div className="bg-black rounded-lg p-3 h-80 flex items-center justify-center border border-border">
          {(() => {
            console.log('RecallVideoViewer Rendering video with URL:', {
              videoUrl,
              isRecallVideo
            });
            return (
              <video 
                controls 
                className="w-full rounded max-h-full"
                src={videoUrl || undefined}
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
            );
          })()}
        </div>
      </div>
    </div>
  );
}
