import { CalendarEvent } from '../../../../../backend/api/calendar/calendar'
import { getDefaultPopoverPosition } from './eventPopoverHandlers'

interface ApplyInitialEventSelectionParams {
  initialEvent: CalendarEvent
  setCurrentDate: React.Dispatch<React.SetStateAction<Date>>
  setSelectedEvent: React.Dispatch<React.SetStateAction<CalendarEvent | null>>
  setEventPopoverPos: React.Dispatch<React.SetStateAction<{ x: number; y: number } | null>>
  setEventPopoverMode: React.Dispatch<React.SetStateAction<'view' | 'edit'>>
  setIsEventPopoverOpen: React.Dispatch<React.SetStateAction<boolean>>
  onInitialEventConsumed?: () => void
}

export function applyInitialEventSelection({
  initialEvent,
  setCurrentDate,
  setSelectedEvent,
  setEventPopoverPos,
  setEventPopoverMode,
  setIsEventPopoverOpen,
  onInitialEventConsumed
}: ApplyInitialEventSelectionParams): void {
  const startDt = initialEvent.start?.dateTime || initialEvent.start?.date
  if (!startDt) {
    onInitialEventConsumed?.()
    return
  }

  const eventDate = new Date(startDt)
  if (isNaN(eventDate.getTime())) {
    onInitialEventConsumed?.()
    return
  }

  setCurrentDate(eventDate)
  setSelectedEvent(initialEvent)
  setEventPopoverPos(getDefaultPopoverPosition())
  setEventPopoverMode('view')
  setIsEventPopoverOpen(true)
  onInitialEventConsumed?.()
}

