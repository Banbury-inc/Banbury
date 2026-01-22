import { ApiService } from '../../../../../../backend/api/apiService'
import type { OutlookCalendarStatusResponse } from '../../../../../../backend/api/outlook-calendar/outlookCalendar'

export interface MicrosoftCalendarStatus {
  connected: boolean
  hasCalendarScope: boolean
  needsReconnect: boolean
  accountEmail?: string
  accountName?: string
}

/**
 * Check Microsoft Calendar connection status
 * @returns Promise resolving to connection status
 */
export async function checkMicrosoftCalendarStatus(): Promise<MicrosoftCalendarStatus> {
  try {
    const response = await ApiService.OutlookCalendar.getStatus() as OutlookCalendarStatusResponse & {
      needsReconnect?: boolean
      accountName?: string
      accountEmail?: string
    }
    return {
      connected: response.connected,
      hasCalendarScope: response.hasCalendarScope,
      needsReconnect: response.needsReconnect ?? (!response.hasCalendarScope && response.connected),
      accountEmail: response.accountEmail ?? response.email,
      accountName: response.accountName
    }
  } catch (err) {
    console.warn('Failed to check Microsoft Calendar status:', err)
    return {
      connected: false,
      hasCalendarScope: false,
      needsReconnect: false
    }
  }
}

