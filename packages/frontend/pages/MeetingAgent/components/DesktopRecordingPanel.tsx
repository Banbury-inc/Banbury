import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import { 
  Monitor,
  Video,
  VideoOff,
  Square,
  Play,
  AlertCircle,
  CheckCircle,
  Shield,
  Mic,
  Eye,
  RefreshCw,
  Loader2
} from 'lucide-react'
import { useDesktopRecording } from '../../../hooks/useDesktopRecording'
import { 
  handleStartRecording, 
  handleStopRecording,
  getPlatformDisplayName,
  getPlatformIcon,
  formatRecordingDuration
} from '../handlers/desktopRecordingHandlers'
import { useToast } from '../../../components/ui/use-toast'

interface DesktopRecordingPanelProps {
  onRecordingComplete?: () => void
}

export function DesktopRecordingPanel({ onRecordingComplete }: DesktopRecordingPanelProps) {
  const {
    isDesktop,
    isInitialized,
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
      const result = await handleStartRecording(
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
      } else {
        toast({
          title: 'Failed to Start Recording',
          description: result.error || 'Unknown error occurred.',
          variant: 'destructive'
        })
      }
    } finally {
      setIsLoading(false)
    }
  }
  
  async function handleStop() {
    if (!recordingStatus.windowId) return
    
    setIsLoading(true)
    try {
      const result = await handleStopRecording(recordingStatus.windowId, stopRecording)
      
      if (result.success) {
        toast({
          title: 'Recording Stopped',
          description: 'Your recording is being processed and uploaded.'
        })
        onRecordingComplete?.()
      } else {
        toast({
          title: 'Failed to Stop Recording',
          description: result.error || 'Unknown error occurred.',
          variant: 'destructive'
        })
      }
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Monitor className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Desktop Recording</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {isInitialized ? (
              <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                <CheckCircle className="h-3 w-3 mr-1" />
                Ready
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                <AlertCircle className="h-3 w-3 mr-1" />
                Initializing
              </Badge>
            )}
            <Button variant="ghost" size="icon" onClick={refreshStatus} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Error Display */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        
        {/* Permissions Section (macOS only) */}
        {isMac && !allPermissionsGranted && (
          <div className="p-4 bg-muted/50 rounded-lg space-y-3">
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
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 bg-red-500 rounded-full animate-pulse" />
                <span className="font-medium text-red-500">Recording in Progress</span>
              </div>
              <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20 font-mono">
                {recordingDuration}
              </Badge>
            </div>
            {recordingStatus.platform && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{getPlatformIcon(recordingStatus.platform)}</span>
                <span>{getPlatformDisplayName(recordingStatus.platform)}</span>
              </div>
            )}
            <Button 
              variant="destructive" 
              onClick={handleStop} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Square className="h-4 w-4 mr-2" />
              )}
              Stop Recording
            </Button>
          </div>
        )}
        
        {/* Detected Meetings List */}
        {!recordingStatus.isRecording && allPermissionsGranted && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Detected Meetings</span>
              <Badge variant="secondary">{detectedMeetings.length}</Badge>
            </div>
            
            {detectedMeetings.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-border rounded-lg">
                <Video className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  No active meetings detected
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Open a meeting in Zoom, Teams, or Meet to start recording
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {detectedMeetings.map((meeting) => (
                  <div 
                    key={meeting.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{getPlatformIcon(meeting.platform)}</span>
                      <div>
                        <p className="text-sm font-medium truncate max-w-[200px]">
                          {meeting.title || 'Untitled Meeting'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {getPlatformDisplayName(meeting.platform)}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleStart(meeting.id, meeting.platform, meeting.title)}
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
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Not Initialized State */}
        {!isInitialized && !error && (
          <div className="p-6 text-center">
            <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Initializing desktop recording...
            </p>
          </div>
        )}
        
        {/* Info Footer */}
        <div className="pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Desktop recording captures your screen and audio without needing a bot to join the meeting.
            Recordings are automatically transcribed and saved to your account.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
