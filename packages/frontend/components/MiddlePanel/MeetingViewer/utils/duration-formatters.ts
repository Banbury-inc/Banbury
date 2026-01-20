export function formatDuration(seconds: number): string {
  if (seconds < 0) return '0s'

  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  // Always show hours, minutes, and seconds when there are hours
  if (hours > 0) {
    return `${hours}h ${mins}m ${secs}s`
  }
  // Show minutes and seconds when there are minutes
  if (mins > 0) {
    return `${mins}m ${secs}s`
  }
  // Show only seconds when less than a minute
  return `${secs}s`
}

export function formatTime(seconds: number): string {
  if (isNaN(seconds)) return '00:00'
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

export function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
