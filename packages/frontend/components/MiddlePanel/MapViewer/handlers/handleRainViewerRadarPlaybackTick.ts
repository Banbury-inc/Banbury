export function advanceRainViewerPlaybackIndex(timelineLength: number, index: number): number {
  if (timelineLength <= 0) return 0
  return (index + 1) % timelineLength
}
