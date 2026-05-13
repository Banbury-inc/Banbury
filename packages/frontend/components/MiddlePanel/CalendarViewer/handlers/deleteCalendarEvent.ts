import type { Dispatch, SetStateAction } from 'react'
import { ApiService } from '../../../../../backend/api/apiService'
import { CalendarEvent } from '../../../../../backend/api/calendar/calendar'

interface DeleteCalendarEventParams {
  event: CalendarEvent
  onDeleted: () => void
  onClose: () => void
  setIsDeleting: Dispatch<SetStateAction<boolean>>
}

export async function deleteCalendarEvent({
  event,
  onDeleted,
  onClose,
  setIsDeleting
}: DeleteCalendarEventParams) {
  if (!window.confirm('Are you sure you want to delete this event?')) return

  setIsDeleting(true)

  try {
    await ApiService.Calendar.deleteEvent(event.id, event.calendarId ?? 'primary')
    onDeleted()
    onClose()
  } catch (error) {
    console.error('Error deleting event', error)
    window.alert('Failed to delete event. Please try again.')
  } finally {
    setIsDeleting(false)
  }
}
