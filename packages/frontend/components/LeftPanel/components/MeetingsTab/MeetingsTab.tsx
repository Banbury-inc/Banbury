import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, Plus, Video, Monitor, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '../../../ui/button'
import { Typography } from '../../../ui/typography'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '../../../ui/select'
import { MeetingSession } from '../../../../types/meeting-types'
import { ApiService } from '../../../../../backend/api/apiService'
import { MeetingsListView } from './components/MeetingsListView'
import { handleRefreshMeetings } from './handlers/handleRefreshMeetings'
import { DesktopRecordingPanel } from '../../../../pages/MeetingAgent/components/DesktopRecordingPanel'

type MeetingStatusFilter = 'all' | MeetingSession['status']

interface DesktopRecordingStartedData {
  sessionId: string
  windowId: string
  platform: string
  meetingTitle: string
}

interface MeetingsTabProps {
  onMeetingSelect?: (meeting: MeetingSession) => void
  selectedMeeting?: MeetingSession | null
  onJoinMeeting?: () => void
  onDesktopRecordingStarted?: (data: DesktopRecordingStartedData) => void
}

export function MeetingsTab({ onMeetingSelect, selectedMeeting, onJoinMeeting, onDesktopRecordingStarted }: MeetingsTabProps) {
  const [meetings, setMeetings] = useState<MeetingSession[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<MeetingStatusFilter>('all')
  const [refreshCounter, setRefreshCounter] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isDesktopRecordingExpanded, setIsDesktopRecordingExpanded] = useState(true)
  
  // Check if running in Electron desktop environment
  const isDesktop = typeof window !== 'undefined' && window.desktopApp?.isDesktop === true
  
  // Debug logging for desktop detection
  useEffect(() => {
    console.log('[MeetingsTab] Desktop detection:', {
      isDesktop,
      hasDesktopApp: typeof window !== 'undefined' && !!window.desktopApp,
      desktopAppIsDesktop: typeof window !== 'undefined' && window.desktopApp?.isDesktop,
      platform: typeof window !== 'undefined' && window.desktopApp?.getPlatform?.()
    })
  }, [isDesktop])

  const loadMeetings = useCallback(async () => {
    setLoading(true)
    try {
      const result = await ApiService.MeetingAgent.getMeetingSessions(50, 0)
      setMeetings(result.sessions)
    } catch (error) {
      console.error('Failed to load meetings:', error)
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadMeetings()
  }, [loadMeetings, refreshCounter])

  const filteredMeetings = filter === 'all'
    ? meetings
    : meetings.filter(meeting => meeting.status === filter)

  const handleRefresh = () => {
    handleRefreshMeetings({ setRefreshCounter, setIsRefreshing })
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Tab Content Header */}
      <div className="flex flex-col bg-card">
        <div className="flex items-center justify-between px-4 py-3 border-b min-w-0 gap-3">
          <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
            {/* Status Filter */}
            <Select value={filter} onValueChange={(value) => setFilter(value as MeetingStatusFilter)}>
              <SelectTrigger size="xs" className="min-w-0 w-auto max-w-full overflow-hidden">
                <SelectValue>
                  <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                    <Video className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={1.5} />
                    <Typography variant="xs" className="font-medium truncate hidden @[280px]:inline min-w-0">
                      {filter === 'all' ? 'All Meetings' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                    </Typography>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Filter</SelectLabel>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <Video className="h-3.5 w-3.5" strokeWidth={1.5} />
                      <Typography variant="xs" className="font-medium">All Meetings</Typography>
                    </div>
                  </SelectItem>
                  <SelectItem value="scheduled">
                    <Typography variant="xs" className="font-medium">Scheduled</Typography>
                  </SelectItem>
                  <SelectItem value="active">
                    <Typography variant="xs" className="font-medium">Active</Typography>
                  </SelectItem>
                  <SelectItem value="recording">
                    <Typography variant="xs" className="font-medium">Recording</Typography>
                  </SelectItem>
                  <SelectItem value="completed">
                    <Typography variant="xs" className="font-medium">Completed</Typography>
                  </SelectItem>
                  <SelectItem value="failed">
                    <Typography variant="xs" className="font-medium">Failed</Typography>
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="outline"
              size="xs"
              onClick={handleRefresh}
              disabled={isRefreshing}
              title="Refresh"
              className="flex-shrink-0"
            >
              <RefreshCw className={isRefreshing ? 'h-4 w-4 animate-spin text-muted-foreground' : 'h-4 w-4 text-muted-foreground'} />
            </Button>
            <Button
              variant="default"
              size="xs"
              onClick={onJoinMeeting}
              title="Join Meeting"
              className="flex-shrink-0 bg-foreground hover:bg-foreground hover:text-primary-foreground"
            >
              <Plus className="h-4 w-4 text-primary-foreground" strokeWidth={1} />
            </Button>
          </div>
        </div>
      </div>

      {/* Desktop Recording Section - Only visible in Electron */}
      {isDesktop && (
        <div className="border-b border-border">
          <button
            onClick={() => setIsDesktopRecordingExpanded(!isDesktopRecordingExpanded)}
            className="w-full flex items-center justify-between px-4 py-2 hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Monitor className="h-4 w-4 text-primary" />
              <Typography variant="xs" className="font-medium">Desktop Recording</Typography>
            </div>
            {isDesktopRecordingExpanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
          {isDesktopRecordingExpanded && (
            <div className="px-2 pb-2">
              <DesktopRecordingPanel 
                onRecordingComplete={() => setRefreshCounter(c => c + 1)}
                onRecordingStarted={onDesktopRecordingStarted}
              />
            </div>
          )}
        </div>
      )}

      {/* Tab Content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <MeetingsListView
          meetings={filteredMeetings}
          loading={loading}
          onMeetingSelect={onMeetingSelect}
          selectedMeeting={selectedMeeting}
        />
      </div>
    </div>
  )
}

