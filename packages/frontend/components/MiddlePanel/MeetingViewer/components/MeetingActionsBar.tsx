import { CalendarDays, Clock, Users, Download, FileText, Upload, Radio } from "lucide-react"
import { Button } from "../../../common/ui/button"
import { Separator } from "../../../common/ui/separator"
import { Typography } from "../../../common/ui/typography"
import { Popover, PopoverContent, PopoverTrigger } from "../../../common/ui/popover"
import { MeetingSession } from "../../../../types/meeting-types"
import { formatDuration } from "../utils/duration-formatters"
import { formatDate, getMeetingDate } from "../utils/date-formatters"

interface MeetingActionsBarProps {
  meeting: MeetingSession
  duration: number
  displayParticipantNames: Array<{ id: string; name: string }>
  videoStreamUrl: string | null
  transcriptionFullText: string
  isLoading: boolean
  onDownloadRecording: () => void
  onDownloadTranscription: () => void
  onUploadRecording: () => void
}

export function MeetingActionsBar({
  meeting,
  duration,
  displayParticipantNames,
  videoStreamUrl,
  transcriptionFullText,
  isLoading,
  onDownloadRecording,
  onDownloadTranscription,
  onUploadRecording
}: MeetingActionsBarProps) {
  const meetingTitle = meeting.title || formatDate(getMeetingDate(meeting))
  const isLiveMeeting = meeting.status === 'active' || meeting.status === 'recording'
  const isTimedLiveMeeting = isLiveMeeting && meeting.metadata.maxDuration
  const statusLabel = meeting.status.replace(/-/g, ' ')

  return (
    <div className="border-b border-border bg-card px-4 py-3 shadow-sm sm:px-6 lg:px-8">
      {/* Left: meeting identity and metadata */}
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-border bg-card shadow-sm">
            <CalendarDays className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <span className="truncate text-base font-semibold leading-tight text-foreground">
                {meetingTitle}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-medium capitalize text-muted-foreground">
                {isLiveMeeting && <Radio className="h-3 w-3 text-destructive" aria-hidden="true" />}
                {statusLabel}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {!isTimedLiveMeeting && (
                <div className="flex items-center gap-1.5 rounded-full bg-card px-2 py-1 ring-1 ring-border" aria-label="Duration">
                  <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{formatDuration(duration)}</span>
                </div>
              )}

              {displayParticipantNames.length > 0 && (
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      className="flex items-center gap-1.5 rounded-full bg-card px-2 py-1 ring-1 ring-border transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      aria-label={`${displayParticipantNames.length} participants, click to view`}
                    >
                      <Users className="h-3.5 w-3.5" />
                      <span>{displayParticipantNames.length} participants</span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-3" align="start">
                    <div className="space-y-2">
                      <Typography variant="small" className="text-xs font-semibold uppercase text-muted-foreground">
                        Participants ({displayParticipantNames.length})
                      </Typography>
                      <div className="space-y-1.5">
                        {displayParticipantNames.map((participant) => (
                          <div key={participant.id} className="rounded-md px-2 py-1 hover:bg-muted">
                            <Typography variant="p" className="text-sm leading-snug">
                              {participant.name}
                            </Typography>
                          </div>
                        ))}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              )}

              {isTimedLiveMeeting && (
                <div className="flex items-center gap-2 rounded-full bg-card px-2 py-1 ring-1 ring-border" title="Progress">
                  <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${Math.min((duration / (meeting.metadata.maxDuration * 60)) * 100, 100)}%` }}
                    />
                  </div>
                  <span>{formatDuration(duration)}/{meeting.metadata.maxDuration}m</span>
                </div>
              )}
              </div>
          </div>
        </div>

        <Separator orientation="vertical" className="hidden h-10 flex-shrink-0 md:block" />

        {/* Right: contextual actions */}
        <div className="flex flex-shrink-0 flex-wrap items-center gap-2">
          {meeting.status === 'completed' && (meeting.recordingUrl || videoStreamUrl) && (
            <Button
              size="sm"
              variant="outline"
              onClick={onDownloadRecording}
              disabled={isLoading}
            >
              <Download className="h-3.5 w-3.5" />
              Recording
            </Button>
          )}
          {(meeting.status === 'active' || meeting.status === 'completed') && !meeting.recordingUrl && !videoStreamUrl && (
            <Button
              size="sm"
              variant="outline"
              onClick={onUploadRecording}
            >
              <Upload className="h-3.5 w-3.5" />
              Upload
            </Button>
          )}
          {(meeting.transcriptionText || transcriptionFullText) && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onDownloadTranscription}
              disabled={isLoading}
            >
              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
              Transcript
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
