import React, { useEffect, useRef, useState } from 'react'
import { MeetingSession } from '../../../../../types/meeting-types'
import { Typography } from '../../../../common/ui/typography'
import { Button } from '../../../../common/ui/button'
import { Video, Clock, Users, CheckCircle2, XCircle, PlayCircle, Calendar, Trash2 } from 'lucide-react'
import { MeetingContextMenu } from './MeetingContextMenu'
import {
  handleMeetingRenameKeyDown,
  handleStartMeetingRename,
  handleSubmitMeetingRename
} from './handlers/meetingRenameHandlers'

interface MeetingsListViewProps {
  meetings: MeetingSession[]
  loading: boolean
  onMeetingSelect?: (meeting: MeetingSession) => void
  selectedMeeting?: MeetingSession | null
  onMeetingDeleted?: (meetingId: string) => void
  onMeetingRename?: (meeting: MeetingSession, title: string) => Promise<boolean> | boolean | void
  onMeetingShare?: (meeting: MeetingSession) => void
  onMeetingCopyUrl?: (meeting: MeetingSession) => void
  onMeetingDownloadRecording?: (meeting: MeetingSession) => void
  onMeetingDownloadTranscript?: (meeting: MeetingSession) => void
}

type MeetingStatus = MeetingSession['status']

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

function getValidDate(date: Date | string | null | undefined) {
  if (!date) return null

  const parsedDate = date instanceof Date ? date : new Date(date)
  if (isNaN(parsedDate.getTime())) return null

  return parsedDate
}

function formatDate(date: Date | string | null | undefined) {
  const meetingDate = getValidDate(date)
  if (!meetingDate) return 'No date available'

  const now = new Date()
  const diffMs = meetingDate.getTime() - now.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  // Use Intl.DateTimeFormat to explicitly use user's locale and timezone
  const locale = navigator.language || 'en-US'

  if (diffDays === 0) {
    return new Intl.DateTimeFormat(locale, { 
      hour: '2-digit', 
      minute: '2-digit'
    }).format(meetingDate)
  }

  if (diffDays === 1) return 'Tomorrow'
  if (diffDays === -1) return 'Yesterday'
  if (diffDays > 0 && diffDays < 7) return new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(meetingDate)

  return new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }).format(meetingDate)
}

function formatDateTime(date: Date | string | null | undefined) {
  const meetingDate = getValidDate(date)
  if (!meetingDate) return 'No date available'
  
  // Use Intl.DateTimeFormat to explicitly use user's locale and timezone
  return new Intl.DateTimeFormat(navigator.language || 'en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  }).format(meetingDate)
}

function getMeetingDate(meeting: MeetingSession & { createdAt?: string | Date }): Date | string | null | undefined {
  return getValidDate(meeting.startTime) ?? getValidDate(meeting.createdAt)
}

export function MeetingsListView({
  meetings,
  loading,
  onMeetingSelect,
  selectedMeeting,
  onMeetingDeleted,
  onMeetingRename,
  onMeetingShare,
  onMeetingCopyUrl,
  onMeetingDownloadRecording,
  onMeetingDownloadTranscript
}: MeetingsListViewProps) {
  const [renamingMeetingId, setRenamingMeetingId] = useState<string | null>(null)
  const [renameTitle, setRenameTitle] = useState('')
  const inputRef = useRef<HTMLInputElement | null>(null)

  const getMeetingEditableTitle = (meeting: MeetingSession) => meeting.title || 'Untitled meeting'

  const getMeetingDisplayTitle = (meeting: MeetingSession) =>
    meeting.title || formatDateTime(getMeetingDate(meeting))

  useEffect(() => {
    if (!renamingMeetingId || !inputRef.current) return

    inputRef.current.focus()
    inputRef.current.select()
  }, [renamingMeetingId])

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
          const isRenaming = renamingMeetingId === meeting.id
          const meetingDate = getMeetingDate(meeting)

          const row = (
            <div
              className={`
                group p-2 rounded-md transition-colors min-w-0
                ${isSelected 
                  ? 'bg-primary/10' 
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
                    {isRenaming ? (
                      <input
                        ref={inputRef}
                        type="text"
                        value={renameTitle}
                        onChange={(event) => setRenameTitle(event.target.value)}
                        onBlur={() => handleSubmitMeetingRename({
                          meeting,
                          renameTitle,
                          setRenamingMeetingId,
                          setRenameTitle,
                          onMeetingRename
                        })}
                        onKeyDown={(event) => handleMeetingRenameKeyDown({
                          event,
                          meeting,
                          renameTitle,
                          setRenamingMeetingId,
                          setRenameTitle,
                          onMeetingRename
                        })}
                        onClick={(event) => event.stopPropagation()}
                        className="min-w-0 flex-1 rounded border-none bg-muted px-1 py-0 text-xs font-medium text-foreground outline-none"
                      />
                    ) : (
                      <Typography variant="xs" className="font-medium truncate flex-1 min-w-0">
                        {getMeetingDisplayTitle(meeting)}
                      </Typography>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-1 min-w-0 flex-wrap">
                    {meeting.platform && (
                      <div className="flex items-center gap-1 flex-shrink-0 min-w-0">
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
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground min-w-0">
                    <Clock className="h-3 w-3 flex-shrink-0" />
                    <Typography variant="xs" className="truncate min-w-0">{formatDate(meetingDate)}</Typography>
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

          return (
            <MeetingContextMenu
              key={meeting.id}
              onOpen={() => onMeetingSelect?.(meeting)}
              onRename={() => handleStartMeetingRename({
                meeting,
                setRenamingMeetingId,
                setRenameTitle,
                getMeetingDisplayTitle: getMeetingEditableTitle
              })}
              onShare={() => onMeetingShare?.(meeting)}
              onCopyUrl={() => onMeetingCopyUrl?.(meeting)}
              onDownloadRecording={() => onMeetingDownloadRecording?.(meeting)}
              onDownloadTranscript={() => onMeetingDownloadTranscript?.(meeting)}
              onDelete={() => onMeetingDeleted?.(meeting.id)}
            >
              {row}
            </MeetingContextMenu>
          )
        })}
      </div>
    </div>
  )
}

