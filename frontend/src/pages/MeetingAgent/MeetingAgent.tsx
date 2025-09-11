import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/router'
import { Button } from '../../components/ui/button'
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from '../../components/ui/tooltip'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Settings, 
  Plus, 
  Calendar,
  Download,
  FileText,
  Users,
  Clock,
  AlertCircle,
  CheckCircle,
  Activity,
  Play,
  ChevronDown,
  ChevronRight,
  Square,
  RefreshCw,
  Trash2
} from 'lucide-react'
import { MeetingJoinDialog } from './components/MeetingJoinDialog'
import { MeetingSessionCard } from './components/MeetingSessionCard'
import { MeetingAgentSettings } from './components/MeetingAgentSettings'
import { AgentStatusCard } from './components/AgentStatusCard'
import { VideoPlayerDialog } from './components/VideoPlayerDialog'
import { RecallBotCard } from './components/RecallBotCard'
import { TranscriptionDialog } from './components/TranscriptionDialog'
import { MeetingAgentService } from '../../services/meetingAgentService'
import { MeetingSession, MeetingAgentStatus } from '../../types/meeting-types'
import { useToast } from '../../components/ui/use-toast'
import { NavSidebar } from '../../components/nav-sidebar'

export default function MeetingAgent() {
  console.log('MeetingAgent component rendered at:', new Date().toISOString())
  
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [sessions, setSessions] = useState<MeetingSession[]>([])
  const [agentStatus, setAgentStatus] = useState<MeetingAgentStatus | null>(null)
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [videoPlayerSession, setVideoPlayerSession] = useState<MeetingSession | null>(null)
  const [transcriptionSession, setTranscriptionSession] = useState<MeetingSession | null>(null)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [selectedSessions, setSelectedSessions] = useState<Set<string>>(new Set())
  const [transcriptData, setTranscriptData] = useState<Record<string, {
    segments: any[]
    fullText: string
    isComplete: boolean
    processingStatus: string
    isLoading: boolean
    error: string | null
  }>>({})
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { toast } = useToast()
  const hasInitialLoad = useRef(false)

  // Skeleton component for table rows
  const TableSkeleton = () => (
    <>
      {Array.from({ length: 20 }).map((_, index) => (
        <tr key={index} className="border-b border-zinc-800">
          <td className="py-4 px-4 w-12">
            <div className="h-4 w-4 bg-zinc-700 rounded animate-pulse"></div>
          </td>
          <td className="py-4 px-4 w-12">
            <div className="h-4 w-4 bg-zinc-700 rounded animate-pulse"></div>
          </td>
          <td className="py-4 px-4">
            <div className="h-4 bg-zinc-700 rounded animate-pulse w-3/4"></div>
          </td>
          <td className="py-4 px-4">
            <div className="h-4 bg-zinc-700 rounded animate-pulse w-1/4"></div>
          </td>
          <td className="py-4 px-4">
            <div className="h-6 bg-zinc-700 rounded-full animate-pulse w-20"></div>
          </td>
          <td className="py-4 px-4">
            <div className="h-4 bg-zinc-700 rounded animate-pulse w-1/3"></div>
          </td>
          <td className="py-4 px-4">
            <div className="h-4 bg-zinc-700 rounded animate-pulse w-1/2"></div>
          </td>
          <td className="py-4 px-4">
            <div className="h-4 bg-zinc-700 rounded animate-pulse w-1/4"></div>
          </td>
        </tr>
      ))}
    </>
  )

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    router.push('/login')
  }

  // Toggle row expansion
  const toggleRowExpansion = (sessionId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev)
      if (newSet.has(sessionId)) {
        newSet.delete(sessionId)
      } else {
        newSet.add(sessionId)
        // Fetch transcript when expanding if not already loaded
        if (!transcriptData[sessionId]) {
          fetchTranscript(sessionId)
        }
      }
      return newSet
    })
  }

  // Fetch transcript for a session
  const fetchTranscript = async (sessionId: string) => {
    // Set loading state
    setTranscriptData(prev => ({
      ...prev,
      [sessionId]: {
        segments: [],
        fullText: '',
        isComplete: false,
        processingStatus: '',
        isLoading: true,
        error: null
      }
    }))

    try {
      const transcript = await MeetingAgentService.getTranscription(sessionId)
      setTranscriptData(prev => ({
        ...prev,
        [sessionId]: {
          ...transcript,
          isLoading: false,
          error: null
        }
      }))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch transcript'
      setTranscriptData(prev => ({
        ...prev,
        [sessionId]: {
          segments: [],
          fullText: '',
          isComplete: false,
          processingStatus: '',
          isLoading: false,
          error: errorMessage
        }
      }))
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      })
    }
  }

  // Handle session selection
  const handleSessionSelect = (sessionId: string) => {
    setSelectedSessions(prev => {
      const newSet = new Set(prev)
      if (newSet.has(sessionId)) {
        newSet.delete(sessionId)
      } else {
        newSet.add(sessionId)
      }
      return newSet
    })
  }

  // Handle select all
  const handleSelectAll = () => {
    if (selectedSessions.size === sessions.length) {
      setSelectedSessions(new Set())
    } else {
      setSelectedSessions(new Set(sessions.map(session => session.id)))
    }
  }

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedSessions.size === 0) return

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedSessions.size} meeting session(s)? This action cannot be undone.`
    )

    if (!confirmed) return

    try {
      const deletePromises = Array.from(selectedSessions).map(sessionId =>
        MeetingAgentService.deleteMeetingSession(sessionId)
      )

      await Promise.all(deletePromises)


      setSelectedSessions(new Set())
      loadData() // Refresh data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete meeting sessions'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      })
    }
  }


  // Load initial data
  const loadData = useCallback(async () => {
    console.log('loadData called at:', new Date().toISOString())
    try {
      setIsLoading(true)
      setError(null)

      console.log('Making API calls...')
      const [statusResult, sessionsResult] = await Promise.all([
        MeetingAgentService.getAgentStatus(),
        MeetingAgentService.getMeetingSessions(20, 0)
      ])
      console.log('API calls completed')

      setAgentStatus(statusResult)
      setSessions(sessionsResult.sessions)
      
      // Debug: Log session data to see participants
      console.log('Sessions loaded:', sessionsResult.sessions)
      sessionsResult.sessions.forEach((session, index) => {
        console.log(`Session ${index}:`, {
          id: session.id,
          title: session.title,
          participants: session.participants,
          participantsLength: session.participants?.length
        })
        
        // Debug participant data structure
        if (session.participants && session.participants.length > 0) {
          console.log(`Session ${index} participants detail:`, session.participants)
          session.participants.forEach((participant, pIndex) => {
            console.log(`  Participant ${pIndex}:`, {
              id: participant.id,
              name: participant.name,
              email: participant.email,
              role: participant.role,
              joinTime: participant.joinTime,
              leaveTime: participant.leaveTime,
              duration: participant.duration,
              fullObject: participant
            })
          })
        } else {
          console.log(`Session ${index} has no participants or empty array`)
        }
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load meeting agent data'
      setError(errorMessage)
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Refresh only sessions data
  const refreshSessions = useCallback(async () => {
    try {
      setIsRefreshing(true)
      const sessionsResult = await MeetingAgentService.getMeetingSessions(20, 0)
      setSessions(sessionsResult.sessions)
      
      // Debug: Log session data to see participants
      console.log('Sessions refreshed:', sessionsResult.sessions)
      sessionsResult.sessions.forEach((session, index) => {
        console.log(`Session ${index}:`, {
          id: session.id,
          title: session.title,
          participants: session.participants,
          participantsLength: session.participants?.length
        })
        
        // Debug participant data structure
        if (session.participants && session.participants.length > 0) {
          console.log(`Session ${index} participants detail:`, session.participants)
          session.participants.forEach((participant, pIndex) => {
            console.log(`  Participant ${pIndex}:`, {
              id: participant.id,
              name: participant.name,
              email: participant.email,
              role: participant.role,
              joinTime: participant.joinTime,
              leaveTime: participant.leaveTime,
              duration: participant.duration,
              fullObject: participant
            })
          })
        } else {
          console.log(`Session ${index} has no participants or empty array`)
        }
      })

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh sessions'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      })
    } finally {
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    if (!hasInitialLoad.current) {
      console.log('useEffect triggered for loadData - first time')
      hasInitialLoad.current = true
      loadData()
    } else {
      console.log('useEffect triggered for loadData - skipping duplicate call')
    }
  }, [])


  // Handle joining a meeting with Recall AI
  const handleJoinMeeting = async (meetingUrl: string, settings: any) => {
    try {
      const result = await MeetingAgentService.joinMeeting({
        meetingUrl,
        platform: MeetingAgentService.parseMeetingUrl(meetingUrl).platform || 'unknown',
        settings
      })

      if (result.success) {
        toast({
          title: 'Success',
          description: `${result.message}${result.recallBotId ? ` (Bot ID: ${result.recallBotId})` : ''}`
        })
        setIsJoinDialogOpen(false)
        loadData() // Refresh data
      } else {
        throw new Error(result.message)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to join meeting'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      })
    }
  }

  // Handle leaving a meeting
  const handleLeaveMeeting = async (sessionId: string) => {
    try {
      console.log(`Attempting to leave meeting session: ${sessionId}`)
      const result = await MeetingAgentService.leaveMeeting(sessionId)
      
      if (result.success) {
        console.log(`Successfully left meeting session: ${sessionId}`)
        toast({
          title: 'Success',
          description: `${result.message} S3 upload will be triggered automatically.`
        })
        loadData() // Refresh data
      } else {
        throw new Error(result.message)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to leave meeting'
      console.error(`Failed to leave meeting session ${sessionId}:`, err)
      toast({
        title: 'Error',
        description: `${errorMessage}. S3 upload may not have been triggered.`,
        variant: 'destructive'
      })
    }
  }


  // Handle leaving all active meetings
  const handleLeaveAllMeetings = async () => {
    const activeSessions = sessions.filter(s => ['active', 'recording'].includes(s.status))
    
    if (activeSessions.length === 0) {
      toast({
        title: 'No Active Meetings',
        description: 'There are no active meetings to leave',
        variant: 'destructive'
      })
      return
    }

    const confirmed = window.confirm(
      `Are you sure you want to leave ${activeSessions.length} active meeting(s)? This will stop all recordings and remove the bot from the meetings.`
    )

    if (!confirmed) return

    try {
      const leavePromises = activeSessions.map(session => 
        MeetingAgentService.leaveMeeting(session.id)
      )

      await Promise.all(leavePromises)

      toast({
        title: 'Success',
        description: `Successfully left ${activeSessions.length} meeting(s)`
      })

      loadData() // Refresh data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to leave meetings'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      })
    }
  }

  // Handle bulk S3 upload
  const handleBulkS3Upload = async () => {
    try {
      console.log('Starting bulk S3 upload for all sessions...')
      const result = await MeetingAgentService.checkAndUploadSessions()
      
      if (result.success) {
        console.log(`Bulk S3 upload completed: ${result.uploaded_count} uploaded, ${result.failed_count} failed`)
        toast({
          title: 'Bulk Upload Complete',
          description: `Uploaded ${result.uploaded_count} sessions, ${result.failed_count} failed`
        })
        loadData() // Refresh data
      } else {
        throw new Error(result.message || 'Bulk upload failed')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to perform bulk S3 upload'
      console.error(`Bulk S3 upload failed: ${errorMessage}`)
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      })
    }
  }

  // Handle updating session URLs from bot
  const handleUpdateSessionUrls = async (sessionId: string) => {
    try {
      console.log(`Updating URLs for session: ${sessionId}`)
      const result = await MeetingAgentService.updateSessionUrls(sessionId)
      
      if (result.success) {
        console.log(`Session URLs updated: video=${!!result.video_url}, transcript=${!!result.transcript_url}`)
        toast({
          title: 'URLs Updated',
          description: `Found video: ${!!result.video_url}, transcript: ${!!result.transcript_url}`
        })
        loadData() // Refresh data
      } else {
        throw new Error(result.message || 'Failed to update URLs')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update session URLs'
      console.error(`Update URLs failed: ${errorMessage}`)
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      })
    }
  }

  // Get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default'
      case 'recording':
        return 'destructive'  // Red for recording
      case 'completed':
        return 'secondary'
      case 'failed':
        return 'destructive'
      case 'joining':
      case 'transcribing':
      case 'processing':
        return 'outline'
      default:
        return 'outline'
    }
  }

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Video className="h-4 w-4" />
      case 'recording':
        return <Video className="h-4 w-4 text-red-500" />
      case 'completed':
        return <CheckCircle className="h-4 w-4" />
      case 'failed':
        return <AlertCircle className="h-4 w-4" />
      case 'joining':
      case 'transcribing':
      case 'processing':
        return <Activity className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }


  if (error) {
    return (
      <div className="flex h-screen bg-black">
        <NavSidebar onLogout={handleLogout} />
        <div className="flex-1 ml-16 flex items-center justify-center">
          <Card className="bg-zinc-900 border-zinc-700 max-w-md">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-400" />
                Error
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-zinc-400 mb-4">{error}</p>
              <Button onClick={loadData} variant="outline" className="text-white border-zinc-600">
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="flex h-screen bg-black">
        <NavSidebar onLogout={handleLogout} />
        <div className="flex-1 ml-16 flex flex-col h-screen overflow-hidden">
          {/* Main Content Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
              {/* Dashboard Content */}
              {activeTab === 'dashboard' && (
                <div className="flex-1 flex flex-col h-full">
                  
                  {/* Recent Sessions Table */}
                  <Card className="bg-black border-border flex-1 flex flex-col h-full">
                    <CardHeader className="border-b border-border">
                      <div className='flex items-center justify-between'>
                        <div className="flex items-center gap-2">
                          <Video className="h-5 w-5 text-foreground" />
                          <CardTitle className="text-foreground">Meetings</CardTitle>
                        </div>
                        <div className="flex items-center gap-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={refreshSessions}
                                disabled={isRefreshing}
                                className="h-8 w-8 p-0"
                              >
                                {isRefreshing ? (
                                  <RefreshCw className="h-4 w-4 animate-spin" />
                                ) : (
                                  <RefreshCw className="h-4 w-4" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Refresh sessions</p>
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={handleBulkS3Upload}
                                className="h-8 px-3 text-blue-400 border-blue-600 hover:bg-blue-600 hover:text-white"
                              >
                                <Download className="h-4 w-4 mr-1" />
                                Upload to S3
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Upload all completed meetings to S3</p>
                            </TooltipContent>
                          </Tooltip>
                          {sessions.filter(s => ['active', 'recording'].includes(s.status)).length > 0 && (
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={handleLeaveAllMeetings}
                              className="text-white bg-red-600 hover:bg-red-700"
                            >
                              <Square className="h-4 w-4 mr-2" />
                              Leave All Meetings ({sessions.filter(s => ['active', 'recording'].includes(s.status)).length})
                            </Button>
                          )}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={handleBulkDelete}
                                disabled={selectedSessions.size === 0}
                                className="h-8 w-8 p-0 text-red-400 border-red-600 hover:bg-red-600 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Delete Selected ({selectedSessions.size})</p>
                            </TooltipContent>
                          </Tooltip>
                          <Button 
                            onClick={() => setIsJoinDialogOpen(true)}
                            size="sm"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Join Meeting
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="px-0 flex-1 flex flex-col min-h-0">
                      {isLoading ? (
                        <div className="flex-1 overflow-y-auto min-h-0">
                          <table className="w-full">
                            <thead className="sticky top-0 bg-black z-10 border-b border-border">
                              <tr>
                                <th className="text-left py-3 px-4 text-muted-foreground font-medium text-sm w-12"></th>
                                <th className="text-left py-3 px-4 text-muted-foreground font-medium text-sm w-12">
                                  <div className="h-4 w-4 bg-muted rounded animate-pulse"></div>
                                </th>
                                <th className="text-left py-3 px-4 text-muted-foreground font-medium text-sm">Meeting</th>
                                <th className="text-left py-3 px-4 text-muted-foreground font-medium text-sm">Platform</th>
                                <th className="text-left py-3 px-4 text-muted-foreground font-medium text-sm">Status</th>
                                <th className="text-left py-3 px-4 text-muted-foreground font-medium text-sm">Participants</th>
                                <th className="text-left py-3 px-4 text-muted-foreground font-medium text-sm">Start Time</th>
                                <th className="text-left py-3 px-4 text-muted-foreground font-medium text-sm">Duration</th>
                              </tr>
                            </thead>
                            <tbody>
                              <TableSkeleton />
                            </tbody>
                          </table>
                        </div>
                      ) : sessions.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center">
                          <div className="text-center py-8 px-6">
                            <Video className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                            <h3 className="text-lg font-semibold text-foreground mb-2">No meeting sessions yet</h3>
                            <p className="text-muted-foreground mb-4">
                              Start recording your meetings by joining a video call.
                            </p>
                            <Button onClick={() => setIsJoinDialogOpen(true)}>
                              <Plus className="h-4 w-4 mr-2" />
                              Join Meeting
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex-1 overflow-y-auto min-h-0">
                          <table className="w-full">
                            <thead className="sticky top-0 bg-black z-10 border-b border-border">
                              <tr>
                                <th className="text-left py-3 px-4 text-muted-foreground font-medium text-sm w-12"></th>
                                <th className="text-left py-3 px-4 text-muted-foreground font-medium text-sm w-12">
                                  <input
                                    type="checkbox"
                                    checked={selectedSessions.size === sessions.length && sessions.length > 0}
                                    onChange={handleSelectAll}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                    }}
                                    className="rounded border-input bg-black text-primary focus:ring-ring"
                                  />
                                </th>
                                <th className="text-left py-3 px-4 text-muted-foreground font-medium text-sm">Meeting</th>
                                <th className="text-left py-3 px-4 text-muted-foreground font-medium text-sm">Platform</th>
                                <th className="text-left py-3 px-4 text-muted-foreground font-medium text-sm">Status</th>
                                <th className="text-left py-3 px-4 text-muted-foreground font-medium text-sm">Participants</th>
                                <th className="text-left py-3 px-4 text-muted-foreground font-medium text-sm">Start Time</th>
                                <th className="text-left py-3 px-4 text-muted-foreground font-medium text-sm">Duration</th>
                              </tr>
                            </thead>
                            <tbody>
                              {isRefreshing ? (
                                <TableSkeleton />
                              ) : (
                                sessions.map((session) => (
                                  <>
                                    <tr 
                                      key={session.id} 
                                      className="border-b border-border hover:bg-muted/50 transition-colors cursor-pointer"
                                      onClick={() => toggleRowExpansion(session.id)}
                                    >
                                    <td className="py-3 px-4 w-12">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          toggleRowExpansion(session.id)
                                        }}
                                      >
                                        {expandedRows.has(session.id) ? (
                                          <ChevronDown className="h-4 w-4" />
                                        ) : (
                                          <ChevronRight className="h-4 w-4" />
                                        )}
                                      </Button>
                                    </td>
                                    <td className="py-3 px-4 w-12">
                                      <input
                                        type="checkbox"
                                        checked={selectedSessions.has(session.id)}
                                        onChange={(e) => {
                                          e.stopPropagation()
                                          handleSessionSelect(session.id)
                                        }}
                                        onClick={(e) => {
                                          e.stopPropagation()
                                        }}
                                        className="rounded border-input bg-black text-primary focus:ring-ring"
                                      />
                                    </td>
                                    <td className="py-3 px-4">
                                      <div className="flex items-center gap-2">
                                        <p className="font-medium text-foreground">
                                          {session.title || 'Untitled Meeting'}
                                        </p>
                                        {session.status === 'recording' && (
                                          <div className="flex items-center gap-1 px-2 py-0.5 bg-destructive/10 border border-destructive/20 rounded-full">
                                            <div className="w-1.5 h-1.5 bg-destructive rounded-full animate-pulse"></div>
                                            <span className="text-xs text-destructive font-medium">REC</span>
                                          </div>
                                        )}
                                      </div>
                                    </td>
                                    <td className="py-3 px-4 text-muted-foreground">{session.platform.name}</td>
                                    <td className="py-3 px-4">
                                      <Badge variant={getStatusBadgeVariant(session.status)}>
                                        {session.status}
                                      </Badge>
                                    </td>
                                    <td className="py-3 px-4">
                                      <div className="flex items-center gap-1">
                                        <Users className="h-3 w-3 text-muted-foreground" />
                                        <span className="text-sm text-muted-foreground">
                                          {session.participants ? session.participants.length : 0}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="py-3 px-4 text-muted-foreground text-sm">
                                      {new Date(session.startTime).toLocaleString()}
                                    </td>
                                    <td className="py-3 px-4 text-muted-foreground text-sm">
                                      {session.duration ? `${Math.floor(session.duration / 60)}m ${session.duration % 60}s` : '-'}
                                    </td>
                                  </tr>
                                  {/* Expanded Row Content */}
                                  {expandedRows.has(session.id) && (
                                    <tr>
                                      <td colSpan={8} className="py-4 px-4 bg-muted/30 border-b border-border">
                                        <div className="space-y-4">
                                          {/* Meeting Details */}
                                          <div>
                                            <h4 className="text-foreground font-medium mb-3 flex items-center gap-2">
                                              <Users className="h-4 w-4" />
                                              Meeting Details
                                            </h4>
                                            <div className="bg-black rounded-lg p-4 border border-border">
                                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                                <div>
                                                  <span className="text-muted-foreground font-medium text-xs">Meeting URL</span>
                                                  <p className="text-foreground break-all font-mono text-xs bg-muted p-2 rounded mt-1">
                                                    {session.meetingUrl}
                                                  </p>
                                                </div>
                                                <div>
                                                  <span className="text-muted-foreground font-medium text-xs">Participants</span>
                                                  <p className="text-foreground font-medium mt-1">
                                                    {session.participants ? session.participants.length : 0}
                                                    {session.participants && session.participants.length > 0 && (
                                                      <span className="text-muted-foreground text-xs ml-2">
                                                        ({session.participants.map(p => {
                                                          // Handle different participant data structures
                                                          if (typeof p === 'string') return p
                                                          if (typeof p === 'object' && p !== null) {
                                                            return p.name || p.email || (p as any).displayName || (p as any).userName || p.id || 'Unknown'
                                                          }
                                                          return 'Unknown'
                                                        }).join(', ')})
                                                      </span>
                                                    )}
                                                  </p>
                                                </div>
                                                {session.recallBot && (
                                                  <>
                                                    <div>
                                                      <span className="text-muted-foreground font-medium text-xs">Recall Bot Status</span>
                                                      <p className="text-foreground font-medium mt-1 capitalize">{session.recallBot.status}</p>
                                                    </div>
                                                    <div>
                                                      <span className="text-muted-foreground font-medium text-xs">Recording Status</span>
                                                      <p className="text-foreground font-medium mt-1 capitalize">{session.recallBot.recordingStatus}</p>
                                                    </div>
                                                    <div className="md:col-span-2">
                                                      <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleUpdateSessionUrls(session.id)}
                                                        className="text-blue-400 border-blue-600 hover:bg-blue-600 hover:text-white"
                                                      >
                                                        <RefreshCw className="h-4 w-4 mr-2" />
                                                        Update URLs from Bot
                                                      </Button>
                                                    </div>
                                                  </>
                                                )}
                                              </div>
                                            </div>
                                          </div>


                                          {/* Video and Transcriipt Side by Side */}
                                          {((session.recallBot?.videoUrl || session.recordingUrl) || (session.recallBot?.transcriptUrl || session.transcriptionText)) && (
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                              {/* Video Section */}
                                              {(session.recallBot?.videoUrl || session.recordingUrl) && (
                                                <div>
                                                  <h4 className="text-foreground font-medium mb-3 flex items-center gap-2">
                                                    <Video className="h-4 w-4" />
                                                    Recording
                                                  </h4>
                                                  <div className="bg-black rounded-lg p-3 h-80 flex items-center justify-center border border-border">
                                                    <video 
                                                      controls 
                                                      className="w-full rounded max-h-full"
                                                      src={session.recallBot?.videoUrl || session.recordingUrl}
                                                    >
                                                      Your browser does not support the video tag.
                                                    </video>
                                                  </div>
                                                </div>
                                              )}
                                              
                                              {/* Transcript Section */}
                                              {(session.recallBot?.transcriptUrl || session.transcriptionText || transcriptData[session.id]) && (
                                                <div>
                                                  <h4 className="text-foreground font-medium mb-3 flex items-center gap-2">
                                                    <FileText className="h-4 w-4" />
                                                    Transcript
                                                  </h4>
                                                  <div className="bg-black rounded-lg p-3 h-80 overflow-y-auto border border-border">
                                                    {transcriptData[session.id]?.isLoading ? (
                                                      <div className="flex items-center justify-center h-full">
                                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                                        <span className="ml-3 text-muted-foreground">Loading transcript...</span>
                                                      </div>
                                                    ) : transcriptData[session.id]?.error ? (
                                                      <div className="text-center py-6">
                                                        <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
                                                        <p className="text-destructive mb-4">{transcriptData[session.id].error}</p>
                                                        <Button
                                                          variant="outline"
                                                          onClick={() => fetchTranscript(session.id)}
                                                        >
                                                          Try Again
                                                        </Button>
                                                      </div>
                                                    ) : transcriptData[session.id]?.segments?.length > 0 ? (
                                                      <div className="space-y-3">
                                                        {transcriptData[session.id].segments.map((segment, index) => (
                                                          <div key={segment.id || index} className="bg-muted/50 rounded-lg p-3 border border-border">
                                                            <div className="flex items-center gap-2 mb-2">
                                                              <span className="text-primary font-medium text-sm">
                                                                {segment.speakerName || `Speaker ${segment.speakerId}`}
                                                              </span>
                                                              <span className="text-muted-foreground text-xs">
                                                                {Math.floor(segment.startTime / 60)}:{(segment.startTime % 60).toString().padStart(2, '0')}
                                                              </span>
                                                              {segment.confidence && (
                                                                <span className="text-muted-foreground text-xs">
                                                                  ({Math.round(segment.confidence * 100)}%)
                                                                </span>
                                                              )}
                                                            </div>
                                                            <p className="text-foreground text-sm">
                                                              {segment.text}
                                                            </p>
                                                          </div>
                                                        ))}
                                                      </div>
                                                    ) : session.transcriptionText ? (
                                                      <div className="bg-muted/50 rounded-lg p-3 border border-border">
                                                        <pre className="text-foreground whitespace-pre-wrap text-sm font-mono">
                                                          {session.transcriptionText}
                                                        </pre>
                                                      </div>
                                                    ) : session.recallBot?.transcriptUrl ? (
                                                      <div className="text-center py-6">
                                                        <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                                                        <p className="text-foreground font-medium mb-2">Transcript available via Recall AI</p>
                                                        <Button
                                                          variant="outline"
                                                          onClick={() => window.open(session.recallBot!.transcriptUrl, '_blank')}
                                                        >
                                                          <FileText className="h-4 w-4 mr-2" />
                                                          View Full Transcript
                                                        </Button>
                                                      </div>
                                                    ) : (
                                                      <div className="text-center py-6">
                                                        <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                                                        <p className="text-foreground font-medium mb-2">No transcript available</p>
                                                        <Button
                                                          variant="outline"
                                                          onClick={() => fetchTranscript(session.id)}
                                                        >
                                                          <FileText className="h-4 w-4 mr-2" />
                                                          Load Transcript
                                                        </Button>
                                                      </div>
                                                    )}
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                  </>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Active Sessions Content */}
              {activeTab === 'active' && (
                <div className="flex-1 flex flex-col h-full">
                  <Card className="bg-black border-border flex-1 flex flex-col h-full">
                    <CardHeader className="border-b border-border">
                      <div className="flex items-center gap-2">
                        <Activity className="h-5 w-5 text-foreground" />
                        <CardTitle className="text-foreground">Active Sessions</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col p-6">
                      {sessions.filter(s => ['active', 'recording', 'joining', 'processing'].includes(s.status)).length === 0 ? (
                        <div className="flex-1 flex items-center justify-center">
                          <div className="text-center py-8 px-6">
                            <VideoOff className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                            <h3 className="text-lg font-semibold text-foreground mb-2">No active sessions</h3>
                            <p className="text-muted-foreground mb-4">
                              No meetings are currently being recorded or processed.
                            </p>
                            <Button onClick={() => setIsJoinDialogOpen(true)}>
                              <Plus className="h-4 w-4 mr-2" />
                              Join Meeting
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {sessions
                            .filter(s => ['active', 'recording', 'joining', 'processing'].includes(s.status))
                            .map((session) => (
                              <div key={session.id} className="space-y-3">
                                <MeetingSessionCard
                                  session={session}
                                  onLeave={() => handleLeaveMeeting(session.id)}
                                  onRefresh={loadData}
                                />
                                {/* Show Recall Bot details if available */}
                                {session.recallBot && (
                                  <RecallBotCard
                                    bot={session.recallBot}
                                    onStop={async () => {
                                      try {
                                        await MeetingAgentService.stopRecallBot(session.recallBot!.id)
                                        loadData()
                                      } catch (error) {
                                        toast({
                                          title: 'Error',
                                          description: 'Failed to stop Recall bot',
                                          variant: 'destructive'
                                        })
                                      }
                                    }}
                                    onRefresh={loadData}
                                  />
                                )}
                              </div>
                            ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
              {/* Join Meeting Dialog */}
              <MeetingJoinDialog
                open={isJoinDialogOpen}
                onOpenChange={setIsJoinDialogOpen}
                onJoin={handleJoinMeeting}
              />

              {/* Video Player Dialog */}
              {videoPlayerSession && (videoPlayerSession.recallBot?.videoUrl || videoPlayerSession.recordingUrl) && (
                <VideoPlayerDialog
                  open={!!videoPlayerSession}
                  onOpenChange={(open) => {
                    if (!open) setVideoPlayerSession(null)
                  }}
                  session={videoPlayerSession}
                  videoUrl={videoPlayerSession.recallBot?.videoUrl || videoPlayerSession.recordingUrl || ''}
                />
              )}

              {/* Transcription Dialog */}
              {transcriptionSession && (
                <TranscriptionDialog
                  open={!!transcriptionSession}
                  onOpenChange={(open) => {
                    if (!open) setTranscriptionSession(null)
                  }}
                  session={transcriptionSession}
                />
              )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
