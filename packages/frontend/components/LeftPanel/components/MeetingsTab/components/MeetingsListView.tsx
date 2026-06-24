import React, { useEffect, useRef, useState } from 'react'
import { MeetingSession } from '../../../../../types/meeting-types'
import { Typography } from '../../../../common/ui/typography'
import { Button } from '../../../../common/ui/button'
import { Monitor, Phone, Trash2, Users, Video } from 'lucide-react'
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

function getValidDate(date: Date | string | null | undefined) {
  if (!date) return null

  const parsedDate = date instanceof Date ? date : new Date(date)
  if (isNaN(parsedDate.getTime())) return null

  return parsedDate
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

function getPlatformId(meeting: MeetingSession) {
  const platformId = meeting.platform?.id || meeting.platform?.name
  if (platformId) return platformId.toLowerCase()
  if (meeting.meetingUrl?.startsWith('desktop://')) return 'desktop'

  return 'unknown'
}

function PlatformIcon({ meeting }: { meeting: MeetingSession }) {
  const platformId = getPlatformId(meeting)
  const iconClassName = 'h-4 w-4 flex-shrink-0 text-muted-foreground'

  if (platformId.includes('desktop')) return <Monitor className={iconClassName} strokeWidth={1.5} aria-hidden="true" />
  if (platformId.includes('teams')) return <Users className={iconClassName} strokeWidth={1.5} aria-hidden="true" />
  if (platformId.includes('meet') || platformId.includes('google')) return <Phone className={iconClassName} strokeWidth={1.5} aria-hidden="true" />

  return <Video className={iconClassName} strokeWidth={1.5} aria-hidden="true" />
}

export function MeetingsListView({
  meetings,
  loading,
  onMeetingSelect,
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
      <div className="space-y-0.5 p-1.5">
        {meetings.map((meeting) => {
          const isRenaming = renamingMeetingId === meeting.id
          const meetingTitle = getMeetingDisplayTitle(meeting)

          const row = (
            <div
              className="group flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-muted-foreground transition-colors hover:bg-muted min-w-0"
              onClick={() => onMeetingSelect?.(meeting)}
            >
                <PlatformIcon meeting={meeting} />
                <div 
                  className="flex-1 min-w-0 overflow-hidden"
                >
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
                      className="w-full min-w-0 rounded border-none bg-muted px-1 py-0 text-xs font-medium text-foreground outline-none"
                    />
                  ) : (
                    <Typography variant="xs" className="truncate font-medium leading-5 text-muted-foreground group-hover:text-foreground">
                      {meetingTitle}
                    </Typography>
                  )}
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
                    aria-label={`Delete ${meetingTitle}`}
                    title="Delete meeting"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                )}
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

