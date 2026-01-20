import { MeetingSession } from "../../../../types/meeting-types"

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return 'Not available'
  const d = date instanceof Date ? date : new Date(date)
  if (isNaN(d.getTime())) return 'Invalid date'

  // Use Intl.DateTimeFormat to explicitly use user's locale and timezone
  return new Intl.DateTimeFormat(navigator.language || 'en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  }).format(d)
}

export function getMeetingDate(meeting: MeetingSession & { createdAt?: string | Date }): Date | string | null | undefined {
  return meeting.startTime || meeting.createdAt || null
}

export function formatDateForFilename(date: Date | string | null | undefined): string {
  if (!date) return 'meeting'
  const d = date instanceof Date ? date : new Date(date)
  if (isNaN(d.getTime())) return 'meeting'

  // Format as YYYY-MM-DD_HH-MM for filename compatibility
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}_${hours}-${minutes}`
}
