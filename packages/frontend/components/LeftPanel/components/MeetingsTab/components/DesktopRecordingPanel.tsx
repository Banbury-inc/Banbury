import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Badge } from '../../../../common/ui/badge'
import { Button } from '../../../../common/ui/button'
import { 
  Monitor,
  Video,
  Square,
  Play,
  AlertCircle,
  CheckCircle,
  Shield,
  Mic,
  Eye,
  Loader2
} from 'lucide-react'
import { useDesktopRecording } from '../../../../../hooks/useDesktopRecording'
import { 
  handleStartDesktopSDKRecording, 
  handleStopDesktopSDKRecording,
  getPlatformDisplayName,
  formatRecordingDuration
} from '../../../../../pages/MeetingAgent/handlers/desktopRecordingHandlers'
import { useToast } from '../../../../common/ui/use-toast'
import zoomLogo from '../../../../../assets/images/zoom-fondo-blanco-vertical-seeklogo.png'
import googleMeetLogo from '../../../../../assets/images/7089160_google_meet_icon.png'

interface RecordingStartedData {
  sessionId: string
  windowId: string
  platform: string
  meetingTitle: string
}

interface DesktopRecordingPanelProps {
  onRecordingComplete?: () => void
  onRecordingStarted?: (data: RecordingStartedData) => void
}

function PlatformLogo({ platform }: { platform: string }) {
  const platformLower = platform.toLowerCase()
  
  if (platformLower === 'zoom') {
    return (
      <Image
        src={zoomLogo}
        alt="Zoom"
        width={24}
        height={24}
        className="object-contain"
      />
    )
  }
  
  if (platformLower === 'meet') {
    return (
      <Image
        src={googleMeetLogo}
        alt="Google Meet"
        width={24}
        height={24}
        className="object-contain"
      />
    )
  }
  
  if (platformLower === 'teams') {
    // Using a simple styled div for Teams since we don't have the logo file
    return (
      <div className="w-6 h-6 flex items-center justify-center bg-[#464EB8] rounded">
        <span className="text-white text-xs font-bold">MS</span>
      </div>
    )
  }
  
  // Fallback
  return <Video className="h-6 w-6 text-muted-foreground" />
}

export function DesktopRecordingPanel({ onRecordingComplete, onRecordingStarted }: DesktopRecordingPanelProps) {
  const {
    isDesktop,
    isInitialized,
    isPlatformSupported,
    permissions,
    recordingStatus,
    detectedMeetings,
    error,
    requestPermissions,
    startRecording,
    stopRecording,
    refreshStatus
  } = useDesktopRecording()
  
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState('00:00')
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  
  // Update recording duration every second when recording
  useEffect(() => {
    if (!recordingStatus.isRecording || !recordingStatus.startTime) {
      setRecordingDuration('00:00')
      return
    }
    
    const updateDuration = () => {
      setRecordingDuration(formatRecordingDuration(recordingStatus.startTime))
    }
    
    updateDuration()
    const interval = setInterval(updateDuration, 1000)
    
    return () => clearInterval(interval)
  }, [recordingStatus.isRecording, recordingStatus.startTime])
  
  // Don't render if not in desktop environment
  if (!isDesktop) return null
  
  const allPermissionsGranted = permissions.accessibility && permissions.microphone && permissions.screenCapture
  const isMac = typeof window !== 'undefined' && window.desktopApp?.getPlatform() === 'darwin'
  
  async function handleRequestPermissions() {
    setIsLoading(true)
    try {
      await requestPermissions()
      toast({
        title: 'Permissions Requested',
        description: 'Please grant the required permissions in System Settings.'
      })
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to request permissions.',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  async function handleStart(meetingId: string, platform: string, title: string) {
    setIsLoading(true)
    try {
      const result = await handleStartDesktopSDKRecording(
        {
          windowId: meetingId,
          platform,
          meetingTitle: title,
          transcriptionEnabled: true
        },
        startRecording
      )
      
      if (result.success) {
        toast({
          title: 'Recording Started',
          description: `Recording ${getPlatformDisplayName(platform)} meeting.`
        })
        
        // Store the session ID for when we stop recording
        if (result.sessionId) {
          setCurrentSessionId(result.sessionId)
        }
        
        // Call the onRecordingStarted callback with session data
        if (onRecordingStarted) {
          if (result.sessionId) {
            onRecordingStarted({
              sessionId: result.sessionId,
              windowId: meetingId,
              platform,
              meetingTitle: title
            })
          } else {
            // eslint-disable-next-line no-console
            console.warn('[DesktopRecordingPanel] Recording started but no sessionId returned from backend')
            // Still call the callback with a temporary ID for UI purposes
            const tempSessionId = `temp_${Date.now()}`
            onRecordingStarted({
              sessionId: tempSessionId,
              windowId: meetingId,
              platform,
              meetingTitle: title
            })
          }
        }
      } else {
        console.error('[DesktopRecordingPanel] Failed to start recording:', result.error)
        toast({
          title: 'Failed to Start Recording',
          description: result.error || 'Unknown error occurred.',
          variant: 'destructive'
        })
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[DesktopRecordingPanel] Exception starting recording:', error)
      toast({
        title: 'Error Starting Recording',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  async function handleStop() {
    // Even if windowId is undefined, try to stop - the backend will use the stored status
    if (!recordingStatus.isRecording) {
      // eslint-disable-next-line no-console
      console.warn('[DesktopRecordingPanel] Not currently recording')
      return
    }
    
    setIsLoading(true)
    try {
      // Pass the windowId even if it's undefined - the backend will fall back to stored status
      const result = await handleStopDesktopSDKRecording(
        recordingStatus.windowId || '', 
        stopRecording,
        currentSessionId || undefined  // Pass sessionId to end the session on backend
      )
      
      if (result.success) {
        toast({
          title: 'Recording Stopped',
          description: 'Your recording is being processed and uploaded.'
        })
        setCurrentSessionId(null)  // Clear session ID
        onRecordingComplete?.()
      } else {
        console.error('[DesktopRecordingPanel] Failed to stop recording:', result.error)
        toast({
          title: 'Failed to Stop Recording',
          description: result.error || 'Unknown error occurred.',
          variant: 'destructive'
        })
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[DesktopRecordingPanel] Exception stopping recording:', error)
      toast({
        title: 'Error Stopping Recording',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <div>
        {/* Platform Not Supported Warning */}
        {!isPlatformSupported && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-500 font-medium">
              <AlertCircle className="h-4 w-4" />
              <span>Platform Not Supported</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {error || 'Desktop meeting detection is not supported on this platform.'}
            </p>
            <p className="text-sm text-muted-foreground">
              <strong>Supported platforms:</strong> macOS 13.0+ (Apple Silicon) and Windows 10+ (64-bit).
            </p>
            <p className="text-sm text-muted-foreground">
              You can still use the <strong>&quot;Join Meeting&quot;</strong> button to send a bot to record your meetings via meeting URL.
            </p>
          </div>
        )}
        
        {/* Error Display */}
        {error && isPlatformSupported && (
          <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        
        {/* Permissions Section (macOS only) */}
        {isMac && !allPermissionsGranted && (
          <div className="bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Shield className="h-4 w-4" />
              <span>Permissions Required</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Desktop recording requires the following permissions on macOS:
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge 
                variant="outline" 
                className={permissions.accessibility ? 'bg-green-500/10 text-green-500' : 'bg-muted'}
              >
                <Eye className="h-3 w-3 mr-1" />
                Accessibility
                {permissions.accessibility && <CheckCircle className="h-3 w-3 ml-1" />}
              </Badge>
              <Badge 
                variant="outline" 
                className={permissions.microphone ? 'bg-green-500/10 text-green-500' : 'bg-muted'}
              >
                <Mic className="h-3 w-3 mr-1" />
                Microphone
                {permissions.microphone && <CheckCircle className="h-3 w-3 ml-1" />}
              </Badge>
              <Badge 
                variant="outline" 
                className={permissions.screenCapture ? 'bg-green-500/10 text-green-500' : 'bg-muted'}
              >
                <Monitor className="h-3 w-3 mr-1" />
                Screen Recording
                {permissions.screenCapture && <CheckCircle className="h-3 w-3 ml-1" />}
              </Badge>
            </div>
            <Button 
              onClick={handleRequestPermissions} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Shield className="h-4 w-4 mr-2" />
              )}
              Grant Permissions
            </Button>
          </div>
        )}
        
        {/* Active Recording Display */}
        {recordingStatus.isRecording && (
          <div className="flex items-center justify-between gap-2 rounded-lg border border-destructive/20 bg-destructive/10 px-2 py-1.5">
            <div className="flex min-w-0 items-center gap-2">
              <div className="h-2 w-2 shrink-0 rounded-full bg-destructive animate-pulse" />
              <span className="truncate text-xs font-medium text-destructive">Recording in progress</span>
              <Badge variant="outline" className="h-5 border-destructive/20 bg-background/60 px-1.5 font-mono text-[11px] text-destructive">
                {recordingDuration}
              </Badge>
            </div>
            <Button 
              variant="destructive" 
              size="xs"
              onClick={handleStop} 
              disabled={isLoading}
              aria-label="Stop recording"
              className="h-7 shrink-0 px-2 text-xs"
            >
              {isLoading ? (
                <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Square className="mr-1 h-3.5 w-3.5" />
              )}
              Stop
            </Button>
          </div>
        )}
        
        {/* Detected Meetings List */}
        {!recordingStatus.isRecording && allPermissionsGranted && isPlatformSupported && (
          <div className="">
            
            {detectedMeetings.length === 0 ? (
              <div className="text-center">
                <Video className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  No active meetings detected
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Open a meeting in Zoom, Teams, or Meet to start recording
                </p>
              </div>
            ) : (
              <div className="">
                {(() => {
                  // Only show the most recent meeting (last in array, as it's the most recently detected)
                  const mostRecentMeeting = detectedMeetings[detectedMeetings.length - 1]
                  return (
                    <div 
                      key={mostRecentMeeting.id}
                      className="flex items-center justify-between bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="text-sm font-medium truncate max-w-[200px]">
                            {mostRecentMeeting.title || 'Untitled Meeting'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {getPlatformDisplayName(mostRecentMeeting.platform)}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="xs"
                        onClick={() => handleStart(mostRecentMeeting.id, mostRecentMeeting.platform, mostRecentMeeting.title)}
                        disabled={isLoading || recordingStatus.isRecording}
                      >
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Play className="h-4 w-4 mr-1" />
                            Record
                          </>
                        )}
                      </Button>
                    </div>
                  )
                })()}
              </div>
            )}
          </div>
        )}
        
        {/* Not Initialized State */}
        {!isInitialized && !error && (
          <div className="text-center">
            <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Initializing desktop recording...
            </p>
          </div>
        )}
    </div>
  )
}
