import React from 'react'
import { MeetingSession } from '../../../../../types/meeting-types'
import { Badge } from '../../../../ui/badge'
import { Typography } from '../../../../ui/typography'
import { Button } from '../../../../ui/button'
import { Video, Clock, Users, CheckCircle2, XCircle, PlayCircle, Calendar, Trash2 } from 'lucide-react'
import { ZoomIcon, GoogleMeetIcon, TeamsIcon } from '../../../../icons'

interface MeetingsListViewProps {
  meetings: MeetingSession[]
  loading: boolean
  onMeetingSelect?: (meeting: MeetingSession) => void
  selectedMeeting?: MeetingSession | null
  onMeetingDeleted?: (meetingId: string) => void
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

function formatDate(date: Date | string) {
  const now = new Date()
  const meetingDate = date instanceof Date ? date : new Date(date)
  const diffMs = meetingDate.getTime() - now.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  // Use Intl.DateTimeFormat to explicitly use user's locale and timezone
  const locale = navigator.language || 'en-US'

  if (diffDays === 0) {
    return new Intl.DateTimeFormat(locale, { 
      hour: '2-digit', 
      minute: '2-digit'
    }).format(meetingDate)
  } else if (diffDays === 1) {
    return 'Tomorrow'
  } else if (diffDays === -1) {
    return 'Yesterday'
  } else if (diffDays > 0 && diffDays < 7) {
    return new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(meetingDate)
  } else {
    return new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }).format(meetingDate)
  }
}

function formatDuration(duration?: number) {
  if (!duration) return ''
  // Duration is in seconds, convert to hours, minutes, and seconds
  const hours = Math.floor(duration / 3600)
  const minutes = Math.floor((duration % 3600) / 60)
  const seconds = Math.floor(duration % 60)
  
  // Always show hours, minutes, and seconds when there are hours
  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`
  }
  // Show minutes and seconds when there are minutes
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`
  }
  // Show only seconds when less than a minute
  return `${seconds}s`
}

function getMeetingDuration(meeting: MeetingSession & { createdAt?: string | Date }): number | null {
  // If duration is provided in seconds, return it
  if (meeting.duration) {
    return meeting.duration
  }
  
  // Calculate duration from startTime and endTime
  if (meeting.endTime && meeting.startTime) {
    const duration = new Date(meeting.endTime).getTime() - new Date(meeting.startTime).getTime()
    return Math.round(duration / 1000) // Return in seconds
  }
  
  // If startTime is null, use createdAt from the meeting object as start time
  if (meeting.endTime && meeting.createdAt) {
    const startTime = new Date(meeting.createdAt)
    const endTime = new Date(meeting.endTime)
    const duration = endTime.getTime() - startTime.getTime()
    return Math.round(duration / 1000) // Return in seconds
  }
  
  // For active/recording meetings, calculate from startTime or createdAt
  if (meeting.status === 'active' || meeting.status === 'recording') {
    const startTime = meeting.startTime 
      ? new Date(meeting.startTime)
      : (meeting.createdAt ? new Date(meeting.createdAt) : null)
    
    if (startTime) {
      const duration = Date.now() - startTime.getTime()
      return Math.round(duration / 1000) // Return in seconds
    }
  }
  
  return null
}

function getPlatformIcon(platform: MeetingSession['platform']): React.ReactNode {
  if (!platform?.id) {
    return null
  }
  
  const platformId = platform.id.toLowerCase()
  const iconSize = 16
  const iconClassName = "flex-shrink-0"
  
  switch (platformId) {
    case 'zoom':
      return <ZoomIcon size={iconSize} className={iconClassName} />
    case 'meet':
    case 'google-meet':
      return <GoogleMeetIcon size={iconSize} className={iconClassName} />
    case 'teams':
    case 'microsoft-teams':
      return <TeamsIcon size={iconSize} className={iconClassName} />
    default:
      return null
  }
}

export function MeetingsListView({ meetings, loading, onMeetingSelect, selectedMeeting, onMeetingDeleted }: MeetingsListViewProps) {
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
              className={`
                group p-2 rounded-md transition-colors min-w-0
                ${isSelected 
                  ? 'bg-primary/10 border border-primary/20' 
                  : 'hover:bg-muted'
                }
              `}
            >
              <div className="flex items-start gap-2 min-w-0">
                <StatusIcon className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
                <div 
                  className="flex-1 min-w-0 overflow-hidden cursor-pointer"
                  onClick={() => onMeetingSelect?.(meeting)}
                >
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
                        {getPlatformIcon(meeting.platform)}
                        <Typography variant="xs" className="truncate min-w-0">{meeting.platform.name}</Typography>
                      </div>
                    )}
                    {!meeting.platform && meeting.meetingUrl?.startsWith('desktop://') && (
                      <div className="flex items-center gap-1 flex-shrink-0 min-w-0">
                        <Video className="h-4 w-4 flex-shrink-0" />
                        <Typography variant="xs" className="truncate min-w-0">Desktop Recording</Typography>
                      </div>
                    )}
                    {meeting.participants && meeting.participants.length > 0 && (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Users className="h-3 w-3 flex-shrink-0" />
                        <Typography variant="xs">{meeting.participants.length}</Typography>
                      </div>
                    )}
                    {(() => {
                      const duration = getMeetingDuration(meeting)
                      return duration !== null && (
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Clock className="h-3 w-3 flex-shrink-0" />
                          <Typography variant="xs">{formatDuration(duration)}</Typography>
                        </div>
                      )
                    })()}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground min-w-0">
                    <Clock className="h-3 w-3 flex-shrink-0" />
                    <Typography variant="xs" className="truncate min-w-0">{formatDate(meeting.startTime)}</Typography>
                  </div>
                </div>
                {onMeetingDeleted && (
                  <Button
                    variant="ghost"
                    size="xs"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      onMeetingDeleted(meeting.id)
                    }}
                    title="Delete meeting"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

