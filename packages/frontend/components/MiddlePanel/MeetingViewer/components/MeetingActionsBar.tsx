import { Clock, Users, Video, VideoOff, Mic, MicOff, Download, FileText, Upload } from "lucide-react"
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
    <div className="px-6 py-3 bg-card border-b border-border flex items-center gap-4 flex-wrap">
      {/* Compact Meeting Details - Single line with icons */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5" title="Duration">
          <Clock className="h-3.5 w-3.5" />
          <span>{formatDuration(duration)}</span>
        </div>
        {displayParticipantNames.length > 0 ? (
          <Popover>
            <PopoverTrigger asChild>
              <div className="flex items-center gap-1.5 cursor-pointer hover:text-foreground transition-colors" title="Participants">
                <Users className="h-3.5 w-3.5" />
                <span>{displayParticipantNames.length}</span>
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3" align="start">
              <div className="space-y-2">
                <Typography variant="small" className="font-semibold text-xs text-muted-foreground uppercase mb-2">
                  Participants ({displayParticipantNames.length})
                </Typography>
                <div className="space-y-1.5">
                  {displayParticipantNames.map((participant) => (
                    <div key={participant.id} className="flex items-start gap-2">
                      <Typography variant="p" className="text-sm leading-snug">
                        {participant.name}
                      </Typography>
                    </div>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        ) : (
          <div className="flex items-center gap-1.5" title="Participants">
            <Users className="h-3.5 w-3.5" />
            <span>0</span>
          </div>
        )}
        {/* Progress for active sessions */}
        {(meeting.status === 'active' || meeting.status === 'recording') && meeting.metadata.maxDuration && (
          <div className="flex items-center gap-1.5" title="Progress">
            <div className="w-16 h-1 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary"
                style={{ width: `${Math.min((duration / (meeting.metadata.maxDuration * 60)) * 100, 100)}%` }}
              />
            </div>
            <span className="text-xs">{formatDuration(duration)}/{meeting.metadata.maxDuration}m</span>
          </div>
        )}
      </div>

      <Separator orientation="vertical" className="h-5" />
      <Typography variant="xs"> {meeting.title || formatDate(getMeetingDate(meeting))}</Typography>
      <Separator orientation="vertical" className="h-5" />

      {meeting.status === 'completed' && (meeting.recordingUrl || videoStreamUrl) && (
        <Button
          size="xs"
          variant="outline"
          onClick={onDownloadRecording}
          disabled={isLoading}
        >
          <Download className="h-4 w-4 mr-2" />
          Download Recording
        </Button>
      )}
      {(meeting.status === 'active' || meeting.status === 'completed') && !meeting.recordingUrl && !videoStreamUrl && (
        <Button
          size="xs"
          variant="outline"
          onClick={onUploadRecording}
        >
          <Upload className="h-4 w-4 mr-2" />
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
          <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
          <Typography variant="xs">Download Transcription</Typography>
        </Button>
      )}
    </div>
  )
}
