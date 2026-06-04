export function clampRainViewerFrameIndex(timelineLength: number, index: number): number {
  if (timelineLength <= 0) return 0
  return Math.max(0, Math.min(timelineLength - 1, index))
}

export function stepRainViewerFrameIndex(timelineLength: number, index: number, direction: -1 | 1): number {
  if (timelineLength <= 0) return 0
  return (index + direction + timelineLength) % timelineLength
}

export function formatRainViewerFrameUtc(unixSeconds: number): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'UTC',
  }).format(new Date(unixSeconds * 1000))
}
