import type { Dispatch } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, MapPin, RefreshCw } from 'lucide-react'
import { Button } from '../../common/ui/button'
import { CalendarEvent, CalendarListEntry } from '../../../../backend/api/calendar/calendar'
import { CreateEventPopover } from './CreateEventPopover'
import { EditEventPopover } from './EditEventPopover'
import { ViewEventPopover } from './ViewEventPopover'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuCheckboxItem, 
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '../../common/ui/dropdown-menu'
import { loadCalendars } from '../../LeftPanel/components/CalendarTab/handlers/loadCalendars'
import { loadMicrosoftCalendars } from '../../LeftPanel/components/CalendarTab/handlers/loadMicrosoftCalendars'
import { getSelectedProvider } from '../../LeftPanel/components/CalendarTab/calendarProvider'
import { loadMergedEvents } from './handlers/loadMergedEvents'
import { 
  getVisibleCalendarIds, 
  toggleCalendarVisibility, 
  subscribeToVisibilityChanges 
} from './handlers/calendarVisibility'
import {
  EventPopoverMode,
  getDefaultPopoverPosition
} from './handlers/eventPopoverHandlers'
import { applyInitialEventSelection } from './handlers/applyInitialEventSelection'

type CalendarView = 'month' | 'week' | 'day'

const calendarViewLabels: Record<CalendarView, string> = {
  month: 'Month',
  week: 'Week',
  day: 'Day'
}

const allDayEventRowHeight = 24

function getDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function createDateFromKey(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function isAllDayEvent(event: CalendarEvent) {
  return Boolean(event.start?.date && !event.start.dateTime)
}

function getAllDayEndDateKey(event: CalendarEvent) {
  if (!event.start?.date) return null
  if (!event.end?.date) return event.start.date

  const startDate = createDateFromKey(event.start.date)
  const exclusiveEndDate = createDateFromKey(event.end.date)

  if (exclusiveEndDate <= startDate) return event.start.date

  exclusiveEndDate.setDate(exclusiveEndDate.getDate() - 1)
  return getDateKey(exclusiveEndDate)
}

function getEventStartKey(event: CalendarEvent) {
  const start = event.start?.dateTime || event.start?.date
  if (!start) return null
  return getDateKey(new Date(start))
}

function getAllDayEventsForDate(eventsByDate: Map<string, CalendarEvent[]>, date: Date) {
  return (eventsByDate.get(getDateKey(date)) || []).filter(isAllDayEvent)
}

interface CalendarViewerProps {
  initialDate?: Date
  initialView?: CalendarView
  onEventClick?: Dispatch<CalendarEvent>
  onDateChange?: () => void
  initialEvent?: CalendarEvent
  onInitialEventConsumed?: () => void
}

export function CalendarViewer({ initialDate, initialView = 'month', onEventClick, onDateChange, initialEvent, onInitialEventConsumed }: CalendarViewerProps) {
  const [currentDate, setCurrentDate] = useState<Date>(initialDate || new Date())

  useEffect(() => {
    if (initialDate) {
      setCurrentDate(initialDate)
      onDateChange?.()
    }
  }, [initialDate, onDateChange])

  // Handle externally selected event (from left panel or command palette)
  useEffect(() => {
    if (initialEvent) {
      applyInitialEventSelection({
        initialEvent,
        setCurrentDate,
        setSelectedEvent,
        setEventPopoverPos,
        setEventPopoverMode,
        setIsEventPopoverOpen,
        onInitialEventConsumed
      })
    }
  }, [initialEvent, onInitialEventConsumed])

  const [view, setView] = useState<CalendarView>(initialView)
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)
  const [popoverPos, setPopoverPos] = useState<{ x: number; y: number } | null>(null)
  const [isEventPopoverOpen, setIsEventPopoverOpen] = useState(false)
  const [eventPopoverPos, setEventPopoverPos] = useState<{ x: number; y: number } | null>(null)
  const [eventPopoverMode, setEventPopoverMode] = useState<EventPopoverMode>('view')
  const [isClosingPopover, setIsClosingPopover] = useState(false)
  const [calendars, setCalendars] = useState<CalendarListEntry[]>([])
  const [visibleCalendarIds, setVisibleCalendarIds] = useState<string[]>(() => getVisibleCalendarIds())
  const monthDayRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const [monthEventCapacityByDate, setMonthEventCapacityByDate] = useState<Record<string, number>>({})

  const startOfWeek = useCallback((date: Date) => {
    const d = new Date(date)
    const day = (d.getDay() + 7) % 7
    d.setDate(d.getDate() - day)
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const startOfMonth = useCallback((date: Date) => {
    const d = new Date(date.getFullYear(), date.getMonth(), 1)
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const visibleRange = useMemo(() => {
    if (view === 'day') {
      const start = new Date(currentDate)
      start.setHours(0, 0, 0, 0)
      const end = new Date(currentDate)
      end.setHours(23, 59, 59, 999)
      return { start, end }
    }
    if (view === 'week') {
      const start = startOfWeek(currentDate)
      const end = new Date(start)
      end.setDate(end.getDate() + 6)
      end.setHours(23, 59, 59, 999)
      return { start, end }
    }
    const start = startOfWeek(startOfMonth(currentDate))
    const end = new Date(start)
    end.setDate(end.getDate() + 41)
    end.setHours(23, 59, 59, 999)
    return { start, end }
  }, [currentDate, view, startOfWeek, startOfMonth])

  const fetchCalendars = useCallback(async () => {
    try {
      const provider = getSelectedProvider()
      const cals = provider === 'microsoft' ? await loadMicrosoftCalendars() : await loadCalendars()
      setCalendars(cals)
    } catch {
      setCalendars([])
    }
  }, [])

  const loadEventsFromCalendars = useCallback(async () => {
    // Filter visibleCalendarIds to only include IDs that actually exist in the calendar list
    // This prevents fetching events for phantom IDs like "primary" that don't match any real calendar
    const calendarIdSet = new Set(calendars.map(c => c.id))
    const validCalendarIds = visibleCalendarIds.filter(id => calendarIdSet.has(id))
    
    if (validCalendarIds.length === 0) {
      setEvents([])
      return
    }
    setLoading(true)
    try {
      const merged = await loadMergedEvents({
        calendarIds: validCalendarIds,
        timeMin: visibleRange.start.toISOString(),
        timeMax: visibleRange.end.toISOString(),
        maxResults: 2500,
        singleEvents: true,
        orderBy: 'startTime'
      })
      setEvents(merged)
    } finally {
      setLoading(false)
    }
  }, [visibleCalendarIds, visibleRange.start, visibleRange.end, calendars])

  useEffect(() => {
    fetchCalendars()
  }, [fetchCalendars])

  useEffect(() => {
    loadEventsFromCalendars()
  }, [loadEventsFromCalendars])

  useEffect(() => {
    const unsubscribe = subscribeToVisibilityChanges((ids) => {
      setVisibleCalendarIds(ids)
    })
    return unsubscribe
  }, [])

  const handleEventClick = (event: CalendarEvent, clickPos?: { x: number; y: number }) => {
    if (isPopoverOpen || isEventPopoverOpen || isClosingPopover) return
    
    setSelectedEvent(event)
    setSelectedDate(null)
    setEventPopoverPos(clickPos || getDefaultPopoverPosition())
    setEventPopoverMode('view')
    setIsEventPopoverOpen(true)
    onEventClick?.(event)
  }

  const handleDateClick = (date: Date, clickPos?: { x: number; y: number }) => {
    if (isPopoverOpen || isEventPopoverOpen || isClosingPopover) return
    
    setSelectedEvent(null)
    setSelectedDate(date)
    setPopoverPos(clickPos || getDefaultPopoverPosition())
    setIsPopoverOpen(true)
  }

  const handleEventSaved = () => {
    loadEventsFromCalendars()
  }

  const handleEventDeleted = () => {
    loadEventsFromCalendars()
  }

  const handlePopoverClose = () => {
    setIsClosingPopover(true)
    setIsPopoverOpen(false)
    setPopoverPos(null)
    setSelectedDate(null)
    setTimeout(() => setIsClosingPopover(false), 100)
  }

  const handleEventPopoverClose = () => {
    setIsClosingPopover(true)
    setIsEventPopoverOpen(false)
    setEventPopoverPos(null)
    setSelectedEvent(null)
    setEventPopoverMode('view')
    setTimeout(() => setIsClosingPopover(false), 100)
  }

  const handleSwitchToEditMode = () => {
    setEventPopoverMode('edit')
  }

  const handleBackToViewMode = () => {
    setEventPopoverMode('view')
  }

  const handleCalendarToggle = useCallback((calendarId: string) => {
    toggleCalendarVisibility(calendarId)
  }, [])

  const getCalendarDisplayName = (cal: CalendarListEntry) => {
    return cal.summaryOverride || cal.summary || cal.id
  }

  const getCalendarColor = (calendarId?: string) => {
    if (!calendarId) return undefined
    return calendars.find(c => c.id === calendarId)?.backgroundColor
  }

  const getEventCalendarDetails = (event: CalendarEvent | null) => {
    if (!event?.calendarId) return undefined
    const calendar = calendars.find(cal => cal.id === event.calendarId)

    return {
      name: calendar ? getCalendarDisplayName(calendar) : event.calendarId,
      color: calendar?.backgroundColor
    }
  }

  const goPrev = () => {
    const d = new Date(currentDate)
    if (view === 'day') d.setDate(d.getDate() - 1)
    else if (view === 'week') d.setDate(d.getDate() - 7)
    else d.setMonth(d.getMonth() - 1)
    setCurrentDate(d)
  }
  const goNext = () => {
    const d = new Date(currentDate)
    if (view === 'day') d.setDate(d.getDate() + 1)
    else if (view === 'week') d.setDate(d.getDate() + 7)
    else d.setMonth(d.getMonth() + 1)
    setCurrentDate(d)
  }

  const title = useMemo(() => {
    const options: Intl.DateTimeFormatOptions = view === 'month'
      ? { month: 'long', year: 'numeric' }
      : view === 'week'
        ? { month: 'short', day: 'numeric', year: 'numeric' }
        : { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }
    if (view === 'week') {
      const start = visibleRange.start
      const end = visibleRange.end
      return `${start.toLocaleDateString(undefined, options)} - ${end.toLocaleDateString(undefined, options)}`
    }
    return currentDate.toLocaleDateString(undefined, options)
  }, [currentDate, view, visibleRange.start, visibleRange.end])

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>()
    const add = (key: string, ev: CalendarEvent) => {
      const arr = map.get(key) || []
      arr.push(ev)
      map.set(key, arr)
    }
    for (const ev of events) {
      if (isAllDayEvent(ev)) {
        const startKey = ev.start?.date
        const endKey = getAllDayEndDateKey(ev)
        if (!startKey || !endKey) continue

        const cursor = createDateFromKey(startKey)
        const endDate = createDateFromKey(endKey)

        while (cursor <= endDate) {
          add(getDateKey(cursor), ev)
          cursor.setDate(cursor.getDate() + 1)
        }

        continue
      }

      const key = getEventStartKey(ev)
      if (key) add(key, ev)
    }
    return map
  }, [events])

  const timedEventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>()

    eventsByDate.forEach((dayEvents, key) => {
      map.set(key, dayEvents.filter(event => !isAllDayEvent(event)))
    })

    return map
  }, [eventsByDate])

  const formatTime = (iso?: string) => {
    if (!iso) return ''
    const d = new Date(iso)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const calculateVisibleMonthEventCount = useCallback((dayCell: HTMLDivElement, eventCount: number) => {
    if (eventCount === 0) return 0

    const dateHeader = dayCell.querySelector<HTMLElement>('[data-month-day-header]')
    const eventList = dayCell.querySelector<HTMLElement>('[data-month-day-events]')
    const firstEvent = dayCell.querySelector<HTMLElement>('[data-month-day-event]')
    const moreIndicator = dayCell.querySelector<HTMLElement>('[data-month-day-more]')

    if (!eventList || !dateHeader) return eventCount

    const dayStyles = window.getComputedStyle(dayCell)
    const eventListStyles = window.getComputedStyle(eventList)
    const paddingTop = Number.parseFloat(dayStyles.paddingTop) || 0
    const paddingBottom = Number.parseFloat(dayStyles.paddingBottom) || 0
    const rowGap = Number.parseFloat(eventListStyles.rowGap) || 0
    const eventHeight = firstEvent?.offsetHeight || 22
    const moreHeight = moreIndicator?.offsetHeight || eventHeight
    const availableHeight = dayCell.clientHeight - paddingTop - paddingBottom - dateHeader.offsetHeight

    if (availableHeight <= 0) return 0

    const totalRowsThatFit = Math.floor((availableHeight + rowGap) / (eventHeight + rowGap))

    if (eventCount <= totalRowsThatFit) return eventCount
    if (totalRowsThatFit <= 1) return 0

    const rowsWithMoreIndicator = Math.floor((availableHeight - moreHeight + rowGap) / (eventHeight + rowGap))
    return Math.max(rowsWithMoreIndicator, 0)
  }, [])

  useEffect(() => {
    if (view !== 'month') return

    const recalculateMonthEventCapacities = () => {
      const nextCapacityByDate: Record<string, number> = {}

      monthDayRefs.current.forEach((dayCell, key) => {
        const eventCount = eventsByDate.get(key)?.length || 0
        nextCapacityByDate[key] = calculateVisibleMonthEventCount(dayCell, eventCount)
      })

      setMonthEventCapacityByDate((currentCapacityByDate) => {
        const currentKeys = Object.keys(currentCapacityByDate)
        const nextKeys = Object.keys(nextCapacityByDate)
        const isSameCapacity = currentKeys.length === nextKeys.length
          && nextKeys.every(key => currentCapacityByDate[key] === nextCapacityByDate[key])

        return isSameCapacity ? currentCapacityByDate : nextCapacityByDate
      })
    }

    recalculateMonthEventCapacities()

    const resizeObserver = new ResizeObserver(recalculateMonthEventCapacities)
    monthDayRefs.current.forEach(dayCell => resizeObserver.observe(dayCell))

    return () => resizeObserver.disconnect()
  }, [view, eventsByDate, calculateVisibleMonthEventCount])

  const renderEventButton = (ev: CalendarEvent, onClick: React.MouseEventHandler<HTMLButtonElement>) => {
    const calColor = getCalendarColor(ev.calendarId)
    return (
      <button 
        key={`${ev.calendarId}-${ev.id}`}
        onClick={onClick}
        data-month-day-event
        className="w-full text-left truncate text-xs px-1 py-0.5 rounded hover:opacity-80 transition-opacity overflow-hidden bg-accent text-accent-foreground border border-border"
        style={{ 
          backgroundColor: calColor ? `${calColor}20` : undefined,
          borderColor: calColor || undefined,
          color: calColor || undefined
        }}
        title={ev.summary || '(No title)'}
      >
        {ev.summary || '(No title)'}
      </button>
    )
  }

  const renderAllDayEventButton = (ev: CalendarEvent, onClick: React.MouseEventHandler<HTMLButtonElement>) => {
    const calColor = getCalendarColor(ev.calendarId)

    return (
      <button
        key={`${ev.calendarId}-${ev.id}`}
        onClick={onClick}
        className="h-6 w-full truncate rounded border border-border bg-accent px-1 text-left text-xs text-accent-foreground transition-opacity hover:opacity-80"
        style={{
          backgroundColor: calColor ? `${calColor}20` : undefined,
          borderColor: calColor || undefined,
          color: calColor || undefined
        }}
        title={ev.summary || '(No title)'}
      >
        {ev.summary || '(No title)'}
      </button>
    )
  }

  const renderMonth = () => {
    const days: Date[] = []
    const start = visibleRange.start
    for (let i = 0; i < 42; i++) {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      days.push(d)
    }
    return (
      <div className="flex-1 overflow-auto bg-card">
        <div className="grid grid-cols-7 border-t border-l border-border h-full">
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d) => (
            <div key={d} className="p-2 text-xs font-medium text-muted-foreground border-r border-b border-border">{d}</div>
          ))}
          {days.map((d, idx) => {
            const key = getDateKey(d)
            const dayEvents = eventsByDate.get(key) || []
            const isCurrentMonth = d.getMonth() === currentDate.getMonth()
            const isToday = (new Date()).toDateString() === d.toDateString()
            const visibleEventCount = monthEventCapacityByDate[key] ?? dayEvents.length
            const hiddenEventCount = Math.max(dayEvents.length - visibleEventCount, 0)
            return (
              <div 
                key={idx} 
                ref={(node) => {
                  if (node) monthDayRefs.current.set(key, node)
                  else monthDayRefs.current.delete(key)
                }}
                className={`min-h-[7rem] overflow-hidden p-1 border-r border-b border-border ${isCurrentMonth ? 'bg-card' : 'bg-background'} ${isToday ? 'ring-1 ring-blue-500' : ''} cursor-pointer hover:bg-accent/50 transition-colors`}
                onClick={(e) => handleDateClick(d, { x: e.clientX, y: e.clientY })}
              >
                <div data-month-day-header className="text-xs text-muted-foreground mb-1 flex items-center justify-between">
                  <span className={`px-1 rounded ${isToday ? 'bg-blue-600 text-white' : ''}`}>{d.getDate()}</span>
                </div>
                <div data-month-day-events className="space-y-0.5">
                  {dayEvents.slice(0, visibleEventCount).map(ev => renderEventButton(ev, (e) => {
                    e.stopPropagation()
                    handleEventClick(ev, { x: e.clientX, y: e.clientY })
                  }))}
                  {hiddenEventCount > 0 && (
                    <div data-month-day-more className="text-[10px] text-muted-foreground">+{hiddenEventCount} more</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const renderWeek = () => {
    const days: Date[] = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(visibleRange.start)
      d.setDate(visibleRange.start.getDate() + i)
      days.push(d)
    }

    const timeSlots = []
    for (let hour = 1; hour <= 23; hour++) {
      timeSlots.push(hour)
    }

    const now = new Date()
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()
    const currentTimePosition = ((currentHour - 1) * 60 + currentMinute) / 60

    const getEventPosition = (event: CalendarEvent, dayIndex: number) => {
      const startTime = event.start?.dateTime ? new Date(event.start.dateTime) : null
      const endTime = event.end?.dateTime ? new Date(event.end.dateTime) : null
      
      if (!startTime) return null
      
      const startHour = startTime.getHours()
      const startMinute = startTime.getMinutes()
      const endHour = endTime ? endTime.getHours() : startHour + 1
      const endMinute = endTime ? endTime.getMinutes() : 0
      
      const top = ((startHour - 1) * 60 + startMinute) / 60
      const height = ((endHour - startHour) * 60 + (endMinute - startMinute)) / 60
      
      return { top, height, dayIndex }
    }

    const formatTimeLabel = (hour: number) => {
      if (hour === 0) return '12 AM'
      if (hour < 12) return `${hour} AM`
      if (hour === 12) return '12 PM'
      return `${hour - 12} PM`
    }

    const isCurrentDay = (date: Date) => {
      return date.toDateString() === now.toDateString()
    }

    return (
      <div className="flex-1 bg-card">
        <div className="flex h-full">
          <div className="w-16 flex-shrink-0 border-r border-border flex flex-col">
            <div className="h-8 flex items-center justify-center text-xs text-muted-foreground border-b border-border">
            </div>
            <div className="flex-1 grid grid-rows-23">
              {timeSlots.map((hour) => (
                <div key={hour} className="flex items-center justify-end pr-2 border-b border-border">
                  <span className="text-xs text-muted-foreground">{formatTimeLabel(hour)}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex-1 flex flex-col">
            <div className="h-8 grid grid-cols-7 border-b border-border">
              {days.map((d) => (
                <div key={d.toISOString()} className="p-1 text-center border-r border-border bg-accent/30">
                  <div className="text-xs font-medium text-muted-foreground">
                    {d.toLocaleDateString(undefined, { weekday: 'short' }).toUpperCase()}
                  </div>
                  <div className={`text-xs font-medium ${isCurrentDay(d) ? 'text-blue-500' : 'text-foreground'}`}>
                    {isCurrentDay(d) ? (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full border border-blue-500">
                        {d.getDate()}
                      </span>
                    ) : (
                      d.getDate()
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 border-b border-border bg-card">
              {days.map((day) => {
                const allDayEvents = getAllDayEventsForDate(eventsByDate, day)

                return (
                  <div
                    key={`all-day-${getDateKey(day)}`}
                    className="min-h-8 space-y-0.5 border-r border-border p-1"
                    style={{ height: Math.max(32, allDayEvents.length * allDayEventRowHeight + 8) }}
                  >
                    {allDayEvents.map(event => renderAllDayEventButton(event, (e) => {
                      e.stopPropagation()
                      handleEventClick(event, { x: e.clientX, y: e.clientY })
                    }))}
                  </div>
                )
              })}
            </div>
            
            <div className="flex-1 grid grid-cols-7 grid-rows-23 relative">
              {timeSlots.map((hour) => (
                <div key={hour} className="col-span-7 border-b border-border" />
              ))}
              
              {Array.from({ length: 6 }, (_, i) => (
                <div 
                  key={`col-border-${i}`}
                  className="absolute top-0 bottom-0 border-r border-border"
                  style={{ left: `${((i + 1) / 7) * 100}%` }}
                />
              ))}
              
              {days.some(isCurrentDay) && (
                <div 
                  className="absolute left-0 right-0 border-t-2 border-red-500 z-10"
                  style={{ top: `${(currentTimePosition / 22) * 100}%`, height: '2px' }}
                />
              )}
              
              {days.map((day, dayIndex) => {
                const key = getDateKey(day)
                const dayEvents = (timedEventsByDate.get(key) || []).slice().sort((a,b) => {
                  const as = a.start?.dateTime || a.start?.date || ''
                  const bs = b.start?.dateTime || b.start?.date || ''
                  return as.localeCompare(bs)
                })
                
                return dayEvents.map((event) => {
                  const position = getEventPosition(event, dayIndex)
                  if (!position) return null
                  
                  const calColor = getCalendarColor(event.calendarId)
                  
                  return (
                    <div
                      key={`${event.calendarId}-${event.id}`}
                      className="absolute rounded bg-primary p-1 text-primary-foreground text-xs cursor-pointer hover:opacity-80 transition-opacity overflow-hidden z-20"
                      style={{
                        left: `${(position.dayIndex / 7) * 100}%`,
                        width: `${100 / 7}%`,
                        top: `${(position.top / 22) * 100}%`,
                        height: `${Math.max((position.height / 22) * 100, 4)}%`,
                        backgroundColor: calColor || undefined
                      }}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEventClick(event, { x: e.clientX, y: e.clientY })
                      }}
                      title={`${event.summary || '(No title)'}${event.location ? ` - ${event.location}` : ''}`}
                    >
                      <div className="font-medium truncate leading-tight">{event.summary || '(No title)'}</div>
                      <div className="text-[10px] opacity-90 truncate leading-tight">
                        {formatTime(event.start?.dateTime)}
                        {event.end?.dateTime && ` - ${formatTime(event.end?.dateTime)}`}
                      </div>
                      {event.location && (
                        <div className="text-[10px] opacity-90 truncate flex items-center gap-1 leading-tight">
                          <MapPin className="h-2 w-2 flex-shrink-0" />
                          <span className="truncate">{event.location}</span>
                        </div>
                      )}
                    </div>
                  )
                })
              })}
              
              <div 
                className="absolute inset-0 cursor-pointer z-10"
                onClick={(e) => {
                  const container = e.currentTarget as HTMLElement
                  const rect = container.getBoundingClientRect()
                  const x = e.clientX - rect.left
                  const y = e.clientY - rect.top
                  
                  const dayIndex = Math.floor((x / rect.width) * 7)
                  const percentage = y / rect.height
                  const totalMinutes = percentage * 22 * 60
                  const hour = Math.floor(totalMinutes / 60) + 1
                  const minute = Math.floor((totalMinutes % 60) / 30) * 30
                  
                  const clicked = new Date(days[dayIndex])
                  clicked.setHours(hour, minute, 0, 0)
                  handleDateClick(clicked, { x: e.clientX, y: e.clientY })
                }}
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderDay = () => {
    const key = getDateKey(currentDate)
    const dayEvents = (timedEventsByDate.get(key) || []).slice().sort((a,b) => {
      const as = a.start?.dateTime || a.start?.date || ''
      const bs = b.start?.dateTime || b.start?.date || ''
      return as.localeCompare(bs)
    })
    const allDayEvents = getAllDayEventsForDate(eventsByDate, currentDate)

    const timeSlots = []
    for (let hour = 1; hour <= 23; hour++) {
      timeSlots.push(hour)
    }

    const now = new Date()
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()
    const currentTimePosition = ((currentHour - 1) * 60 + currentMinute) / 60

    const getEventPosition = (event: CalendarEvent) => {
      const startTime = event.start?.dateTime ? new Date(event.start.dateTime) : null
      const endTime = event.end?.dateTime ? new Date(event.end.dateTime) : null
      
      if (!startTime) return null
      
      const startHour = startTime.getHours()
      const startMinute = startTime.getMinutes()
      const endHour = endTime ? endTime.getHours() : startHour + 1
      const endMinute = endTime ? endTime.getMinutes() : 0
      
      const top = ((startHour - 1) * 60 + startMinute) / 60
      const height = ((endHour - startHour) * 60 + (endMinute - startMinute)) / 60
      
      return { top, height }
    }

    const formatTimeLabel = (hour: number) => {
      if (hour === 0) return '12 AM'
      if (hour < 12) return `${hour} AM`
      if (hour === 12) return '12 PM'
      return `${hour - 12} PM`
    }

    return (
      <div className="flex-1 bg-card relative">
        <div className="flex h-full">
          <div className="w-16 flex-shrink-0 border-r border-border flex flex-col">
            {allDayEvents.length > 0 && (
              <div
                className="flex items-center justify-end border-b border-border pr-2 text-xs text-muted-foreground"
                style={{ height: allDayEvents.length * allDayEventRowHeight + 8 }}
              >
                All day
              </div>
            )}
            <div className="flex-1 grid grid-rows-23">
            {timeSlots.map((hour) => (
              <div key={hour} className="flex items-center justify-end pr-2 border-b border-border">
                <span className="text-xs text-muted-foreground">{formatTimeLabel(hour)}</span>
              </div>
            ))}
            </div>
          </div>
          
          <div className="flex-1 flex flex-col">
            {allDayEvents.length > 0 && (
              <div
                className="space-y-0.5 border-b border-border p-1"
                style={{ height: allDayEvents.length * allDayEventRowHeight + 8 }}
              >
                {allDayEvents.map(event => renderAllDayEventButton(event, (e) => {
                  e.stopPropagation()
                  handleEventClick(event, { x: e.clientX, y: e.clientY })
                }))}
              </div>
            )}

          <div className="flex-1 relative grid grid-rows-23">
            {timeSlots.map((hour) => (
              <div key={hour} className="border-b border-border" />
            ))}
            
            {currentDate.toDateString() === now.toDateString() && (
              <div 
                className="absolute left-0 right-0 border-t-2 border-red-500 z-10"
                style={{ top: `${(currentTimePosition / 22) * 100}%`, height: '2px' }}
              />
            )}
            
            {dayEvents.map((event) => {
              const position = getEventPosition(event)
              if (!position) return null
              
              const calColor = getCalendarColor(event.calendarId)
              
              return (
                <div
                  key={`${event.calendarId}-${event.id}`}
                  className="absolute left-1 right-1 rounded bg-primary p-1 text-primary-foreground text-xs cursor-pointer hover:opacity-80 transition-opacity overflow-hidden z-20"
                  style={{
                    top: `${(position.top / 22) * 100}%`,
                    height: `${Math.max((position.height / 22) * 100, 4)}%`,
                    backgroundColor: calColor || undefined
                  }}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleEventClick(event, { x: e.clientX, y: e.clientY })
                  }}
                  title={`${event.summary || '(No title)'}${event.location ? ` - ${event.location}` : ''}`}
                >
                  <div className="font-medium truncate leading-tight">{event.summary || '(No title)'}</div>
                  <div className="text-[10px] opacity-90 truncate leading-tight">
                    {formatTime(event.start?.dateTime)}
                    {event.end?.dateTime && ` - ${formatTime(event.end.dateTime)}`}
                  </div>
                  {event.location && (
                    <div className="text-[10px] opacity-90 truncate flex items-center gap-1 leading-tight">
                      <MapPin className="h-2 w-2 flex-shrink-0" />
                      <span className="truncate">{event.location}</span>
                    </div>
                  )}
                </div>
              )
            })}
            
            <div 
              className="absolute inset-0 cursor-pointer z-10"
              onClick={(e) => {
                const container = e.currentTarget as HTMLElement
                const rect = container.getBoundingClientRect()
                const y = e.clientY - rect.top
                const percentage = y / rect.height
                const totalMinutes = percentage * 22 * 60
                const hour = Math.floor(totalMinutes / 60) + 1
                const minute = Math.floor((totalMinutes % 60) / 30) * 30
                const clicked = new Date(currentDate)
                clicked.setHours(hour, minute, 0, 0)
                handleDateClick(clicked, { x: e.clientX, y: e.clientY })
              }}
            />
          </div>
          </div>
        </div>
      </div>
    )
  }

  // Count only visible calendars that actually exist in the dropdown (not phantom IDs like "primary")
  const calendarIdSet = new Set(calendars.map(c => c.id))
  const visibleCount = visibleCalendarIds.filter(id => calendarIdSet.has(id)).length
  const totalCount = calendars.length

  return (
    <div className="h-full flex flex-col bg-card">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Button variant="primary" size="icon-sm" onClick={goPrev}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="primary" size="icon-sm" onClick={goNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <div className="ml-3 text-sm font-medium text-foreground flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            {title}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 px-3">
                <CalendarIcon className="h-4 w-4 mr-1" />
                Calendars ({visibleCount}/{totalCount})
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Show calendars</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {calendars.length === 0 ? (
                <div className="px-2 py-1 text-xs text-muted-foreground">No calendars found</div>
              ) : (
                calendars.map((cal) => {
                  const isVisible = visibleCalendarIds.includes(cal.id)
                  return (
                    <DropdownMenuCheckboxItem
                      key={cal.id}
                      checked={isVisible}
                      onCheckedChange={() => handleCalendarToggle(cal.id)}
                      className="flex items-center gap-2"
                    >
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0 bg-muted"
                        style={{ backgroundColor: cal.backgroundColor || undefined }}
                      />
                      <span className="truncate">{getCalendarDisplayName(cal)}</span>
                      {cal.primary && <span className="text-xs text-muted-foreground ml-auto">(Primary)</span>}
                    </DropdownMenuCheckboxItem>
                  )
                })
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 w-24 justify-between px-3">
                {calendarViewLabels[view]}
                <ChevronRight className="h-4 w-4 rotate-90 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-32">
              <DropdownMenuLabel>View</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={view} onValueChange={(nextView) => setView(nextView as CalendarView)}>
                <DropdownMenuRadioItem value="month">Month</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="week">Week</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="day">Day</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="primary" size="icon-sm" onClick={loadEventsFromCalendars} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>
      {view === 'month' && renderMonth()}
      {view === 'week' && renderWeek()}
      {view === 'day' && renderDay()}
      
      <CreateEventPopover
        isOpen={isPopoverOpen}
        position={popoverPos}
        selectedDate={selectedDate}
        onClose={handlePopoverClose}
        onCreated={handleEventSaved}
      />

      {eventPopoverMode === 'view' ? (
        <ViewEventPopover
          isOpen={isEventPopoverOpen}
          position={eventPopoverPos}
          event={selectedEvent}
          calendarDetails={getEventCalendarDetails(selectedEvent)}
          onClose={handleEventPopoverClose}
          onEdit={handleSwitchToEditMode}
          onDeleted={handleEventDeleted}
        />
      ) : (
        <EditEventPopover
          isOpen={isEventPopoverOpen}
          position={eventPopoverPos}
          event={selectedEvent}
          onClose={handleEventPopoverClose}
          onSaved={handleEventSaved}
          onDeleted={handleEventDeleted}
          onBack={handleBackToViewMode}
        />
      )}
    </div>
  )
}

export default CalendarViewer
