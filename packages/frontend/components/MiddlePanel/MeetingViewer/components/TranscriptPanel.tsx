import { Loader2 } from "lucide-react"
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
    <div className="w-full lg:w-80 lg:min-w-64 flex-shrink-0 self-start lg:sticky lg:top-4">
      {isTranscriptionLoading ? (
        <Card className="border-border">
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </Card>
      ) : allSegments.length > 0 ? (
        <Card className="border-border">
          <div
            ref={transcriptScrollRef}
            className="p-1.5 max-h-[calc(100svh-80px)] overflow-y-auto space-y-0.5"
          >
            {allSegments.map((segment, index) => {
              const isActive = videoCurrentTime >= segment.startTime && videoCurrentTime < segment.endTime
              return (
                <button
                  key={segment.id || index}
                  data-segment-start={Math.floor(segment.startTime)}
                  className={`w-full text-left px-1.5 py-1 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
                    isActive
                      ? 'bg-primary/10 ring-1 ring-inset ring-primary/30'
                      : 'hover:bg-muted/60'
                  }`}
                  onClick={() => onSegmentClick(segment.startTime)}
                  aria-label={`Seek to ${formatTimestamp(segment.startTime)} — ${segment.speakerName || 'Speaker'}`}
                >
                  <div className="flex items-start gap-1.5">
                    <div className="flex-shrink-0 pt-0.5">
                      <Badge variant="outline" className="text-xs py-0 px-1.5 text-muted-foreground font-mono" aria-hidden="true">
                        {formatTimestamp(segment.startTime)}
                      </Badge>
                    </div>
                    <div className="flex-1 min-w-0">
                      <Typography variant="small" className="font-medium text-foreground leading-tight">
                        {segment.speakerName || 'Speaker'}
                      </Typography>
                      <Typography variant="p" className="text-sm text-muted-foreground leading-snug">
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
        <Card className="border-border">
          <div className="p-3 max-h-[calc(100svh-80px)] overflow-y-auto">
            <Typography variant="p" className="whitespace-pre-wrap leading-relaxed text-sm text-muted-foreground">
              {transcriptionFullText}
            </Typography>
          </div>
        </Card>
      ) : null}
    </div>
  )
}
