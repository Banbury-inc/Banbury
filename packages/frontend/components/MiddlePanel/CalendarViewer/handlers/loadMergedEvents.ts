import { ApiService } from '../../../../../backend/api/apiService'
import { CalendarEvent } from '../../../../../backend/api/calendar/calendar'

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
  // #region agent log
  fetch('http://127.0.0.1:7244/ingest/b014ea10-a539-4e5f-9832-890e328944bb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'loadMergedEvents.ts:entry',message:'loadMergedEvents called',data:{calendarIds,timeMin,timeMax},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H3'})}).catch(()=>{});
  // #endregion

  if (calendarIds.length === 0) return []

  const eventPromises = calendarIds.map(async (calendarId) => {
    try {
      const resp = await ApiService.Calendar.listEvents({
        calendarId,
        timeMin,
        timeMax,
        maxResults,
        singleEvents,
        orderBy
      })
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/b014ea10-a539-4e5f-9832-890e328944bb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'loadMergedEvents.ts:perCalendar',message:'Events fetched for calendar',data:{calendarId,eventsCount:(resp.items||[]).length,eventSummaries:(resp.items||[]).slice(0,5).map(e=>e.summary)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H3'})}).catch(()=>{});
      // #endregion
      return (resp.items || []).map(event => ({ ...event, calendarId }))
    } catch (err) {
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/b014ea10-a539-4e5f-9832-890e328944bb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'loadMergedEvents.ts:error',message:'Failed to load events for calendar',data:{calendarId,error:String(err)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H3'})}).catch(()=>{});
      // #endregion
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
  // #region agent log
  const duplicatesRemoved = allEvents.length - deduplicatedEvents.length
  fetch('http://127.0.0.1:7244/ingest/b014ea10-a539-4e5f-9832-890e328944bb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'loadMergedEvents.ts:dedup',message:'Deduplication complete',data:{allEventsCount:allEvents.length,deduplicatedCount:deduplicatedEvents.length,duplicatesRemoved,calendarBreakdown:calendarIds.map(cid=>({calendarId:cid,count:deduplicatedEvents.filter(e=>e.calendarId===cid).length}))},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H4'})}).catch(()=>{});
  // #endregion
  
  deduplicatedEvents.sort((a, b) => {
    const aStart = a.start?.dateTime || a.start?.date || ''
    const bStart = b.start?.dateTime || b.start?.date || ''
    return aStart.localeCompare(bStart)
  })

  return deduplicatedEvents
}

