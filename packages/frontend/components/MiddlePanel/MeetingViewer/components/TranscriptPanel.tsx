import { ChevronDown, ChevronUp, Loader2, MessageSquareText, Search, X } from "lucide-react"
import type { Dispatch, ReactNode, RefObject } from "react"
import { Badge } from "../../../common/ui/badge"
import { Button } from "../../../common/ui/button"
import { Card } from "../../../common/ui/card"
import { Input } from "../../../common/ui/input"
import { Typography } from "../../../common/ui/typography"
import { TranscriptionSegment } from "../../../../types/meeting-types"
import { TranscriptSearchMatch } from "../handlers/transcript-search-handlers"
import { formatTimestamp } from "../utils/duration-formatters"

interface TranscriptPanelProps {
  transcriptScrollRef: RefObject<HTMLDivElement>
  allSegments: TranscriptionSegment[]
  transcriptionFullText: string
  isTranscriptionLoading: boolean
  videoCurrentTime: number
  searchQuery: string
  searchMatches: TranscriptSearchMatch[]
  activeSearchMatchIndex: number
  onSearchQueryChange: Dispatch<string>
  onSearchNavigate: Dispatch<'next' | 'previous'>
  onSegmentClick: Dispatch<number>
}

export function TranscriptPanel({
  transcriptScrollRef,
  allSegments,
  transcriptionFullText,
  isTranscriptionLoading,
  videoCurrentTime,
  searchQuery,
  searchMatches,
  activeSearchMatchIndex,
  onSearchQueryChange,
  onSearchNavigate,
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
          <TranscriptHeader
            searchQuery={searchQuery}
            searchMatches={searchMatches}
            activeSearchMatchIndex={activeSearchMatchIndex}
            onSearchQueryChange={onSearchQueryChange}
            onSearchNavigate={onSearchNavigate}
          />
          <div
            ref={transcriptScrollRef}
            className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2"
          >
            {allSegments.map((segment, index) => {
              const isActive = videoCurrentTime >= segment.startTime && videoCurrentTime < segment.endTime
              const segmentMatches = searchMatches.filter(match => match.segmentId === segment.id)
              const hasSearchMatch = segmentMatches.length > 0
              const isActiveSearchMatch = segmentMatches.some(match => match.index === activeSearchMatchIndex)
              return (
                <button
                  key={segment.id || index}
                  data-transcript-segment-id={segment.id}
                  data-segment-start={Math.floor(segment.startTime)}
                  className={`w-full rounded-md px-2.5 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-border ${
                    isActiveSearchMatch
                      ? 'bg-muted ring-1 ring-inset ring-border shadow-sm'
                      : isActive
                      ? 'bg-muted ring-1 ring-inset ring-border shadow-sm'
                      : hasSearchMatch
                      ? 'bg-muted/70'
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
                        {renderHighlightedTranscriptText(
                          segment.text,
                          searchQuery,
                          segmentMatches,
                          activeSearchMatchIndex
                        )}
                      </Typography>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </Card>
      ) : transcriptionFullText ? (
        <Card className="flex h-full min-h-0 flex-col overflow-hidden border-border bg-card shadow-sm">
          <TranscriptHeader
            searchQuery={searchQuery}
            searchMatches={searchMatches}
            activeSearchMatchIndex={activeSearchMatchIndex}
            onSearchQueryChange={onSearchQueryChange}
            onSearchNavigate={onSearchNavigate}
          />
          <div ref={transcriptScrollRef} className="min-h-0 flex-1 overflow-y-auto p-4">
            <Typography variant="p" className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
              {renderHighlightedTranscriptText(
                transcriptionFullText,
                searchQuery,
                searchMatches,
                activeSearchMatchIndex
              )}
            </Typography>
          </div>
        </Card>
      ) : null}
    </div>
  )
}

interface TranscriptHeaderProps {
  searchQuery: string
  searchMatches: TranscriptSearchMatch[]
  activeSearchMatchIndex: number
  onSearchQueryChange: Dispatch<string>
  onSearchNavigate: Dispatch<'next' | 'previous'>
}

function TranscriptHeader({
  searchQuery,
  searchMatches,
  activeSearchMatchIndex,
  onSearchQueryChange,
  onSearchNavigate
}: TranscriptHeaderProps) {
  const hasSearchQuery = searchQuery.trim().length > 0
  const matchCount = searchMatches.length
  const activeMatchLabel = activeSearchMatchIndex >= 0 && matchCount > 0
    ? `${activeSearchMatchIndex + 1} of ${matchCount}`
    : hasSearchQuery
    ? 'No matches'
    : ''

  return (
    <div className="flex flex-shrink-0 flex-col gap-3 border-b border-border bg-muted/30 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <MessageSquareText className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <div>
            <Typography variant="small" className="font-semibold leading-none text-foreground">
              Transcript
            </Typography>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={searchQuery}
            onChange={event => onSearchQueryChange(event.target.value)}
            onKeyDown={event => {
              if (event.key === 'Escape' && hasSearchQuery) {
                event.preventDefault()
                onSearchQueryChange('')
                return
              }

              if (event.key !== 'Enter' || matchCount === 0) return
              event.preventDefault()
              onSearchNavigate(event.shiftKey ? 'previous' : 'next')
            }}
            placeholder="Search transcript"
            variant="muted"
            className="h-8 pl-7 pr-8 text-sm"
            aria-label="Search transcript"
          />
          {hasSearchQuery && (
            <Button
              type="button"
              size="icon-xs"
              variant="ghost"
              className="absolute right-0.5 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => onSearchQueryChange('')}
              aria-label="Clear transcript search"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          )}
        </div>
        <Typography variant="small" className="w-16 text-center text-xs tabular-nums text-muted-foreground">
          {activeMatchLabel}
        </Typography>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            size="icon-xs"
            variant="ghost"
            disabled={matchCount === 0}
            onClick={() => onSearchNavigate('previous')}
            aria-label="Previous transcript match"
          >
            <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
          <Button
            type="button"
            size="icon-xs"
            variant="ghost"
            disabled={matchCount === 0}
            onClick={() => onSearchNavigate('next')}
            aria-label="Next transcript match"
          >
            <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  )
}

function renderHighlightedTranscriptText(
  text: string,
  searchQuery: string,
  matches: TranscriptSearchMatch[],
  activeSearchMatchIndex: number
): ReactNode {
  if (!searchQuery.trim() || matches.length === 0) return text

  const parts: ReactNode[] = []
  let cursorIndex = 0

  matches.forEach(match => {
    if (match.startIndex > cursorIndex) {
      parts.push(text.slice(cursorIndex, match.startIndex))
    }

    parts.push(
      <mark
        key={match.id}
        data-transcript-match-index={match.index}
        className={`rounded-sm px-0.5 ${
          match.index === activeSearchMatchIndex
            ? 'bg-muted text-foreground ring-1 ring-border'
            : 'bg-muted/70 text-foreground'
        }`}
      >
        {text.slice(match.startIndex, match.endIndex)}
      </mark>
    )

    cursorIndex = match.endIndex
  })

  if (cursorIndex < text.length) {
    parts.push(text.slice(cursorIndex))
  }

  return parts
}
