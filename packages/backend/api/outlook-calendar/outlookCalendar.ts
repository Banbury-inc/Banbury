import { ApiService } from "../apiService"
import axios from 'axios'
import type { CalendarEvent, ListEventsResponse, CalendarListEntry, ListCalendarsResponse } from '../calendar/calendar'

export interface OutlookCalendarStatusResponse {
  connected: boolean
  hasCalendarScope: boolean
  email?: string
}

export default class OutlookCalendar {
  constructor(_api: ApiService) {}

  private static withAuthHeaders() {
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  /**
   * Check the status of the Outlook Calendar connection
   */
  static async getStatus(): Promise<OutlookCalendarStatusResponse> {
    const resp = await axios.get<OutlookCalendarStatusResponse>(
      `${ApiService.baseURL}/authentication/outlook/calendar/status/`,
      { headers: this.withAuthHeaders() }
    )
    return resp.data
  }

  /**
   * List all calendars from the connected Microsoft account
   */
  static async listCalendars(params?: { 
    maxResults?: number
    pageToken?: string 
  }): Promise<ListCalendarsResponse> {
    const query: Record<string, string> = {}
    if (typeof params?.maxResults === 'number') query.maxResults = String(params.maxResults)
    if (params?.pageToken) query.pageToken = params.pageToken

    const url = new URL(`${ApiService.baseURL}/authentication/outlook/calendars/`)
    Object.entries(query).forEach(([k, v]) => url.searchParams.append(k, v))

    const resp = await axios.get<ListCalendarsResponse>(url.toString(), { headers: this.withAuthHeaders() })
    return resp.data
  }

  /**
   * List events from the connected Microsoft account
   */
  static async listEvents(params?: { 
    calendarId?: string
    timeMin?: string
    timeMax?: string
    maxResults?: number
    pageToken?: string
    query?: string
    singleEvents?: boolean
    orderBy?: 'startTime' | 'updated'
  }): Promise<ListEventsResponse> {
    const query: Record<string, string> = {}
    if (params?.calendarId) query.calendarId = params.calendarId
    if (params?.timeMin) query.timeMin = params.timeMin
    if (params?.timeMax) query.timeMax = params.timeMax
    if (typeof params?.maxResults === 'number') query.maxResults = String(params.maxResults)
    if (params?.pageToken) query.pageToken = params.pageToken
    if (params?.query) query.q = params.query
    if (typeof params?.singleEvents !== 'undefined') query.singleEvents = String(params.singleEvents)
    if (params?.orderBy) query.orderBy = params.orderBy

    const url = new URL(`${ApiService.baseURL}/authentication/outlook/events/`)
    Object.entries(query).forEach(([k, v]) => url.searchParams.append(k, v))

    const resp = await axios.get<ListEventsResponse>(url.toString(), { headers: this.withAuthHeaders() })
    return resp.data
  }

  /**
   * Get a single event by ID
   */
  static async getEvent(eventId: string, calendarId?: string): Promise<CalendarEvent> {
    const params = calendarId ? `?calendarId=${encodeURIComponent(calendarId)}` : ''
    const resp = await axios.get<CalendarEvent>(
      `${ApiService.baseURL}/authentication/outlook/events/${encodeURIComponent(eventId)}/${params}`,
      { headers: this.withAuthHeaders() }
    )
    return resp.data
  }

  /**
   * Create a new event
   */
  static async createEvent(event: Partial<CalendarEvent>, calendarId?: string): Promise<CalendarEvent> {
    const resp = await axios.post<CalendarEvent>(
      `${ApiService.baseURL}/authentication/outlook/events/`,
      { calendarId, event },
      { headers: { 'Content-Type': 'application/json', ...this.withAuthHeaders() } }
    )
    return resp.data
  }

  /**
   * Update an existing event
   */
  static async updateEvent(eventId: string, event: Partial<CalendarEvent>, calendarId?: string): Promise<CalendarEvent> {
    const resp = await axios.put<CalendarEvent>(
      `${ApiService.baseURL}/authentication/outlook/events/${encodeURIComponent(eventId)}/`,
      { calendarId, event },
      { headers: { 'Content-Type': 'application/json', ...this.withAuthHeaders() } }
    )
    return resp.data
  }

  /**
   * Delete an event
   */
  static async deleteEvent(eventId: string, calendarId?: string): Promise<void> {
    const params = calendarId ? `?calendarId=${encodeURIComponent(calendarId)}` : ''
    await axios.delete(
      `${ApiService.baseURL}/authentication/outlook/events/${encodeURIComponent(eventId)}/${params}`,
      { headers: this.withAuthHeaders() }
    )
  }
}

// Re-export types from calendar module for convenience
export type { CalendarEvent, ListEventsResponse, CalendarListEntry, ListCalendarsResponse }

