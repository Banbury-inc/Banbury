import { MeetingSession } from '../../../../../types/meeting-types'
import { Badge } from '../../../../ui/badge'
import { Typography } from '../../../../ui/typography'
import { Video, Clock, Users, CheckCircle2, XCircle, PlayCircle, Calendar } from 'lucide-react'

interface MeetingsListViewProps {
  meetings: MeetingSession[]
  loading: boolean
  onMeetingSelect?: (meeting: MeetingSession) => void
  selectedMeeting?: MeetingSession | null
}

type MeetingStatus = MeetingSession['status']

function getStatusBadgeVariant(status: MeetingStatus) {
  switch (status) {
    case 'scheduled':
      return 'secondary'
    case 'joining':
    case 'active':
    case 'recording':
      return 'default'
    case 'completed':
      return 'outline'
    case 'failed':
      return 'destructive'
    default:
      return 'secondary'
  }
}

function getStatusIcon(status: MeetingStatus) {
  switch (status) {
    case 'scheduled':
      return Calendar
    case 'joining':
    case 'active':
    case 'recording':
      return PlayCircle
    case 'completed':
      return CheckCircle2
    case 'failed':
      return XCircle
    default:
      return Video
  }
}

function formatDate(date: Date) {
  const now = new Date()
  const meetingDate = new Date(date)
  const diffMs = meetingDate.getTime() - now.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return meetingDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  } else if (diffDays === 1) {
    return 'Tomorrow'
  } else if (diffDays === -1) {
    return 'Yesterday'
  } else if (diffDays > 0 && diffDays < 7) {
    return meetingDate.toLocaleDateString('en-US', { weekday: 'short' })
  } else {
    return meetingDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }
}

function formatDuration(duration?: number) {
  if (!duration) return ''
  const hours = Math.floor(duration / 3600)
  const minutes = Math.floor((duration % 3600) / 60)
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

export function MeetingsListView({ meetings, loading, onMeetingSelect, selectedMeeting }: MeetingsListViewProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center flex-1 p-4">
        <Typography variant="xs" className="text-muted-foreground">Loading meetings...</Typography>
      </div>
    )
  }

  if (meetings.length === 0) {
    return (
      <div className="flex items-center justify-center flex-1 p-4">
        <Typography variant="xs" className="text-muted-foreground">No meetings found</Typography>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-2 space-y-1">
        {meetings.map((meeting) => {
          const StatusIcon = getStatusIcon(meeting.status)
          const isSelected = selectedMeeting?.id === meeting.id

          return (
            <div
              key={meeting.id}
              onClick={() => onMeetingSelect?.(meeting)}
              className={`
                p-2 rounded-md cursor-pointer transition-colors min-w-0
                ${isSelected 
                  ? 'bg-primary/10 border border-primary/20' 
                  : 'hover:bg-muted'
                }
              `}
            >
              <div className="flex items-start gap-2 min-w-0">
                <StatusIcon className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
                <div className="flex-1 min-w-0 overflow-hidden">
                  <div className="flex items-center gap-2 mb-1 min-w-0">
                    <Typography variant="xs" className="font-medium truncate flex-1 min-w-0">
                      {meeting.title || 'Untitled Meeting'}
                    </Typography>
                    <Badge variant={getStatusBadgeVariant(meeting.status)} className="text-xs flex-shrink-0">
                      {meeting.status.charAt(0).toUpperCase() + meeting.status.slice(1)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-1 min-w-0 flex-wrap">
                    {meeting.platform && (
                      <div className="flex items-center gap-1 flex-shrink-0 min-w-0">
                        <Video className="h-3 w-3 flex-shrink-0" />
                        <Typography variant="xs" className="truncate min-w-0">{meeting.platform.name}</Typography>
                      </div>
                    )}
                    {meeting.participants && meeting.participants.length > 0 && (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Users className="h-3 w-3 flex-shrink-0" />
                        <Typography variant="xs">{meeting.participants.length}</Typography>
                      </div>
                    )}
                    {meeting.duration && (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Clock className="h-3 w-3 flex-shrink-0" />
                        <Typography variant="xs">{formatDuration(meeting.duration)}</Typography>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground min-w-0">
                    <Clock className="h-3 w-3 flex-shrink-0" />
                    <Typography variant="xs" className="truncate min-w-0">{formatDate(meeting.startTime)}</Typography>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

