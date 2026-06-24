import { RefObject } from "react"
import { TranscriptionSegment } from "../../../../types/meeting-types"

export interface TranscriptSearchMatch {
  id: string
  index: number
  startIndex: number
  endIndex: number
  segmentId?: string
  startTime?: number
}

interface FindTranscriptSearchMatchesOptions {
  query: string
  segments: TranscriptionSegment[]
  fullText: string
}

export function findTranscriptSearchMatches({
  query,
  segments,
  fullText
}: FindTranscriptSearchMatchesOptions): TranscriptSearchMatch[] {
  const normalizedQuery = query.trim().toLocaleLowerCase()
  if (!normalizedQuery) return []

  const matches: TranscriptSearchMatch[] = []
  const sourceSegments = segments.length > 0
    ? segments
    : [{
      id: 'full-transcript',
      speakerId: 'transcript',
      speakerName: 'Transcript',
      text: fullText,
      startTime: 0,
      endTime: 0,
      confidence: 1
    }]

  sourceSegments.forEach(segment => {
    const normalizedText = segment.text.toLocaleLowerCase()
    let startIndex = normalizedText.indexOf(normalizedQuery)

    while (startIndex !== -1) {
      const index = matches.length
      matches.push({
        id: `${segment.id}-${startIndex}-${index}`,
        index,
        startIndex,
        endIndex: startIndex + query.trim().length,
        segmentId: segment.id,
        startTime: segments.length > 0 ? segment.startTime : undefined
      })

      startIndex = normalizedText.indexOf(normalizedQuery, startIndex + normalizedQuery.length)
    }
  })

  return matches
}

export function getTranscriptSearchIndex(
  currentIndex: number,
  matchCount: number,
  direction: 'next' | 'previous'
): number {
  if (matchCount === 0) return -1
  if (currentIndex < 0) return direction === 'previous' ? matchCount - 1 : 0
  if (direction === 'previous') return (currentIndex - 1 + matchCount) % matchCount

  return (currentIndex + 1) % matchCount
}

export function scrollTranscriptMatchIntoView(
  transcriptScrollRef: RefObject<HTMLDivElement>,
  matchIndex: number
): void {
  const scrollContainer = transcriptScrollRef.current
  if (!scrollContainer || matchIndex < 0) return

  const target = scrollContainer.querySelector<HTMLElement>(
    `[data-transcript-match-index="${matchIndex}"]`
  )

  target?.scrollIntoView({
    behavior: 'smooth',
    block: 'center',
    inline: 'nearest'
  })
}
