import { CalendarEvent } from '../../../../../backend/api/calendar/calendar'

export type EventPopoverMode = 'view' | 'edit'

export interface EventPopoverState {
  isOpen: boolean
  position: { x: number; y: number } | null
  selectedEvent: CalendarEvent | null
  mode: EventPopoverMode
}

export function getDefaultPopoverPosition(): { x: number; y: number } {
  if (typeof window === 'undefined') return { x: 0, y: 0 }
  return { x: window.innerWidth / 2, y: window.innerHeight / 3 }
}

export function createOpenEventPopoverHandler(
  setSelectedEvent: (event: CalendarEvent | null) => void,
  setSelectedDate: (date: Date | null) => void,
  setEventPopoverPos: (pos: { x: number; y: number } | null) => void,
  setEventPopoverMode: (mode: EventPopoverMode) => void,
  setIsEventPopoverOpen: (open: boolean) => void,
  isPopoverOpen: boolean,
  isEventPopoverOpen: boolean,
  isClosingPopover: boolean,
  onEventClick?: (event: CalendarEvent) => void
) {
  return (event: CalendarEvent, clickPos?: { x: number; y: number }) => {
    if (isPopoverOpen || isEventPopoverOpen || isClosingPopover) return
    
    setSelectedEvent(event)
    setSelectedDate(null)
    setEventPopoverPos(clickPos || getDefaultPopoverPosition())
    setEventPopoverMode('view')
    setIsEventPopoverOpen(true)
    onEventClick?.(event)
  }
}

export function createCloseEventPopoverHandler(
  setIsClosingPopover: (closing: boolean) => void,
  setIsEventPopoverOpen: (open: boolean) => void,
  setEventPopoverPos: (pos: { x: number; y: number } | null) => void,
  setSelectedEvent: (event: CalendarEvent | null) => void,
  setEventPopoverMode: (mode: EventPopoverMode) => void
) {
  return () => {
    setIsClosingPopover(true)
    setIsEventPopoverOpen(false)
    setEventPopoverPos(null)
    setSelectedEvent(null)
    setEventPopoverMode('view')
    setTimeout(() => setIsClosingPopover(false), 100)
  }
}

export function createSwitchToEditModeHandler(
  setEventPopoverMode: (mode: EventPopoverMode) => void
) {
  return () => {
    setEventPopoverMode('edit')
  }
}

export function createBackToViewModeHandler(
  setEventPopoverMode: (mode: EventPopoverMode) => void
) {
  return () => {
    setEventPopoverMode('view')
  }
}

