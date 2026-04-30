/**
 * Formats a date as a relative time string (e.g. "just now", "30s ago", "1m ago").
 */
export function formatRelative(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)

  if (diffSec < 5) return 'just now'
  if (diffSec < 60) return `${diffSec}s ago`
  if (diffMin < 60) return `${diffMin}m ago`
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}
