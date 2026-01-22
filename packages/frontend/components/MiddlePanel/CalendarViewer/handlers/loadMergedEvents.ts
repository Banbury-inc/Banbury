import { ApiService } from '../../../../../backend/api/apiService'
import { CalendarEvent } from '../../../../../backend/api/calendar/calendar'
import { getSelectedProvider } from '../../../LeftPanel/components/CalendarTab/calendarProvider'

interface LoadMergedEventsParams {
  calendarIds: string[]
  timeMin: string
  timeMax: string
  maxResults?: number
  singleEvents?: boolean
  orderBy?: 'startTime' | 'updated'
}

/**
 * Load and merge events from multiple calendars
 * Each event is tagged with its calendarId for proper edit/delete routing
 */
export async function loadMergedEvents(params: LoadMergedEventsParams): Promise<CalendarEvent[]> {
  const { calendarIds, timeMin, timeMax, maxResults = 2500, singleEvents = true, orderBy = 'startTime' } = params

  if (calendarIds.length === 0) return []

  const provider = getSelectedProvider()
  const CalendarApi = provider === 'microsoft' ? ApiService.OutlookCalendar : ApiService.Calendar

  const eventPromises = calendarIds.map(async (calendarId) => {
    try {
      const resp = await CalendarApi.listEvents({
        calendarId,
        timeMin,
        timeMax,
        maxResults,
        singleEvents,
        orderBy
      })
      return (resp.items || []).map(event => ({ ...event, calendarId }))
    } catch (err) {
      console.warn(`Failed to load events for calendar ${calendarId}:`, err)
      return []
    }
  })

  const results = await Promise.all(eventPromises)
  const allEvents = results.flat()
  
  // Deduplicate events by ID - "primary" and email-based calendar IDs can return the same events
  const seenIds = new Set<string>()
  const deduplicatedEvents = allEvents.filter(event => {
    if (seenIds.has(event.id)) return false
    seenIds.add(event.id)
    return true
  })
  
  deduplicatedEvents.sort((a, b) => {
    const aStart = a.start?.dateTime || a.start?.date || ''
    const bStart = b.start?.dateTime || b.start?.date || ''
    return aStart.localeCompare(bStart)
  })

  return deduplicatedEvents
}

