import { Loader2 } from "lucide-react"
import { RefObject } from "react"
import { Badge } from "../../../ui/badge"
import { Card } from "../../../ui/card"
import { Typography } from "../../../ui/typography"
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
    <div className="w-96 flex-shrink-0">
      {isTranscriptionLoading ? (
        <Card className="border-border">
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </Card>
      ) : allSegments.length > 0 ? (
        <Card className="border-border">
          <div ref={transcriptScrollRef} className="p-1 max-h-[calc(100vh-300px)] overflow-y-auto space-y-1">
            {allSegments.map((segment, index) => (
              <div
                key={segment.id || index}
                data-segment-start={Math.floor(segment.startTime)}
                className={`px-1.5 py-1 rounded-md cursor-pointer transition-colors ${
                  videoCurrentTime >= segment.startTime && videoCurrentTime < segment.endTime
                    ? 'bg-primary/20 border border-primary/30'
                    : 'hover:bg-muted border border-transparent'
                }`}
                onClick={() => onSegmentClick(segment.startTime)}
              >
                <div className="flex items-start gap-1.5">
                  <div className="flex-shrink-0">
                    <Badge variant="outline" className="text-xs py-0 px-1.5 text-muted-foreground">
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
              </div>
            ))}
          </div>
        </Card>
      ) : transcriptionFullText ? (
        <Card className="border-border">
          <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
            <Typography variant="p" className="whitespace-pre-wrap leading-snug text-muted-foreground">
              {transcriptionFullText}
            </Typography>
          </div>
        </Card>
      ) : null}
    </div>
  )
}
