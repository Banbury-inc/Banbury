import { ApiService } from '../../../../../../backend/api/apiService'
import { CalendarListEntry } from '../../../../../../backend/api/calendar/calendar'

/**
 * Load Google Calendar list from the API
 * @returns Promise resolving to array of CalendarListEntry objects
 */
export async function loadCalendars(): Promise<CalendarListEntry[]> {
  try {
    const response = await ApiService.Calendar.listCalendars()
    return response.items || []
  } catch (err) {
    console.warn('Failed to load calendars:', err)
    return []
  }
}

