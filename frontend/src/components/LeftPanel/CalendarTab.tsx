import { Calendar, Plus, RefreshCw, Search, Settings, Clock, MapPin, Users } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { CalendarService, CalendarEvent, ListEventsResponse } from '../../services/calendarService'
import { ScopeService } from '../../services/scopeService'
import { CreateEventPopover } from '../MiddlePanel/CalendarViewer/CreateEventPopover'

interface CalendarTabProps {
  onOpenCalendarApp?: () => void
  onEventSelect?: (event: CalendarEvent) => void
  onCreateEvent?: () => void
}

export function CalendarTab({ onOpenCalendarApp, onEventSelect, onCreateEvent }: CalendarTabProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [nextPageToken, setNextPageToken] = useState<string | undefined>(undefined)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [calendarAvailable, setCalendarAvailable] = useState<boolean | null>(null)
  const [checkingAccess, setCheckingAccess] = useState(false)
  const [isCreatePopoverOpen, setIsCreatePopoverOpen] = useState(false)
  const [createPopoverPos, setCreatePopoverPos] = useState<{ x: number; y: number } | null>(null)
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>(() => {
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

  const loadEvents = useCallback(async (pageToken?: string, query?: string) => {
    if (pageToken) setIsLoadingMore(true); else setLoading(true)
    setError(null)
    try {
      const resp: ListEventsResponse = await CalendarService.listEvents({
        timeMin: dateRange.start,
        timeMax: dateRange.end,
        maxResults: 20,
        pageToken,
        query,
        singleEvents: true,
        orderBy: 'startTime'
      })
      const newItems = resp.items || []
      if (pageToken) {
        setEvents(prev => [...prev, ...newItems])
      } else {
        setEvents(newItems)
      }
      setNextPageToken(resp.nextPageToken)
    } catch (e) {
      setError('Failed to load calendar events. Please check your Calendar access.')
    } finally {
      if (pageToken) setIsLoadingMore(false); else setLoading(false)
    }
  }, [dateRange.start, dateRange.end])

  const checkCalendarAccess = useCallback(async () => {
    try {
      setCheckingAccess(true)
      const isAvailable = await ScopeService.isFeatureAvailable('calendar')
      setCalendarAvailable(isAvailable)
    } catch (e) {
      setCalendarAvailable(false)
    } finally {
      setCheckingAccess(false)
    }
  }, [])

  const requestCalendarAccess = useCallback(async () => {
    try {
      await ScopeService.requestFeatureAccess(['calendar'])
    } catch {}
  }, [])

  useEffect(() => {
    checkCalendarAccess()
  }, [checkCalendarAccess])

  useEffect(() => {
    if (calendarAvailable) {
      loadEvents()
    }
  }, [calendarAvailable, loadEvents])

  const onScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
    if (nextPageToken && !isLoadingMore && scrollHeight - scrollTop <= clientHeight + 100) {
      loadEvents(nextPageToken, searchQuery)
    }
  }, [nextPageToken, isLoadingMore, loadEvents, searchQuery])

  const handleSearch = useCallback(() => {
    loadEvents(undefined, searchQuery)
  }, [searchQuery, loadEvents])

  const handleSelect = useCallback(async (event: CalendarEvent) => {
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
    loadEvents()
  }, [loadEvents])

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 bg-zinc-200 dark:bg-zinc-800">
        <h2 className="text-gray-800 dark:text-gray-200 text-sm font-medium">Calendar</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-zinc-300/50 dark:hover:bg-zinc-700/50"
            onClick={() => {
              if (onOpenCalendarApp) {
                onOpenCalendarApp()
              } else if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('calendar-open', { detail: { view: 'month' } }))
              }
            }}
          >
            Open Calendar
          </Button>
          <Button
            variant="primary"
            size="xsm"
            onClick={() => loadEvents(undefined, searchQuery)}
            disabled={loading}
          >
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            variant="primary"
            size="xsm"
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={handleCreateEvent}
            title="Create Event"
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* <div className="px-4 py-2 bg-zinc-200 dark:bg-zinc-800 border-b border-zinc-300 dark:border-zinc-700">
        <div className="flex gap-2">
          <Input
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1 bg-zinc-100 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-gray-900 dark:text-white text-sm"
          />
          <Button size="sm" onClick={handleSearch} className="bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-gray-900 dark:text-white h-9 px-3">
            <Search className="h-3 w-3" />
          </Button>
        </div>
      </div> */}

      <div className="flex-1 overflow-hidden">
        {checkingAccess ? (
          <div className="flex items-center justify-center h-full text-gray-600 dark:text-gray-400">
            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            Checking Calendar access...
          </div>
        ) : calendarAvailable === false ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-600 dark:text-gray-400 p-4">
            <Calendar className="h-12 w-12 mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Google Calendar Access Required</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-4 max-w-md">
              To use calendar features, you need to grant Calendar access to your Google account.
            </p>
            <Button onClick={requestCalendarAccess} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Settings className="h-4 w-4 mr-2" />
              Activate Calendar Access
            </Button>
          </div>
        ) : (
          <div className="h-full flex flex-col">
            {error && (
              <div className="p-4 text-red-600 dark:text-red-400 text-sm bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded m-2">{error}</div>
            )}
            {loading && events.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-600 dark:text-gray-400">
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                Loading events...
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto" onScroll={onScroll}>
                {events.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-600 dark:text-gray-400 p-4">
                    <Calendar className="h-12 w-12 mb-4 opacity-50" />
                    <p className="text-sm mb-2">No events found in the selected range</p>
                  </div>
                ) : (
                  events.map((ev) => {
                    return (
                      <div
                        key={ev.id}
                        onClick={() => handleSelect(ev)}
                        className="group p-3 border-b border-zinc-300 dark:border-zinc-700 cursor-pointer hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{ev.summary || '(No title)'}</div>
                            <div className="mt-1 text-xs text-gray-600 dark:text-gray-400 flex flex-wrap items-center gap-3">
                              <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {formatDateTime(ev.start)} → {formatDateTime(ev.end)}</span>
                              {ev.location && (
                                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {ev.location}</span>
                              )}
                              {ev.attendees && ev.attendees.length > 0 && (
                                <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {ev.attendees.length}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}

                {isLoadingMore && (
                  <div className="flex items-center justify-center py-4 text-gray-600 dark:text-gray-400">
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    Loading more events...
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


