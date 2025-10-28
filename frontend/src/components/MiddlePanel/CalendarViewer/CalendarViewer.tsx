import { useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, MapPin, RefreshCw, Plus } from 'lucide-react'

import { Button } from '../../ui/button'
import { CalendarService, CalendarEvent } from '../../../services/calendarService'
import { CreateEventPopover } from './CreateEventPopover'
import { EditEventPopover } from './EditEventPopover'

type CalendarView = 'month' | 'week' | 'day'

interface CalendarViewerProps {
  initialDate?: Date
  initialView?: CalendarView
  onEventClick?: (event: CalendarEvent) => void
}

export function CalendarViewer({ initialDate, initialView = 'month', onEventClick }: CalendarViewerProps) {
  const [currentDate, setCurrentDate] = useState<Date>(initialDate || new Date())
  const [view, setView] = useState<CalendarView>(initialView)
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)
  const [popoverPos, setPopoverPos] = useState<{ x: number; y: number } | null>(null)
  const [isEditPopoverOpen, setIsEditPopoverOpen] = useState(false)
  const [editPopoverPos, setEditPopoverPos] = useState<{ x: number; y: number } | null>(null)
  const [isClosingPopover, setIsClosingPopover] = useState(false)

  const startOfWeek = useCallback((date: Date) => {
    const d = new Date(date)
    const day = (d.getDay() + 7) % 7 // 0 = Sunday
    d.setDate(d.getDate() - day)
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const startOfMonth = useCallback((date: Date) => {
    const d = new Date(date.getFullYear(), date.getMonth(), 1)
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const endOfMonth = useCallback((date: Date) => {
    const d = new Date(date.getFullYear(), date.getMonth() + 1, 0)
    d.setHours(23, 59, 59, 999)
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
    end.setDate(end.getDate() + 41) // 6 weeks grid
    end.setHours(23, 59, 59, 999)
    return { start, end }
  }, [currentDate, view, startOfWeek, startOfMonth])

  const loadEvents = useCallback(async () => {
    setLoading(true)
    try {
      const resp = await CalendarService.listEvents({
        timeMin: visibleRange.start.toISOString(),
        timeMax: visibleRange.end.toISOString(),
        maxResults: 2500,
        singleEvents: true,
        orderBy: 'startTime'
      })
      setEvents(resp.items || [])
    } finally {
      setLoading(false)
    }
  }, [visibleRange.start, visibleRange.end])

  const handleEventClick = (event: CalendarEvent, clickPos?: { x: number; y: number }) => {
    // Don't open popover if another popover is already open or if we're in the process of closing
    if (isPopoverOpen || isEditPopoverOpen || isClosingPopover) return
    
    setSelectedEvent(event)
    setSelectedDate(null)
    const defaultPos = typeof window !== 'undefined' ? { x: window.innerWidth / 2, y: window.innerHeight / 3 } : { x: 0, y: 0 }
    setEditPopoverPos(clickPos || defaultPos)
    setIsEditPopoverOpen(true)
    onEventClick?.(event)
  }

  const handleDateClick = (date: Date, clickPos?: { x: number; y: number }) => {
    // Don't open popover if another popover is already open or if we're in the process of closing
    if (isPopoverOpen || isEditPopoverOpen || isClosingPopover) return
    
    setSelectedEvent(null)
    setSelectedDate(date)
    const defaultPos = typeof window !== 'undefined' ? { x: window.innerWidth / 2, y: window.innerHeight / 3 } : { x: 0, y: 0 }
    setPopoverPos(clickPos || defaultPos)
    setIsPopoverOpen(true)
  }

  const handleEventSaved = () => {
    loadEvents()
  }

  const handleEventDeleted = () => {
    loadEvents()
  }

  const handlePopoverClose = () => {
    setIsClosingPopover(true)
    setIsPopoverOpen(false)
    setPopoverPos(null)
    setSelectedDate(null)
    // Reset the closing flag after a short delay
    setTimeout(() => setIsClosingPopover(false), 100)
  }

  const handleEditPopoverClose = () => {
    setIsClosingPopover(true)
    setIsEditPopoverOpen(false)
    setEditPopoverPos(null)
    setSelectedEvent(null)
    // Reset the closing flag after a short delay
    setTimeout(() => setIsClosingPopover(false), 100)
  }

  useEffect(() => {
    loadEvents()
  }, [loadEvents])

  const goToday = () => setCurrentDate(new Date())
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
      const startStr = ev.start?.dateTime || ev.start?.date
      if (!startStr) continue
      const d = new Date(startStr)
      const key = d.toISOString().slice(0, 10)
      add(key, ev)
    }
    return map
  }, [events])

  const renderMonth = () => {
    const days: Date[] = []
    const start = visibleRange.start
    for (let i = 0; i < 42; i++) {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      days.push(d)
    }
    return (
      <div className="flex-1 overflow-auto bg-accent">
        <div className="grid grid-cols-7 border-t border-l border-border h-full">
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d) => (
            <div key={d} className="p-2 text-xs font-medium text-gray-600 dark:text-zinc-400 border-r border-b border-border">{d}</div>
          ))}
          {days.map((d, idx) => {
            const key = d.toISOString().slice(0,10)
            const dayEvents = eventsByDate.get(key) || []
            const isCurrentMonth = d.getMonth() === currentDate.getMonth()
            const isToday = (new Date()).toDateString() === d.toDateString()
            return (
              <div 
                key={idx} 
                className={`min-h-[7rem] p-1 border-r border-b border-border ${isCurrentMonth ? 'bg-accent' : 'bg-background'} ${isToday ? 'ring-1 ring-blue-500' : ''} cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700/50 transition-colors`}
                onClick={(e) => handleDateClick(d, { x: e.clientX, y: e.clientY })}
              >
                <div className="text-xs text-gray-600 dark:text-zinc-400 mb-1 flex items-center justify-between">
                  <span className={`px-1 rounded ${isToday ? 'bg-blue-600 text-white' : ''}`}>{d.getDate()}</span>
                  <Plus className="h-3 w-3 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300" />
                </div>
                <div className="space-y-0.5">
                  {dayEvents.slice(0, 3).map(ev => (
                    <button 
                      key={ev.id} 
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEventClick(ev, { x: e.clientX, y: e.clientY })
                      }} 
                      className="w-full text-left truncate text-xs px-1 py-0.5 rounded bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800/50 border border-blue-300 dark:border-blue-700/50 overflow-hidden"
                      title={ev.summary || '(No title)'}
                    >
                      {ev.summary || '(No title)'}
                    </button>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-[10px] text-gray-500 dark:text-zinc-500">+{dayEvents.length - 3} more</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const formatTime = (iso?: string) => {
    if (!iso) return ''
    const d = new Date(iso)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const renderWeek = () => {
    const days: Date[] = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(visibleRange.start)
      d.setDate(visibleRange.start.getDate() + i)
      days.push(d)
    }

    // Generate time slots from 1 AM to 11 PM
    const timeSlots = []
    for (let hour = 1; hour <= 23; hour++) {
      timeSlots.push(hour)
    }

    // Get current time for the indicator
    const now = new Date()
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()
    const currentTimePosition = ((currentHour - 1) * 60 + currentMinute) / 60

    // Calculate event positions
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
      <div className="flex-1 bg-accent">
        <div className="flex h-full">
          {/* Time axis */}
          <div className="w-16 flex-shrink-0 border-r border-border flex flex-col">
            {/* Timezone indicator */}
            <div className="h-8 flex items-center justify-center text-xs text-gray-500 dark:text-zinc-400 border-b border-border">
            </div>
            {/* Time labels */}
            <div className="flex-1 grid grid-rows-23">
              {timeSlots.map((hour) => (
                <div key={hour} className="flex items-center justify-end pr-2 border-b border-border">
                  <span className="text-xs text-gray-500 dark:text-zinc-400">{formatTimeLabel(hour)}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Calendar grid */}
          <div className="flex-1 flex flex-col">
            {/* Day headers */}
            <div className="h-8 grid grid-cols-7 border-b border-border">
              {days.map((d) => (
                <div key={d.toISOString()} className="p-1 text-center border-r border-border bg-zinc-100 dark:bg-zinc-800">
                  <div className="text-xs font-medium text-gray-600 dark:text-zinc-400">
                    {d.toLocaleDateString(undefined, { weekday: 'short' }).toUpperCase()}
                  </div>
                  <div className={`text-xs font-medium ${isCurrentDay(d) ? 'text-blue-500 dark:text-blue-400' : 'text-gray-700 dark:text-slate-300'}`}>
                    {isCurrentDay(d) ? (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full border border-blue-500 dark:border-blue-400">
                        {d.getDate()}
                      </span>
                    ) : (
                      d.getDate()
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Time grid */}
            <div className="flex-1 grid grid-cols-7 grid-rows-23 relative">
              {/* Hour lines */}
              {timeSlots.map((hour) => (
                <div 
                  key={hour} 
                  className="col-span-7 border-b border-border"
                />
              ))}
              
              {/* Column borders */}
              {Array.from({ length: 6 }, (_, i) => (
                <div 
                  key={`col-border-${i}`}
                  className="absolute top-0 bottom-0 border-r border-border"
                  style={{ left: `${((i + 1) / 7) * 100}%` }}
                />
              ))}
              
              {/* Current time indicator */}
              {days.some(isCurrentDay) && (
                <div 
                  className="absolute left-0 right-0 border-t-2 border-red-500 z-10"
                  style={{ 
                    top: `${(currentTimePosition / 22) * 100}%`,
                    height: '2px'
                  }}
                />
              )}
              
              {/* Events */}
              {days.map((day, dayIndex) => {
                const key = day.toISOString().slice(0,10)
                const dayEvents = (eventsByDate.get(key) || []).slice().sort((a,b) => {
                  const as = a.start?.dateTime || a.start?.date || ''
                  const bs = b.start?.dateTime || b.start?.date || ''
                  return as.localeCompare(bs)
                })
                
                return dayEvents.map((event) => {
                  const position = getEventPosition(event, dayIndex)
                  if (!position) return null
                  
                  // Use different colors for different event types
                  const eventColors = ['bg-blue-600', 'bg-green-600', 'bg-purple-600', 'bg-orange-600', 'bg-red-600', 'bg-pink-600']
                  const hash = event.id.split('').reduce((a, b) => {
                    a = ((a << 5) - a) + b.charCodeAt(0)
                    return a & a
                  }, 0)
                  const eventColor = eventColors[Math.abs(hash) % eventColors.length]
                  
                  return (
                    <div
                      key={event.id}
                      className={`absolute rounded p-1 text-white text-xs cursor-pointer hover:opacity-80 transition-opacity ${eventColor} overflow-hidden z-20`}
                      style={{
                        left: `${(position.dayIndex / 7) * 100}%`,
                        width: `${100 / 7}%`,
                        top: `${(position.top / 22) * 100}%`,
                        height: `${Math.max((position.height / 22) * 100, 4)}%`
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
              
              {/* Clickable area for creating new events */}
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
    const key = currentDate.toISOString().slice(0,10)
    const dayEvents = (eventsByDate.get(key) || []).slice().sort((a,b) => {
      const as = a.start?.dateTime || a.start?.date || ''
      const bs = b.start?.dateTime || b.start?.date || ''
      return as.localeCompare(bs)
    })

    // Generate time slots from 1 AM to 11 PM
    const timeSlots = []
    for (let hour = 1; hour <= 23; hour++) {
      timeSlots.push(hour)
    }

    // Get current time for the indicator
    const now = new Date()
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()
    const currentTimePosition = ((currentHour - 1) * 60 + currentMinute) / 60 // Position in the grid

    // Calculate event positions
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
      <div className="flex-1 bg-zinc-50 dark:bg-zinc-900 relative">
        <div className="flex h-full">
          {/* Time axis */}
          <div className="w-16 flex-shrink-0 border-r border-border grid grid-rows-23">
            {timeSlots.map((hour) => (
              <div key={hour} className="flex items-center justify-end pr-2 border-b border-zinc-300 dark:border-zinc-700">
                <span className="text-xs text-gray-500 dark:text-zinc-400">{formatTimeLabel(hour)}</span>
              </div>
            ))}
          </div>
          
          {/* Calendar grid */}
          <div className="flex-1 relative grid grid-rows-23">
            {/* Hour lines */}
            {timeSlots.map((hour) => (
              <div 
                key={hour} 
                className="border-b border-zinc-300 dark:border-zinc-700"
              />
            ))}
            
            {/* Current time indicator */}
            {currentDate.toDateString() === now.toDateString() && (
              <div 
                className="absolute left-0 right-0 border-t-2 border-red-500 z-10"
                style={{ 
                  top: `${(currentTimePosition / 22) * 100}%`,
                  height: '2px'
                }}
              />
            )}
            
            {/* Events */}
            {dayEvents.map((event) => {
              const position = getEventPosition(event)
              if (!position) return null
              
              // Use different colors for different event types or default to blue
              const eventColors = ['bg-blue-600', 'bg-green-600', 'bg-purple-600', 'bg-orange-600', 'bg-red-600']
              const hash = event.id.split('').reduce((a, b) => {
                a = ((a << 5) - a) + b.charCodeAt(0)
                return a & a
              }, 0)
              const eventColor = eventColors[Math.abs(hash) % eventColors.length]
              
              return (
                <div
                  key={event.id}
                  className={`absolute left-1 right-1 rounded p-1 text-white text-xs cursor-pointer hover:opacity-80 transition-opacity ${eventColor} overflow-hidden z-20`}
                  style={{
                    top: `${(position.top / 22) * 100}%`,
                    height: `${Math.max((position.height / 22) * 100, 4)}%`
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
            
            {/* Clickable area for creating new events */}
            <div 
              className="absolute inset-0 cursor-pointer z-10"
              onClick={(e) => {
                const container = e.currentTarget as HTMLElement
                const rect = container.getBoundingClientRect()
                const y = e.clientY - rect.top
                const percentage = y / rect.height
                const totalMinutes = percentage * 22 * 60 // 22 hours * 60 minutes
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
    )
  }

  return (
    <div className="h-full flex flex-col bg-accent">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Button variant="primary" size="icon-sm" onClick={goPrev}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="primary" size="icon-sm" onClick={goNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="primary" size="icon-sm" className="h-8 w-14 px-3 bg-accent hover:bg-accent/80 hover:text-white text-gray-900 dark:text-white" onClick={goToday}>Today</Button>
          <div className="ml-3 text-sm font-medium text-gray-900 dark:text-zinc-200 flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            {title}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="primary" size="icon-sm" className={`h-8 w-14 px-3 ${view==='month' ? 'bg-accent text-gray-900 dark:text-white border-border' : 'text-gray-600 dark:text-zinc-300 border-border hover:bg-zinc-300 dark:hover:bg-zinc-800'}`} onClick={() => setView('month')}>Month</Button>
          <Button variant="primary" size="icon-sm" className={`h-8 w-14 px-3 ${view==='week' ? 'bg-accent text-gray-900 dark:text-white border-border' : 'text-gray-600 dark:text-zinc-300 border-border hover:bg-zinc-300 dark:hover:bg-zinc-800'}`} onClick={() => setView('week')}>Week</Button>
          <Button variant="primary" size="icon-sm" className={`h-8 w-14 px-3 ${view==='day' ? 'bg-accent text-gray-900 dark:text-white border-border' : 'text-gray-600 dark:text-zinc-300 border-border hover:bg-zinc-300 dark:hover:bg-zinc-800'}`} onClick={() => setView('day')}>Day</Button>
          <Button variant="primary" size="icon-sm" onClick={loadEvents} disabled={loading}>
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

      <EditEventPopover
        isOpen={isEditPopoverOpen}
        position={editPopoverPos}
        event={selectedEvent}
        onClose={handleEditPopoverClose}
        onSaved={handleEventSaved}
        onDeleted={handleEventDeleted}
      />
    </div>
  )
}

export default CalendarViewer


