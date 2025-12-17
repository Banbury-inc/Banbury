import { ApiService } from "../../../backend/api/apiService"
import { CalendarEvent } from "../../../backend/api/calendar/calendar"
import { FileSystemItem } from "../../utils/fileTreeUtils"

export interface FileSearchResult {
  file_id: string
  file_name: string
  file_path: string
  file_type: string
  file_size: number
  date_uploaded: string
  date_modified: string
  s3_url: string
  device_name: string
}

export interface EmailSearchResult {
  id: string
  threadId: string
  snippet?: string
  payload?: {
    headers?: Array<{ name: string; value: string }>
  }
  internalDate?: string
}

export async function searchFiles(query: string): Promise<FileSearchResult[]> {
  if (!query.trim()) return []
  
  try {
    const response = await ApiService.searchS3Files(query)
    if (response?.result === 'success') {
      return response.files || []
    }
    return []
  } catch (error) {
    console.error('Error searching files:', error)
    return []
  }
}

export async function searchEmails(query: string): Promise<EmailSearchResult[]> {
  if (!query.trim()) return []
  
  try {
    const response = await ApiService.Emails.searchEmails(query)
    return response?.messages || []
  } catch (error) {
    console.error('Error searching emails:', error)
    return []
  }
}

export async function searchCalendarEvents(query: string): Promise<CalendarEvent[]> {
  if (!query.trim()) return []
  
  // Search within -90 days to +365 days from now
  const now = new Date()
  const timeMin = new Date(now)
  timeMin.setDate(timeMin.getDate() - 90)
  const timeMax = new Date(now)
  timeMax.setFullYear(timeMax.getFullYear() + 1)
  
  try {
    const response = await ApiService.Calendar.listEvents({
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      query,
      maxResults: 20,
      singleEvents: true,
      orderBy: 'startTime'
    })
    return response?.items || []
  } catch (error) {
    console.error('Error searching calendar events:', error)
    return []
  }
}

export function toFileSystemItem(result: FileSearchResult): FileSystemItem {
  return {
    file_id: result.file_id,
    name: result.file_name,
    path: result.file_path,
    type: 'file',
    size: result.file_size,
    modified: result.date_modified,
    created: result.date_uploaded,
    device_name: result.device_name,
    s3_url: result.s3_url,
  }
}

export function getEmailLabel(email: EmailSearchResult): { subject: string; from: string | null } {
  const headers = email.payload?.headers || []
  const getHeader = (name: string) => 
    headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || ''
  
  const subject = getHeader('subject') || '(No Subject)'
  const fromRaw = getHeader('from')
  
  // Extract display name or email from "Name <email>" format
  let from: string | null = null
  if (fromRaw) {
    const match = fromRaw.match(/^([^<]+)/)
    from = match ? match[1].replace(/"/g, '').trim() : fromRaw
  }
  
  return { subject, from }
}

export function getCalendarLabel(event: CalendarEvent): { summary: string; dateStr: string } {
  const summary = event.summary || '(No title)'
  
  const startDt = event.start?.dateTime || event.start?.date
  let dateStr = ''
  if (startDt) {
    const date = new Date(startDt)
    if (!isNaN(date.getTime())) {
      const isAllDay = !event.start?.dateTime
      if (isAllDay) {
        dateStr = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
      } else {
        dateStr = date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
      }
    }
  }
  
  return { summary, dateStr }
}

export function getCalendarEventDate(event: CalendarEvent): Date | null {
  const startDt = event.start?.dateTime || event.start?.date
  if (!startDt) return null
  const date = new Date(startDt)
  return isNaN(date.getTime()) ? null : date
}

