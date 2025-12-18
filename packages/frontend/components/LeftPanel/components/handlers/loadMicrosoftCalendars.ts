import { ApiService } from '../../../../../backend/api/apiService'
import { CalendarListEntry } from '../../../../../backend/api/calendar/calendar'

/**
 * Load Microsoft Calendar list from the API
 * @returns Promise resolving to array of CalendarListEntry objects
 */
export async function loadMicrosoftCalendars(): Promise<CalendarListEntry[]> {
  try {
    const response = await ApiService.OutlookCalendar.listCalendars()
    return response.items || []
  } catch (err) {
    console.warn('Failed to load Microsoft calendars:', err)
    return []
  }
}

