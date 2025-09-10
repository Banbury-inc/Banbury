import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import { Button } from '../../components/ui/button'
import { TooltipProvider } from '../../components/ui/tooltip'
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
  Play
} from 'lucide-react'
import { MeetingJoinDialog } from './components/MeetingJoinDialog'
import { MeetingSessionCard } from './components/MeetingSessionCard'
import { MeetingAgentSettings } from './components/MeetingAgentSettings'
import { AgentStatusCard } from './components/AgentStatusCard'
import { VideoPlayerDialog } from './components/VideoPlayerDialog'
import { MeetingAgentService } from '../../services/meetingAgentService'
import { MeetingSession, MeetingAgentStatus } from '../../types/meeting-types'
import { useToast } from '../../components/ui/use-toast'
import { NavSidebar } from '../../components/nav-sidebar'

export default function MeetingAgent() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [sessions, setSessions] = useState<MeetingSession[]>([])
  const [agentStatus, setAgentStatus] = useState<MeetingAgentStatus | null>(null)
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [videoPlayerSession, setVideoPlayerSession] = useState<MeetingSession | null>(null)
  const { toast } = useToast()

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    router.push('/login')
  }

  // Load initial data
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const [statusResult, sessionsResult] = await Promise.all([
        MeetingAgentService.getAgentStatus(),
        MeetingAgentService.getMeetingSessions(20, 0)
      ])

      setAgentStatus(statusResult)
      setSessions(sessionsResult.sessions)
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
  }, [toast])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Handle joining a meeting
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
          description: result.message
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
      const result = await MeetingAgentService.leaveMeeting(sessionId)
      
      if (result.success) {
        toast({
          title: 'Success',
          description: result.message
        })
        loadData() // Refresh data
      } else {
        throw new Error(result.message)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to leave meeting'
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

  if (isLoading) {
    return (
      <div className="flex h-screen bg-black">
        <NavSidebar onLogout={handleLogout} />
        <div className="flex-1 ml-16 flex items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white"></div>
        </div>
      </div>
    )
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
        <div className="flex-1 ml-16 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-zinc-900 border-b border-zinc-700 px-6 py-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white">Meeting Agent</h1>
                <p className="text-zinc-400">
                  AI agent that joins meetings to record and transcribe conversations
                </p>
              </div>
              <div className="flex items-center gap-3">
                {/* Recording Indicator */}
                {sessions.some(s => s.status === 'recording') && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-red-600/20 border border-red-500/30 rounded-lg">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-red-300 text-sm font-medium">
                      {sessions.filter(s => s.status === 'recording').length} Recording
                    </span>
                  </div>
                )}
                
                <Button 
                  onClick={() => setIsJoinDialogOpen(true)}
                  className="bg-zinc-800 hover:bg-zinc-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Join Meeting
                </Button>
              </div>
            </div>
          </div>
          
          {/* Main Content Area */}
          <div className="flex-1 overflow-auto p-6 space-y-6">
              {/* Agent Status */}
              {agentStatus && <AgentStatusCard status={agentStatus} />}

              {/* Tabs */}
              <div className="border-b border-zinc-700">
                <nav className="flex space-x-8">
                  {[
                    { id: 'dashboard', label: 'Dashboard' },
                    { id: 'active', label: 'Active Sessions' },
                    { id: 'history', label: 'History' },
                    { id: 'settings', label: 'Settings' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-400'
                          : 'border-transparent text-zinc-400 hover:text-white hover:border-zinc-300'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Dashboard Content */}
              {activeTab === 'dashboard' && (
                <div className="space-y-6">
                  {/* Quick Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="bg-zinc-900 border-zinc-700">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-white text-sm">Active Sessions</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-white">{agentStatus?.activeConnections || 0}</div>
                      </CardContent>
                    </Card>
                
                    <Card className="bg-zinc-900 border-zinc-700">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-white text-sm">Today's Meetings</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-white">{agentStatus?.totalMeetingsToday || 0}</div>
                      </CardContent>
                    </Card>
                
                    <Card className="bg-zinc-900 border-zinc-700">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-white text-sm">Recording Time</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-white">
                          {Math.round((agentStatus?.totalRecordingTime || 0) / 60)}m
                        </div>
                      </CardContent>
                    </Card>
                
                    <Card className="bg-zinc-900 border-zinc-700">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-white text-sm">System Status</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Badge 
                          variant={agentStatus?.systemHealth === 'healthy' ? 'default' : 'destructive'}
                          className="bg-zinc-800 text-white border-zinc-600"
                        >
                          {agentStatus?.systemHealth || 'Unknown'}
                        </Badge>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Recent Sessions */}
                  <Card className="bg-zinc-900 border-zinc-700">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-white">Recent Sessions</CardTitle>
                          <CardDescription className="text-zinc-400">
                            Your most recent meeting sessions and their status
                          </CardDescription>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={loadData}
                          className="text-white border-zinc-600 hover:bg-zinc-800"
                        >
                          <Activity className="h-4 w-4 mr-2" />
                          Refresh
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {sessions.length === 0 ? (
                        <div className="text-center py-8 text-zinc-400">
                          <Video className="h-12 w-12 mx-auto mb-4" />
                          <p>No meeting sessions yet</p>
                          <p className="text-sm text-zinc-500 mt-2">
                            Click "Join Meeting" to start your first session
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {sessions.slice(0, 5).map((session) => (
                            <div key={session.id} className="flex items-center justify-between p-4 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors">
                              <div className="flex items-center gap-3">
                                {getStatusIcon(session.status)}
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="font-medium text-white">{session.title || 'Untitled Meeting'}</p>
                                    {session.status === 'recording' && (
                                      <div className="flex items-center gap-1 px-2 py-1 bg-red-600/20 border border-red-500/30 rounded-full">
                                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                                        <span className="text-xs text-red-300 font-medium">REC</span>
                                      </div>
                                    )}
                                  </div>
                                  <p className="text-sm text-zinc-400">
                                    {session.platform.name} • {new Date(session.startTime).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant={getStatusBadgeVariant(session.status)}>
                                  {session.status}
                                </Badge>
                                {session.status === 'completed' && (
                                  <div className="flex gap-1">
                                    {session.recordingUrl && (
                                      <>
                                        <Button 
                                          size="sm" 
                                          variant="default"
                                          className="bg-blue-600 hover:bg-blue-700 text-white h-8 w-8 p-0"
                                          title="Watch Recording"
                                          onClick={() => setVideoPlayerSession(session)}
                                        >
                                          <Play className="h-3 w-3" />
                                        </Button>
                                        <Button 
                                          size="sm" 
                                          variant="outline" 
                                          className="text-white border-zinc-600 h-8 w-8 p-0"
                                          title="Download Recording"
                                          onClick={async () => {
                                            try {
                                              const result = await MeetingAgentService.downloadRecording(session.id)
                                              if (result.success && result.downloadUrl) {
                                                const link = document.createElement('a')
                                                link.href = result.downloadUrl
                                                link.download = `${session.title || 'meeting'}_recording.mp4`
                                                document.body.appendChild(link)
                                                link.click()
                                                document.body.removeChild(link)
                                              }
                                            } catch (error) {
                                              toast({
                                                title: 'Download Failed',
                                                description: 'Failed to download recording',
                                                variant: 'destructive'
                                              })
                                            }
                                          }}
                                        >
                                          <Download className="h-3 w-3" />
                                        </Button>
                                      </>
                                    )}
                                    {session.transcriptionText && (
                                      <Button 
                                        size="sm" 
                                        variant="outline" 
                                        className="text-white border-zinc-600 h-8 w-8 p-0"
                                        title="Download Transcription"
                                      >
                                        <FileText className="h-3 w-3" />
                                      </Button>
                                    )}
                                  </div>
                                )}
                                {(session.status === 'active' || session.status === 'recording') && (
                                  <>
                                    <Button 
                                      size="sm" 
                                      variant="destructive"
                                      onClick={() => handleLeaveMeeting(session.id)}
                                    >
                                      {session.status === 'recording' ? 'Stop & Leave' : 'Leave'}
                                    </Button>
                                  </>
                                )}
                                {session.status === 'processing' && (
                                  <Badge variant="outline" className="animate-pulse">
                                    Processing...
                                  </Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Active Sessions Content */}
              {activeTab === 'active' && (
                <div className="space-y-6">
                  <Card className="bg-zinc-900 border-zinc-700">
                    <CardHeader>
                      <CardTitle className="text-white">Active Sessions</CardTitle>
                      <CardDescription className="text-zinc-400">
                        Currently active meeting sessions
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {sessions.filter(s => ['active', 'recording', 'joining', 'processing'].includes(s.status)).length === 0 ? (
                        <div className="text-center py-8 text-zinc-400">
                          <VideoOff className="h-12 w-12 mx-auto mb-4" />
                          <p>No active sessions</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {sessions
                            .filter(s => ['active', 'recording', 'joining', 'processing'].includes(s.status))
                            .map((session) => (
                              <MeetingSessionCard
                                key={session.id}
                                session={session}
                                onLeave={() => handleLeaveMeeting(session.id)}
                                onRefresh={loadData}
                              />
                            ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* History Content */}
              {activeTab === 'history' && (
                <div className="space-y-6">
                  <Card className="bg-zinc-900 border-zinc-700">
                    <CardHeader>
                      <CardTitle className="text-white">Meeting History</CardTitle>
                      <CardDescription className="text-zinc-400">
                        All your past meeting sessions
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {sessions.filter(s => s.status === 'completed').length === 0 ? (
                        <div className="text-center py-8 text-zinc-400">
                          <Clock className="h-12 w-12 mx-auto mb-4" />
                          <p>No completed sessions</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {sessions
                            .filter(s => s.status === 'completed')
                            .map((session) => (
                              <MeetingSessionCard
                                key={session.id}
                                session={session}
                                onRefresh={loadData}
                              />
                            ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Settings Content */}
              {activeTab === 'settings' && (
                <div className="space-y-6">
                  <MeetingAgentSettings />
                </div>
              )}

              {/* Join Meeting Dialog */}
              <MeetingJoinDialog
                open={isJoinDialogOpen}
                onOpenChange={setIsJoinDialogOpen}
                onJoin={handleJoinMeeting}
              />

              {/* Video Player Dialog */}
              {videoPlayerSession && videoPlayerSession.recordingUrl && (
                <VideoPlayerDialog
                  open={!!videoPlayerSession}
                  onOpenChange={(open) => {
                    if (!open) setVideoPlayerSession(null)
                  }}
                  session={videoPlayerSession}
                  videoUrl={videoPlayerSession.recordingUrl}
                />
              )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
