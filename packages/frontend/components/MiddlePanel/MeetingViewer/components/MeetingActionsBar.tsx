import { Clock, Users, Download, FileText, Upload } from "lucide-react"
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
  return (
    <div className="px-4 py-2.5 bg-card border-b border-border flex items-center gap-3">
      {/* Left: meeting identity and metadata */}
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <span className="text-sm font-medium truncate">
          {meeting.title || formatDate(getMeetingDate(meeting))}
        </span>

        <Separator orientation="vertical" className="h-4 flex-shrink-0" />

        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-shrink-0">
          {!((meeting.status === 'active' || meeting.status === 'recording') && meeting.metadata.maxDuration) && (
            <div className="flex items-center gap-1" aria-label="Duration">
              <Clock className="h-3 w-3" aria-hidden="true" />
              <span>{formatDuration(duration)}</span>
            </div>
          )}

          {displayParticipantNames.length > 0 && (
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className="flex items-center gap-1 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded"
                  aria-label={`${displayParticipantNames.length} participants — click to view`}
                >
                  <Users className="h-3 w-3" />
                  <span>{displayParticipantNames.length}</span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-3" align="start">
                <div className="space-y-2">
                  <Typography variant="small" className="font-semibold text-xs text-muted-foreground uppercase">
                    Participants ({displayParticipantNames.length})
                  </Typography>
                  <div className="space-y-1.5">
                    {displayParticipantNames.map((participant) => (
                      <div key={participant.id}>
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

          {(meeting.status === 'active' || meeting.status === 'recording') && meeting.metadata.maxDuration && (
            <div className="flex items-center gap-1.5" title="Progress">
              <div className="w-16 h-1 bg-muted rounded-full overflow-hidden">
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

      {/* Right: contextual actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {meeting.status === 'completed' && (meeting.recordingUrl || videoStreamUrl) && (
          <Button
            size="xs"
            variant="outline"
            onClick={onDownloadRecording}
            disabled={isLoading}
          >
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Download Recording
          </Button>
        )}
        {(meeting.status === 'active' || meeting.status === 'completed') && !meeting.recordingUrl && !videoStreamUrl && (
          <Button
            size="xs"
            variant="outline"
            onClick={onUploadRecording}
          >
            <Upload className="h-3.5 w-3.5 mr-1.5" />
            Upload Recording
          </Button>
        )}
        {(meeting.transcriptionText || transcriptionFullText) && (
          <Button
            size="xs"
            variant="ghost"
            onClick={onDownloadTranscription}
            disabled={isLoading}
          >
            <FileText className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
            <span className="text-xs">Transcript</span>
          </Button>
        )}
      </div>
    </div>
  )
}
