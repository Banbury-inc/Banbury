import { CalendarEvent } from '../../../../backend/api/calendar/calendar'
import { getCalendarEventDate } from '../../../components/handlers/file-search-command-handlers'

interface HandleCalendarEventSelectParams {
  event: CalendarEvent
  setCalendarJumpDate: React.Dispatch<React.SetStateAction<Date | null>>
  setCalendarSelectedEvent: React.Dispatch<React.SetStateAction<CalendarEvent | null>>
  openCalendarInTabCallback: (targetPanelId: string) => void
  activePanelId: string
}

export function handleCalendarEventSelect({
  event,
  setCalendarJumpDate,
  setCalendarSelectedEvent,
  openCalendarInTabCallback,
  activePanelId
}: HandleCalendarEventSelectParams): void {
  const eventDate = getCalendarEventDate(event)
  if (eventDate) {
    setCalendarJumpDate(eventDate)
  }
  setCalendarSelectedEvent(event)
  openCalendarInTabCallback(activePanelId)
}

