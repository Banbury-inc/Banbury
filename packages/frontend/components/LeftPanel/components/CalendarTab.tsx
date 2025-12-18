import { Calendar, CalendarDays, Plus, RefreshCw, Settings, Clock, MapPin, Users, SquareArrowOutUpRight } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button } from '../../ui/button'
import { Typography } from '../../ui/typography'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuCheckboxItem, 
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from '../../ui/dropdown-menu'
import { CalendarEvent, CalendarListEntry } from '../../../../backend/api/calendar/calendar'
import { CreateEventPopover } from '../../MiddlePanel/CalendarViewer/CreateEventPopover'
import { ApiService } from 'backend/api/apiService'
import { loadCalendars } from './handlers/loadCalendars'
import { 
  getVisibleCalendarIds, 
  toggleCalendarVisibility,
  subscribeToVisibilityChanges 
} from './handlers/calendarVisibility'

interface CalendarTabProps {
  onOpenCalendarApp?: () => void
  onEventSelect?: (event: CalendarEvent) => void
  onCreateEvent?: () => void
}

const EVENTS_PER_PAGE = 20

export function CalendarTab({ onOpenCalendarApp, onEventSelect }: CalendarTabProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [calendarAvailable, setCalendarAvailable] = useState<boolean | null>(null)
  const [checkingAccess, setCheckingAccess] = useState(false)
  const [isCreatePopoverOpen, setIsCreatePopoverOpen] = useState(false)
  const [createPopoverPos, setCreatePopoverPos] = useState<{ x: number; y: number } | null>(null)
  const [calendars, setCalendars] = useState<CalendarListEntry[]>([])
  const [calendarsLoading, setCalendarsLoading] = useState(false)
  const [visibleCalendarIds, setVisibleCalendarIds] = useState<string[]>(() => getVisibleCalendarIds())
  const [displayedCount, setDisplayedCount] = useState(EVENTS_PER_PAGE)
  const [dateRange] = useState<{ start: string; end: string }>(() => {
    const start = new Date()
    const end = new Date()
    end.setDate(end.getDate() + 30)
    return { start: start.toISOString(), end: end.toISOString() }
  })

  const formatDateTime = useCallback((dt?: { date?: string; dateTime?: string; timeZone?: string }) => {
    if (!dt) return '—'
    const str = dt.dateTime || dt.date
    if (!str) return '—'
    const date = new Date(str)
    if (isNaN(date.getTime())) return str
    return date.toLocaleString()
  }, [])

  const loadMergedEvents = useCallback(async () => {
    // Filter visibleCalendarIds to only include IDs that actually exist in the calendar list
    // This prevents fetching events for phantom IDs like "primary" that don't match any real calendar
    const calendarIdSet = new Set(calendars.map(c => c.id))
    const validCalendarIds = visibleCalendarIds.filter(id => calendarIdSet.has(id))
    
    if (validCalendarIds.length === 0) {
      setEvents([])
      return
    }
    setLoading(true)
    setError(null)
    try {
      const eventPromises = validCalendarIds.map(async (calendarId) => {
        try {
          const resp = await ApiService.Calendar.listEvents({
            calendarId,
            timeMin: dateRange.start,
            timeMax: dateRange.end,
            maxResults: 250,
            singleEvents: true,
            orderBy: 'startTime'
          })
          return (resp.items || []).map(event => ({ ...event, calendarId }))
        } catch {
          return []
        }
      })
      const results = await Promise.all(eventPromises)
      const allEvents = results.flat()
      
      // Deduplicate events by ID - "primary" and email-based calendar IDs can return the same events
      const seenIds = new Set<string>()
      const deduplicatedEvents = allEvents.filter(event => {
        if (seenIds.has(event.id)) return false
        seenIds.add(event.id)
        return true
      })
      
      deduplicatedEvents.sort((a, b) => {
        const aStart = a.start?.dateTime || a.start?.date || ''
        const bStart = b.start?.dateTime || b.start?.date || ''
        return aStart.localeCompare(bStart)
      })
      setEvents(deduplicatedEvents)
      setDisplayedCount(EVENTS_PER_PAGE)
    } catch {
      setError('Failed to load calendar events. Please check your Calendar access.')
    } finally {
      setLoading(false)
    }
  }, [visibleCalendarIds, dateRange.start, dateRange.end, calendars])

  const checkCalendarAccess = useCallback(async () => {
    try {
      setCheckingAccess(true)
      const isAvailable = await ApiService.Scopes.isFeatureAvailable('calendar')
      setCalendarAvailable(isAvailable)
    } catch {
      setCalendarAvailable(false)
    } finally {
      setCheckingAccess(false)
    }
  }, [])

  const requestCalendarAccess = useCallback(async () => {
    try {
      await ApiService.Scopes.requestFeatureAccess(['calendar'])
    } catch { /* empty */ }
  }, [])

  const fetchCalendars = useCallback(async () => {
    setCalendarsLoading(true)
    try {
      const cals = await loadCalendars()
      setCalendars(cals)
    } catch {
      setCalendars([])
    } finally {
      setCalendarsLoading(false)
    }
  }, [])

  useEffect(() => {
    checkCalendarAccess()
  }, [checkCalendarAccess])

  useEffect(() => {
    if (calendarAvailable) {
      fetchCalendars()
    }
  }, [calendarAvailable, fetchCalendars])

  useEffect(() => {
    const unsubscribe = subscribeToVisibilityChanges((ids) => {
      setVisibleCalendarIds(ids)
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    if (calendarAvailable) {
      loadMergedEvents()
    }
  }, [visibleCalendarIds, calendarAvailable, loadMergedEvents])

  const displayedEvents = useMemo(() => {
    return events.slice(0, displayedCount)
  }, [events, displayedCount])

  const hasMore = displayedCount < events.length

  const onScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
    if (hasMore && scrollHeight - scrollTop <= clientHeight + 100) {
      setDisplayedCount(prev => Math.min(prev + EVENTS_PER_PAGE, events.length))
    }
  }, [hasMore, events.length])

  const handleSelect = useCallback((event: CalendarEvent) => {
    if (onEventSelect) onEventSelect(event)
  }, [onEventSelect])

  const handleCreateEvent = useCallback((e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setCreatePopoverPos({ x: rect.left, y: rect.bottom + 8 })
    setIsCreatePopoverOpen(true)
  }, [])

  const handleCreatePopoverClose = useCallback(() => {
    setIsCreatePopoverOpen(false)
    setCreatePopoverPos(null)
  }, [])

  const handleEventCreated = useCallback(() => {
    loadMergedEvents()
  }, [loadMergedEvents])

  const handleCalendarToggle = useCallback((calendarId: string) => {
    toggleCalendarVisibility(calendarId)
  }, [])

  const getCalendarDisplayName = (cal: CalendarListEntry) => {
    return cal.summaryOverride || cal.summary || cal.id
  }

  // Count only visible calendars that actually exist in the dropdown (not phantom IDs like "primary")
  const calendarIdSet = new Set(calendars.map(c => c.id))
  const visibleCount = visibleCalendarIds.filter(id => calendarIdSet.has(id)).length
  const totalCount = calendars.length

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-col bg-card">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-4">
            {/* Calendar Navigation */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="xs"
                  title="Calendars"
                >
                  <Calendar className="h-3.5 w-3.5 mr-1" strokeWidth={1.5} />
                  {totalCount > 0 && (
                    <Typography variant="xs" className="font-medium">
                      {visibleCount}/{totalCount}
                    </Typography>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>Show calendars</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {calendarsLoading ? (
                  <div className="flex items-center justify-center py-2">
                    <RefreshCw className="h-3 w-3 animate-spin mr-2 text-muted-foreground" strokeWidth={1} />
                    <Typography variant="xs" className="text-muted-foreground">Loading...</Typography>
                  </div>
                ) : calendars.length === 0 ? (
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
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: cal.backgroundColor || '#3b82f6' }}
                        />
                        <span className="truncate">{getCalendarDisplayName(cal)}</span>
                        {cal.primary && <span className="text-xs text-muted-foreground ml-auto">(Primary)</span>}
                      </DropdownMenuCheckboxItem>
                    )
                  })
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="xs"
              onClick={() => {
                if (onOpenCalendarApp) {
                  onOpenCalendarApp()
                } else if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('calendar-open', { detail: { view: 'month' } }))
                }
              }}
              title="Open Calendar"
            >
              <SquareArrowOutUpRight className="h-4 w-4" strokeWidth={1.5} />
            </Button>
            <Button
              variant="outline"
              size="xs"
              onClick={() => loadMergedEvents()}
              disabled={loading}
              title="Refresh"
            >
              <RefreshCw className={`${loading ? 'animate-spin' : ''}`} strokeWidth={1} />
            </Button>
            <Button
              variant="default"
              size="xs"
              onClick={handleCreateEvent}
              title="Create Event"
            >
              <Plus />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {checkingAccess ? (
          <div className="flex items-center justify-center h-full">
            <RefreshCw className="h-4 w-4 animate-spin mr-2 text-muted-foreground" strokeWidth={1} />
            <Typography variant="muted">Checking Calendar access...</Typography>
          </div>
        ) : calendarAvailable === false ? (
          <div className="flex flex-col items-center justify-center h-full p-4">
            <Calendar className="h-12 w-12 mb-4 opacity-50 text-muted-foreground" strokeWidth={1} />
            <Typography variant="h3" className="mb-2">Google Calendar Access Required</Typography>
            <Typography variant="small" className="text-center mb-4 max-w-md text-muted-foreground">
              To use calendar features, you need to grant Calendar access to your Google account.
            </Typography>
            <Button onClick={requestCalendarAccess} variant="default">
              <Settings className="h-4 w-4 mr-2" strokeWidth={1} />
              Activate Calendar Access
            </Button>
          </div>
        ) : (
          <div className="h-full flex flex-col">
            {error && (
              <div className="p-4 bg-destructive/10 border border-destructive/30 rounded m-2">
                <Typography variant="small" className="text-destructive">{error}</Typography>
              </div>
            )}
            {(loading || calendarsLoading || (calendarAvailable && calendars.length > 0 && events.length === 0 && !error)) ? (
              <div className="flex items-center justify-center flex-1">
                <RefreshCw className="h-4 w-4 animate-spin mr-2 text-muted-foreground" strokeWidth={1} />
                <Typography variant="muted">Loading events...</Typography>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto" onScroll={onScroll}>
                {displayedEvents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full p-4">
                    <Calendar className="h-12 w-12 mb-4 opacity-50 text-muted-foreground" strokeWidth={1} />
                    <Typography variant="small" className="mb-2 text-muted-foreground">No events found in the selected range</Typography>
                  </div>
                ) : (
                  displayedEvents.map((ev) => {
                    const calColor = calendars.find(c => c.id === ev.calendarId)?.backgroundColor
                    return (
                      <div
                        key={`${ev.calendarId}-${ev.id}`}
                        onClick={() => handleSelect(ev)}
                        className="group p-3 border-b border-border cursor-pointer hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              {calColor && (
                                <div 
                                  className="w-2 h-2 rounded-full flex-shrink-0" 
                                  style={{ backgroundColor: calColor }}
                                />
                              )}
                              <Typography variant="small" className="font-medium truncate">{ev.summary || '(No title)'}</Typography>
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-3">
                              <Typography variant="muted" className="flex items-center gap-1 text-xs">
                                <Clock className="h-4 w-4" strokeWidth={1} /> {formatDateTime(ev.start)} → {formatDateTime(ev.end)}
                              </Typography>
                              {ev.location && (
                                <Typography variant="muted" className="flex items-center gap-1 text-xs">
                                  <MapPin className="h-4 w-4" strokeWidth={1} /> {ev.location}
                                </Typography>
                              )}
                              {ev.attendees && ev.attendees.length > 0 && (
                                <Typography variant="muted" className="flex items-center gap-1 text-xs">
                                  <Users className="h-4 w-4" strokeWidth={1} /> {ev.attendees.length}
                                </Typography>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}

                {hasMore && (
                  <div className="flex items-center justify-center py-4">
                    <Typography variant="muted" className="text-xs">Scroll for more...</Typography>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <CreateEventPopover
        isOpen={isCreatePopoverOpen}
        position={createPopoverPos}
        selectedDate={new Date()}
        onClose={handleCreatePopoverClose}
        onCreated={handleEventCreated}
      />
    </div>
  )
}

export default CalendarTab
