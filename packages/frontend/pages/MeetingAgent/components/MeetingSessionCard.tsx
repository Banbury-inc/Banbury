import { useState } from 'react'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { Progress } from '../../../components/ui/progress'
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Download, 
  FileText, 
  Users, 
  Clock, 
  Play,
  Pause,
  Square,
  MoreVertical,
  Eye,
  Trash2,
  Share2,
  Upload,
  Cloud,
  Monitor
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu'
import { MeetingSession } from '../../../types/meeting-types'
import { ApiService } from '../../../../backend/api/apiService'
import { useToast } from '../../../components/ui/use-toast'
import { RecordingUploadDialog } from './RecordingUploadDialog'
import { VideoPlayerDialog } from './VideoPlayerDialog'

interface MeetingSessionCardProps {
  session: MeetingSession
  onLeave?: () => void
  onRefresh?: () => void
}

export function MeetingSessionCard({ session, onLeave, onRefresh }: MeetingSessionCardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [isVideoPlayerOpen, setIsVideoPlayerOpen] = useState(false)
  const { toast } = useToast()

  // Calculate duration
  const getDuration = () => {
    if (session.duration) {
      return Math.round(session.duration / 60) // Convert to minutes
    }
    
    if (session.endTime) {
      const duration = new Date(session.endTime).getTime() - new Date(session.startTime).getTime()
      return Math.round(duration / (1000 * 60)) // Convert to minutes
    }
    
    if (session.status === 'active' || session.status === 'recording') {
      const duration = Date.now() - new Date(session.startTime).getTime()
      return Math.round(duration / (1000 * 60)) // Convert to minutes
    }
    
    return 0
  }

  // Get status color
  const getStatusColor = () => {
    switch (session.status) {
      case 'active':
        return 'bg-green-500'
      case 'recording':
        return 'bg-red-500 animate-pulse'  // Red and pulsing for recording
      case 'completed':
        return 'bg-blue-500'
      case 'failed':
        return 'bg-red-500'
      case 'joining':
      case 'transcribing':
      case 'processing':
        return 'bg-yellow-500'
      default:
        return 'bg-gray-500'
    }
  }

  // Get status variant
  const getStatusVariant = () => {
    switch (session.status) {
      case 'active':
        return 'default'
      case 'recording':
        return 'destructive'  // Red for recording
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

  // Handle download recording
  const handleDownloadRecording = async () => {
    if (!session.recordingUrl) return
    
    try {
      setIsLoading(true)
      const result = await ApiService.MeetingAgent.downloadRecording(session.id)
      
      if (result.success && result.downloadUrl) {
        // Create download link
        const link = document.createElement('a')
        link.href = result.downloadUrl
        link.download = `${session.title || 'meeting'}_recording.mp4`
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
  }

  // Handle download transcription
  const handleDownloadTranscription = async () => {
    if (!session.transcriptionText) return
    
    try {
      const transcriptionData = await ApiService.MeetingAgent.getTranscription(session.id)
      
      // Create downloadable text file
      const content = `Meeting: ${session.title || 'Untitled Meeting'}
Date: ${new Date(session.startTime).toLocaleString()}
Platform: ${session.platform.name}
Duration: ${getDuration()} minutes

FULL TRANSCRIPTION:
${transcriptionData.fullText}

SEGMENTED TRANSCRIPTION:
${transcriptionData.segments.map(segment => 
  `[${Math.floor(segment.startTime / 60)}:${String(Math.floor(segment.startTime % 60)).padStart(2, '0')}] ${segment.speakerName}: ${segment.text}`
).join('\n')}
`
      
      const blob = new Blob([content], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `${session.title || 'meeting'}_transcription.txt`
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
    }
  }

  // Handle generate summary
  const handleGenerateSummary = async () => {
    try {
      setIsLoading(true)
      const result = await ApiService.MeetingAgent.generateMeetingSummary(session.id)
      
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Meeting summary generated successfully'
        })
        onRefresh?.()
      } else {
        throw new Error(result.message)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate summary'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle delete session
  const handleDeleteSession = async () => {
    if (!confirm('Are you sure you want to delete this meeting session? This action cannot be undone.')) {
      return
    }
    
    try {
      setIsLoading(true)
      const result = await ApiService.MeetingAgent.deleteMeetingSession(session.id)
      
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Meeting session deleted'
        })
        onRefresh?.()
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
  }

  const duration = getDuration()

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${getStatusColor()}`} />
            <div>
              <CardTitle className="text-lg">
                {session.title || 'Untitled Meeting'}
              </CardTitle>
              <CardDescription>
                {session.platform.name} • {new Date(session.startTime).toLocaleString()}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={getStatusVariant()}>
              {session.status}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => window.open(session.meetingUrl, '_blank')}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Meeting URL
                </DropdownMenuItem>
                {/* Watch Recording option for completed sessions with recordings */}
                {session.status === 'completed' && session.recordingUrl && (
                  <DropdownMenuItem onClick={() => setIsVideoPlayerOpen(true)}>
                    <Monitor className="h-4 w-4 mr-2" />
                    Watch Recording
                  </DropdownMenuItem>
                )}
                {/* Upload Recording option for sessions without recordings */}
                {(session.status === 'active' || session.status === 'completed') && !session.recordingUrl && (
                  <DropdownMenuItem onClick={() => setIsUploadDialogOpen(true)}>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Recording
                  </DropdownMenuItem>
                )}
                {session.status === 'completed' && (
                  <DropdownMenuItem onClick={handleGenerateSummary} disabled={isLoading}>
                    <FileText className="h-4 w-4 mr-2" />
                    Generate Summary
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => navigator.clipboard.writeText(session.meetingUrl)}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Copy URL
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleDeleteSession} 
                  disabled={isLoading}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Session
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Session Info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{duration} min</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>{session.participants.length} participants</span>
          </div>
          <div className="flex items-center gap-2">
            {session.metadata.recordingEnabled ? (
              <Video className="h-4 w-4 text-green-500" />
            ) : (
              <VideoOff className="h-4 w-4 text-muted-foreground" />
            )}
            <span>Recording {session.metadata.recordingEnabled ? 'On' : 'Off'}</span>
          </div>
          <div className="flex items-center gap-2">
            {session.metadata.transcriptionEnabled ? (
              <Mic className="h-4 w-4 text-green-500" />
            ) : (
              <MicOff className="h-4 w-4 text-muted-foreground" />
            )}
            <span>Transcription {session.metadata.transcriptionEnabled ? 'On' : 'Off'}</span>
          </div>
        </div>

        {/* Progress bar for active sessions */}
        {(session.status === 'active' || session.status === 'recording') && session.metadata.maxDuration && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{duration} / {session.metadata.maxDuration} min</span>
            </div>
            <Progress 
              value={(duration / session.metadata.maxDuration) * 100} 
              className="h-2"
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2">
          {(session.status === 'active' || session.status === 'recording') && onLeave && (
            <Button size="sm" variant="destructive" onClick={onLeave}>
              <Square className="h-3 w-3 mr-1" />
              {session.status === 'recording' ? 'Stop Recording & Leave' : 'Leave Meeting'}
            </Button>
          )}

          {/* Upload Recording Button - show for active and completed sessions without recordings */}
          {(session.status === 'active' || session.status === 'completed') && !session.recordingUrl && (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => setIsUploadDialogOpen(true)}
              className="text-white border-zinc-600 hover:bg-zinc-700"
            >
              <Upload className="h-3 w-3 mr-1" />
              Upload Recording
            </Button>
          )}

          {session.status === 'completed' && (
            <>
              {session.recordingUrl && (
                <>
                  <Button 
                    size="sm" 
                    variant="default" 
                    onClick={() => setIsVideoPlayerOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Play className="h-3 w-3 mr-1" />
                    Watch
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={handleDownloadRecording}
                    disabled={isLoading}
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Download
                  </Button>
                </>
              )}
              
              {session.transcriptionText && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={handleDownloadTranscription}
                  disabled={isLoading}
                >
                  <FileText className="h-3 w-3 mr-1" />
                  Transcription
                </Button>
              )}
            </>
          )}

          {session.status === 'recording' && (
            <Badge variant="destructive" className="animate-pulse bg-red-600">
              <div className="w-2 h-2 bg-white rounded-full mr-1"></div>
              Recording...
            </Badge>
          )}

          {(session.status === 'joining' || session.status === 'transcribing' || session.status === 'processing') && (
            <Badge variant="outline" className="animate-pulse">
              {session.status === 'joining' ? 'Joining...' : 
               session.status === 'processing' ? 'Processing...' : 'Transcribing...'}
            </Badge>
          )}
        </div>

        {/* Participants List (if expanded) */}
        {session.participants.length > 0 && (
          <div className="pt-2 border-t">
            <p className="text-sm font-medium mb-2">Participants</p>
            <div className="space-y-1">
              {session.participants.slice(0, 3).map((participant, index) => (
                <div key={participant.id || index} className="flex items-center justify-between text-sm">
                  <span>
                    {typeof participant === 'string' 
                      ? participant 
                      : participant.name || participant.email || (participant as any).displayName || (participant as any).userName || participant.id || 'Unknown'
                    }
                  </span>
                  <Badge variant="outline" size="sm">
                    {typeof participant === 'object' && participant.role ? participant.role : 'participant'}
                  </Badge>
                </div>
              ))}
              {session.participants.length > 3 && (
                <p className="text-xs text-muted-foreground">
                  +{session.participants.length - 3} more participants
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
      
      {/* Recording Upload Dialog */}
      <RecordingUploadDialog
        open={isUploadDialogOpen}
        onOpenChange={setIsUploadDialogOpen}
        sessionId={session.id}
        sessionTitle={session.title}
        onUploadComplete={() => {
          // Refresh the session data to show the new recording
          onRefresh?.()
          toast({
            title: 'Recording Uploaded',
            description: 'Your meeting recording has been saved successfully'
          })
        }}
      />

      {/* Video Player Dialog */}
      {session.recordingUrl && (
        <VideoPlayerDialog
          open={isVideoPlayerOpen}
          onOpenChange={setIsVideoPlayerOpen}
          session={session}
          videoUrl={session.recordingUrl}
        />
      )}
    </Card>
  )
}
