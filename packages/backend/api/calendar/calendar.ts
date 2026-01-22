import { ApiService } from "../apiService";
import axios from 'axios';

export interface CalendarEvent {
  id: string
  calendarId?: string
  status?: string
  summary?: string
  description?: string
  location?: string
  htmlLink?: string
  hangoutLink?: string
  creator?: { email?: string; displayName?: string }
  organizer?: { email?: string; displayName?: string }
  start?: { date?: string; dateTime?: string; timeZone?: string }
  end?: { date?: string; dateTime?: string; timeZone?: string }
  attendees?: Array<{ email?: string; displayName?: string; responseStatus?: string }>
  reminders?: any
}

export interface ListEventsResponse {
  items?: CalendarEvent[]
  nextPageToken?: string
}

export interface CalendarListEntry {
  id: string
  summary?: string
  description?: string
  summaryOverride?: string
  colorId?: string
  backgroundColor?: string
  foregroundColor?: string
  hidden?: boolean
  selected?: boolean
  primary?: boolean
  accessRole?: 'freeBusyReader' | 'reader' | 'writer' | 'owner'
  timeZone?: string
}

export interface ListCalendarsResponse {
  items?: CalendarListEntry[]
  nextPageToken?: string
}

export default class Calendar{

  private static withAuthHeaders() {
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  static async listEvents(params?: { calendarId?: string; timeMin?: string; timeMax?: string; maxResults?: number; pageToken?: string; query?: string; singleEvents?: boolean; orderBy?: 'startTime' | 'updated' }) {
    const query: Record<string, any> = {}
    if (params?.calendarId) query.calendarId = params.calendarId
    if (params?.timeMin) query.timeMin = params.timeMin
    if (params?.timeMax) query.timeMax = params.timeMax
    if (typeof params?.maxResults === 'number') query.maxResults = params.maxResults
    if (params?.pageToken) query.pageToken = params.pageToken
    if (params?.query) query.q = params.query
    if (typeof params?.singleEvents !== 'undefined') query.singleEvents = params.singleEvents
    if (params?.orderBy) query.orderBy = params.orderBy

    const url = new URL(`${ApiService.baseURL}/authentication/calendar/events/`)
    Object.entries(query).forEach(([k, v]) => url.searchParams.append(k, String(v)))

    const resp = await axios.get<ListEventsResponse>(url.toString(), { headers: this.withAuthHeaders() })
    return resp.data
  }

  static async getEvent(eventId: string, calendarId: string = 'primary') {
    const resp = await axios.get<CalendarEvent>(
      `${ApiService.baseURL}/authentication/calendar/events/${encodeURIComponent(eventId)}/?calendarId=${encodeURIComponent(calendarId)}`,
      { headers: this.withAuthHeaders() }
    )
    return resp.data
  }

  static async createEvent(event: Partial<CalendarEvent>, calendarId: string = 'primary') {
    const resp = await axios.post(
      `${ApiService.baseURL}/authentication/calendar/events/`,
      { calendarId, event },
      { headers: { 'Content-Type': 'application/json', ...this.withAuthHeaders() } }
    )
    return resp.data
  }

  static async updateEvent(eventId: string, event: Partial<CalendarEvent>, calendarId: string = 'primary') {
    const resp = await axios.put(
      `${ApiService.baseURL}/authentication/calendar/events/${encodeURIComponent(eventId)}/`,
      { calendarId, event },
      { headers: { 'Content-Type': 'application/json', ...this.withAuthHeaders() } }
    )
    return resp.data
  }

  static async deleteEvent(eventId: string, calendarId: string = 'primary') {
    const resp = await axios.delete(
      `${ApiService.baseURL}/authentication/calendar/events/${encodeURIComponent(eventId)}/?calendarId=${encodeURIComponent(calendarId)}`,
      { headers: this.withAuthHeaders() }
    )
    return resp.data
  }

  static async listCalendars(params?: { maxResults?: number; pageToken?: string; minAccessRole?: string; showDeleted?: boolean; showHidden?: boolean }) {
    const query: Record<string, any> = {}
    if (typeof params?.maxResults === 'number') query.maxResults = params.maxResults
    if (params?.pageToken) query.pageToken = params.pageToken
    if (params?.minAccessRole) query.minAccessRole = params.minAccessRole
    if (typeof params?.showDeleted !== 'undefined') query.showDeleted = params.showDeleted
    if (typeof params?.showHidden !== 'undefined') query.showHidden = params.showHidden

    const url = new URL(`${ApiService.baseURL}/authentication/calendar/calendars/`)
    Object.entries(query).forEach(([k, v]) => url.searchParams.append(k, String(v)))

    const resp = await axios.get<ListCalendarsResponse>(url.toString(), { headers: this.withAuthHeaders() })
    return resp.data
  }

}
