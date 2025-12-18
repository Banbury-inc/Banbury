import { tool } from "@langchain/core/tools"
import { z } from "zod"
import { CONFIG } from "../../../../../../frontend/config/config"
import { getServerContextValue } from "../../../../../../frontend/assistant/langraph/serverContext"

// Microsoft Calendar tools (proxy to Banbury API via Microsoft Graph). Respects user toolPreferences via server context
export const msCalendarListCalendarsTool = tool(
  async () => {
    const prefs = (getServerContextValue<any>("toolPreferences") || {}) as { msCalendar?: boolean }
    if (prefs.msCalendar === false) {
      return JSON.stringify({ success: false, error: "Microsoft Calendar access is disabled by user preference" })
    }

    const apiBase = CONFIG.url
    const token = getServerContextValue<string>("authToken")
    if (!token) {
      throw new Error("Missing auth token in server context")
    }

    const url = `${apiBase}/authentication/outlook/calendars/`
    const resp = await fetch(url, { method: 'GET', headers: { Authorization: `Bearer ${token}` } })
    if (!resp.ok) {
      return JSON.stringify({ success: false, error: `HTTP ${resp.status}: ${resp.statusText}` })
    }
    const data = await resp.json()
    return JSON.stringify({ success: true, ...data })
  },
  {
    name: 'ms_calendar_list_calendars',
    description: 'List all Microsoft Outlook calendars for the connected user',
    schema: z.object({})
  }
)

export const msCalendarListEventsTool = tool(
  async (input: {
    calendarId?: string
    timeMin?: string
    timeMax?: string
    maxResults?: number
    pageToken?: string
    query?: string
  }) => {
    const prefs = (getServerContextValue<any>("toolPreferences") || {}) as { msCalendar?: boolean }
    if (prefs.msCalendar === false) {
      return JSON.stringify({ success: false, error: "Microsoft Calendar access is disabled by user preference" })
    }

    const apiBase = CONFIG.url
    const token = getServerContextValue<string>("authToken")
    if (!token) {
      throw new Error("Missing auth token in server context")
    }

    const params = new URLSearchParams()
    if (input.calendarId) params.set('calendarId', input.calendarId)
    if (input.timeMin) params.set('timeMin', input.timeMin)
    if (input.timeMax) params.set('timeMax', input.timeMax)
    if (typeof input.maxResults === 'number') params.set('maxResults', String(input.maxResults))
    if (input.pageToken) params.set('pageToken', input.pageToken)
    if (input.query) params.set('q', input.query)

    const queryString = params.toString()
    const listUrl = `${apiBase}/authentication/outlook/events/${queryString ? `?${queryString}` : ''}`
    const resp = await fetch(listUrl, { method: 'GET', headers: { Authorization: `Bearer ${token}` } })
    if (!resp.ok) {
      return JSON.stringify({ success: false, error: `HTTP ${resp.status}: ${resp.statusText}` })
    }
    const data = await resp.json()
    return JSON.stringify({ success: true, ...data })
  },
  {
    name: 'ms_calendar_list_events',
    description: 'List Microsoft Outlook Calendar events with optional time range and query filtering',
    schema: z.object({
      calendarId: z.string().optional().describe("Calendar identifier (omit for default calendar)"),
      timeMin: z.string().optional().describe('RFC3339/ISO8601 start time filter'),
      timeMax: z.string().optional().describe('RFC3339/ISO8601 end time filter'),
      maxResults: z.number().optional().describe('Maximum events to return'),
      pageToken: z.string().optional().describe('Pagination token for next page'),
      query: z.string().optional().describe('Free-text search query')
    })
  }
)

export const msCalendarGetEventTool = tool(
  async (input: { eventId: string; calendarId?: string }) => {
    const prefs = (getServerContextValue<any>("toolPreferences") || {}) as { msCalendar?: boolean }
    if (prefs.msCalendar === false) {
      return JSON.stringify({ success: false, error: "Microsoft Calendar access is disabled by user preference" })
    }

    const apiBase = CONFIG.url
    const token = getServerContextValue<string>("authToken")
    if (!token) {
      throw new Error("Missing auth token in server context")
    }

    const params = new URLSearchParams()
    if (input.calendarId) params.set('calendarId', input.calendarId)

    const queryString = params.toString()
    const url = `${apiBase}/authentication/outlook/events/${encodeURIComponent(input.eventId)}/${queryString ? `?${queryString}` : ''}`
    const resp = await fetch(url, { method: 'GET', headers: { Authorization: `Bearer ${token}` } })
    if (!resp.ok) {
      return JSON.stringify({ success: false, error: `HTTP ${resp.status}: ${resp.statusText}` })
    }
    const data = await resp.json()
    return JSON.stringify({ success: true, event: data })
  },
  {
    name: 'ms_calendar_get_event',
    description: 'Get a specific Microsoft Outlook Calendar event by ID',
    schema: z.object({
      eventId: z.string().describe('The event ID'),
      calendarId: z.string().optional().describe("Calendar identifier (omit for default calendar)")
    })
  }
)

export const msCalendarCreateEventTool = tool(
  async (input: { calendarId?: string; event: Record<string, any> }) => {
    const prefs = (getServerContextValue<any>("toolPreferences") || {}) as { msCalendar?: boolean }
    if (prefs.msCalendar === false) {
      return JSON.stringify({ success: false, error: "Microsoft Calendar access is disabled by user preference" })
    }

    const apiBase = CONFIG.url
    const token = getServerContextValue<string>("authToken")
    if (!token) {
      throw new Error("Missing auth token in server context")
    }

    const url = `${apiBase}/authentication/outlook/events/`
    const resp = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ calendarId: input.calendarId, event: input.event })
    })
    if (!resp.ok) {
      return JSON.stringify({ success: false, error: `HTTP ${resp.status}: ${resp.statusText}` })
    }
    const data = await resp.json()
    return JSON.stringify({ success: true, event: data })
  },
  {
    name: 'ms_calendar_create_event',
    description: 'Create a new Microsoft Outlook Calendar event. Event payload should include summary, start, end, and optionally description, location, attendees.',
    schema: z.object({
      calendarId: z.string().optional().describe("Calendar identifier (omit for default calendar)"),
      event: z.record(z.any()).describe('Event payload with fields: summary (string), start (ISO datetime), end (ISO datetime), description (optional), location (optional), attendees (optional array of {email})')
    })
  }
)

export const msCalendarUpdateEventTool = tool(
  async (input: { eventId: string; calendarId?: string; event: Record<string, any> }) => {
    const prefs = (getServerContextValue<any>("toolPreferences") || {}) as { msCalendar?: boolean }
    if (prefs.msCalendar === false) {
      return JSON.stringify({ success: false, error: "Microsoft Calendar access is disabled by user preference" })
    }

    const apiBase = CONFIG.url
    const token = getServerContextValue<string>("authToken")
    if (!token) {
      throw new Error("Missing auth token in server context")
    }

    const url = `${apiBase}/authentication/outlook/events/${encodeURIComponent(input.eventId)}/`
    const resp = await fetch(url, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ calendarId: input.calendarId, event: input.event })
    })
    if (!resp.ok) {
      return JSON.stringify({ success: false, error: `HTTP ${resp.status}: ${resp.statusText}` })
    }
    const data = await resp.json()
    return JSON.stringify({ success: true, event: data })
  },
  {
    name: 'ms_calendar_update_event',
    description: 'Update an existing Microsoft Outlook Calendar event',
    schema: z.object({
      eventId: z.string().describe('The event ID to update'),
      calendarId: z.string().optional().describe("Calendar identifier (omit for default calendar)"),
      event: z.record(z.any()).describe('Partial event payload with fields to update: summary, start, end, description, location, attendees')
    })
  }
)

export const msCalendarDeleteEventTool = tool(
  async (input: { eventId: string; calendarId?: string }) => {
    const prefs = (getServerContextValue<any>("toolPreferences") || {}) as { msCalendar?: boolean }
    if (prefs.msCalendar === false) {
      return JSON.stringify({ success: false, error: "Microsoft Calendar access is disabled by user preference" })
    }

    const apiBase = CONFIG.url
    const token = getServerContextValue<string>("authToken")
    if (!token) {
      throw new Error("Missing auth token in server context")
    }

    const params = new URLSearchParams()
    if (input.calendarId) params.set('calendarId', input.calendarId)

    const queryString = params.toString()
    const url = `${apiBase}/authentication/outlook/events/${encodeURIComponent(input.eventId)}/${queryString ? `?${queryString}` : ''}`
    const resp = await fetch(url, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    if (!resp.ok) {
      return JSON.stringify({ success: false, error: `HTTP ${resp.status}: ${resp.statusText}` })
    }
    const data = await resp.json().catch(() => ({}))
    return JSON.stringify({ success: true, result: data })
  },
  {
    name: 'ms_calendar_delete_event',
    description: 'Delete a Microsoft Outlook Calendar event by ID',
    schema: z.object({
      eventId: z.string().describe('The event ID to delete'),
      calendarId: z.string().optional().describe("Calendar identifier (omit for default calendar)")
    })
  }
)

