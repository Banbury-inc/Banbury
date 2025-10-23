import { tool } from "@langchain/core/tools"
import { z } from "zod"
import { CONFIG } from "../../../../../../src/config/config"
import { getServerContextValue } from "../../../../../../src/assistant/langraph/serverContext"

// Google Calendar tools (proxy to Banbury API). Respects user toolPreferences via server context
export const calendarListEventsTool = tool(
  async (input: {
    calendarId?: string
    timeMin?: string
    timeMax?: string
    maxResults?: number
    pageToken?: string
    query?: string
    singleEvents?: boolean
    orderBy?: 'startTime' | 'updated'
  }) => {
    const prefs = (getServerContextValue<any>("toolPreferences") || {}) as { calendar?: boolean }
    if (prefs.calendar === false) {
      return JSON.stringify({ success: false, error: "Calendar access is disabled by user preference" })
    }

    const apiBase = CONFIG.url
    const token = getServerContextValue<string>("authToken")
    if (!token) {
      throw new Error("Missing auth token in server context")
    }

    const params = new URLSearchParams()
    params.set('calendarId', input.calendarId || 'primary')
    if (input.timeMin) params.set('timeMin', input.timeMin)
    if (input.timeMax) params.set('timeMax', input.timeMax)
    if (typeof input.maxResults === 'number') params.set('maxResults', String(input.maxResults))
    if (input.pageToken) params.set('pageToken', input.pageToken)
    if (input.query) params.set('q', input.query)
    if (typeof input.singleEvents !== 'undefined') params.set('singleEvents', String(input.singleEvents))
    if (input.orderBy) params.set('orderBy', input.orderBy)

    const listUrl = `${apiBase}/authentication/calendar/events/?${params.toString()}`
    const resp = await fetch(listUrl, { method: 'GET', headers: { Authorization: `Bearer ${token}` } })
    if (!resp.ok) {
      return JSON.stringify({ success: false, error: `HTTP ${resp.status}: ${resp.statusText}` })
    }
    const data = await resp.json()
    return JSON.stringify({ success: true, ...data })
  },
  {
    name: 'calendar_list_events',
    description: 'List Google Calendar events with optional time range and query filtering',
    schema: z.object({
      calendarId: z.string().optional().describe("Calendar identifier (default 'primary')"),
      timeMin: z.string().optional().describe('RFC3339 start time'),
      timeMax: z.string().optional().describe('RFC3339 end time'),
      maxResults: z.number().optional().describe('Maximum events to return'),
      pageToken: z.string().optional().describe('Pagination token'),
      query: z.string().optional().describe('Free-text search query'),
      singleEvents: z.boolean().optional().describe('Expand recurring events into instances'),
      orderBy: z.enum(['startTime','updated']).optional().describe('Sort order')
    })
  }
)

export const calendarGetEventTool = tool(
  async (input: { eventId: string; calendarId?: string }) => {
    const prefs = (getServerContextValue<any>("toolPreferences") || {}) as { calendar?: boolean }
    if (prefs.calendar === false) {
      return JSON.stringify({ success: false, error: "Calendar access is disabled by user preference" })
    }

    const apiBase = CONFIG.url
    const token = getServerContextValue<string>("authToken")
    if (!token) {
      throw new Error("Missing auth token in server context")
    }

    const url = `${apiBase}/authentication/calendar/events/${encodeURIComponent(input.eventId)}/?calendarId=${encodeURIComponent(input.calendarId || 'primary')}`
    const resp = await fetch(url, { method: 'GET', headers: { Authorization: `Bearer ${token}` } })
    if (!resp.ok) {
      return JSON.stringify({ success: false, error: `HTTP ${resp.status}: ${resp.statusText}` })
    }
    const data = await resp.json()
    return JSON.stringify({ success: true, event: data })
  },
  {
    name: 'calendar_get_event',
    description: 'Get a specific Google Calendar event by ID',
    schema: z.object({
      eventId: z.string().describe('The event ID'),
      calendarId: z.string().optional().describe("Calendar identifier (default 'primary')")
    })
  }
)

export const calendarCreateEventTool = tool(
  async (input: { calendarId?: string; event: Record<string, any> }) => {
    const prefs = (getServerContextValue<any>("toolPreferences") || {}) as { calendar?: boolean }
    if (prefs.calendar === false) {
      return JSON.stringify({ success: false, error: "Calendar access is disabled by user preference" })
    }

    const apiBase = CONFIG.url
    const token = getServerContextValue<string>("authToken")
    if (!token) {
      throw new Error("Missing auth token in server context")
    }

    const url = `${apiBase}/authentication/calendar/events/`
    const resp = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ calendarId: input.calendarId || 'primary', event: input.event })
    })
    if (!resp.ok) {
      return JSON.stringify({ success: false, error: `HTTP ${resp.status}: ${resp.statusText}` })
    }
    const data = await resp.json()
    return JSON.stringify({ success: true, event: data })
  },
  {
    name: 'calendar_create_event',
    description: 'Create a new Google Calendar event',
    schema: z.object({
      calendarId: z.string().optional().describe("Calendar identifier (default 'primary')"),
      event: z.record(z.any()).describe('Event payload matching Google Calendar API events.insert body')
    })
  }
)

export const calendarUpdateEventTool = tool(
  async (input: { eventId: string; calendarId?: string; event: Record<string, any> }) => {
    const prefs = (getServerContextValue<any>("toolPreferences") || {}) as { calendar?: boolean }
    if (prefs.calendar === false) {
      return JSON.stringify({ success: false, error: "Calendar access is disabled by user preference" })
    }

    const apiBase = CONFIG.url
    const token = getServerContextValue<string>("authToken")
    if (!token) {
      throw new Error("Missing auth token in server context")
    }

    const url = `${apiBase}/authentication/calendar/events/${encodeURIComponent(input.eventId)}/`
    const resp = await fetch(url, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ calendarId: input.calendarId || 'primary', event: input.event })
    })
    if (!resp.ok) {
      return JSON.stringify({ success: false, error: `HTTP ${resp.status}: ${resp.statusText}` })
    }
    const data = await resp.json()
    return JSON.stringify({ success: true, event: data })
  },
  {
    name: 'calendar_update_event',
    description: 'Update an existing Google Calendar event',
    schema: z.object({
      eventId: z.string().describe('The event ID to update'),
      calendarId: z.string().optional().describe("Calendar identifier (default 'primary')"),
      event: z.record(z.any()).describe('Partial event payload to update')
    })
  }
)

export const calendarDeleteEventTool = tool(
  async (input: { eventId: string; calendarId?: string }) => {
    const prefs = (getServerContextValue<any>("toolPreferences") || {}) as { calendar?: boolean }
    if (prefs.calendar === false) {
      return JSON.stringify({ success: false, error: "Calendar access is disabled by user preference" })
    }

    const apiBase = CONFIG.url
    const token = getServerContextValue<string>("authToken")
    if (!token) {
      throw new Error("Missing auth token in server context")
    }

    const url = `${apiBase}/authentication/calendar/events/${encodeURIComponent(input.eventId)}/?calendarId=${encodeURIComponent(input.calendarId || 'primary')}`
    const resp = await fetch(url, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    if (!resp.ok) {
      return JSON.stringify({ success: false, error: `HTTP ${resp.status}: ${resp.statusText}` })
    }
    const data = await resp.json().catch(() => ({}))
    return JSON.stringify({ success: true, result: data })
  },
  {
    name: 'calendar_delete_event',
    description: 'Delete a Google Calendar event by ID',
    schema: z.object({
      eventId: z.string().describe('The event ID to delete'),
      calendarId: z.string().optional().describe("Calendar identifier (default 'primary')")
    })
  }
)

