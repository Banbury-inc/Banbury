import { Loader2, MessageSquareText } from "lucide-react"
import { RefObject } from "react"
import { Badge } from "../../../common/ui/badge"
import { Card } from "../../../common/ui/card"
import { Typography } from "../../../common/ui/typography"
import { TranscriptionSegment } from "../../../../types/meeting-types"
import { formatTimestamp } from "../utils/duration-formatters"

interface TranscriptPanelProps {
  transcriptScrollRef: RefObject<HTMLDivElement>
  allSegments: TranscriptionSegment[]
  transcriptionFullText: string
  isTranscriptionLoading: boolean
  videoCurrentTime: number
  onSegmentClick: (startTime: number) => void
}

export function TranscriptPanel({
  transcriptScrollRef,
  allSegments,
  transcriptionFullText,
  isTranscriptionLoading,
  videoCurrentTime,
  onSegmentClick
}: TranscriptPanelProps) {
  return (
    <div className="min-h-0 w-full flex-shrink-0 lg:w-[22rem] lg:min-w-80">
      {isTranscriptionLoading ? (
        <Card className="overflow-hidden border-border bg-card shadow-sm">
          <div className="flex items-center justify-center p-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-label="Loading transcript" />
          </div>
        </Card>
      ) : allSegments.length > 0 ? (
        <Card className="flex h-full min-h-0 flex-col overflow-hidden border-border bg-card shadow-sm">
          <div className="flex flex-shrink-0 items-center justify-between border-b border-border bg-muted/35 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-background ring-1 ring-border">
                <MessageSquareText className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              </div>
              <div>
                <Typography variant="small" className="font-semibold leading-none text-foreground">
                  Transcript
                </Typography>
                <Typography variant="p" className="mt-1 text-xs leading-none text-muted-foreground">
                  Click a line to jump in the recording
                </Typography>
              </div>
            </div>
            <Badge variant="outline" className="bg-background px-2 py-0.5 text-[11px] text-muted-foreground">
              {allSegments.length}
            </Badge>
          </div>
          <div
            ref={transcriptScrollRef}
            className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2"
          >
            {allSegments.map((segment, index) => {
              const isActive = videoCurrentTime >= segment.startTime && videoCurrentTime < segment.endTime
              return (
                <button
                  key={segment.id || index}
                  data-segment-start={Math.floor(segment.startTime)}
                  className={`w-full rounded-xl px-2.5 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    isActive
                      ? 'bg-primary/10 ring-1 ring-inset ring-primary/30 shadow-sm'
                      : 'hover:bg-muted/70'
                  }`}
                  onClick={() => onSegmentClick(segment.startTime)}
                  aria-label={`Seek to ${formatTimestamp(segment.startTime)}, ${segment.speakerName || 'Speaker'}`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="flex-shrink-0 pt-0.5">
                      <Badge variant="outline" className="bg-background px-1.5 py-0 text-[10px] font-medium tabular-nums text-muted-foreground" aria-hidden="true">
                        {formatTimestamp(segment.startTime)}
                      </Badge>
                    </div>
                    <div className="flex-1 min-w-0">
                      <Typography variant="small" className="font-semibold leading-tight text-foreground">
                        {segment.speakerName || 'Speaker'}
                      </Typography>
                      <Typography variant="p" className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        {segment.text}
                      </Typography>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </Card>
      ) : transcriptionFullText ? (
        <Card className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border-border bg-card shadow-sm">
          <div className="flex flex-shrink-0 items-center gap-2 border-b border-border bg-muted/35 px-4 py-3">
            <MessageSquareText className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <Typography variant="small" className="font-semibold text-foreground">
              Transcript
            </Typography>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            <Typography variant="p" className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
              {transcriptionFullText}
            </Typography>
          </div>
        </Card>
      ) : null}
    </div>
  )
}
