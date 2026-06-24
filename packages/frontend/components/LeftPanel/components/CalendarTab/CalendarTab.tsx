import { Calendar, Plus, RefreshCw, Settings, Clock, MapPin, Users, SquareArrowOutUpRight, ChevronDown } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button } from '../../../common/ui/button'
import { Typography } from '../../../common/ui/typography'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '../../../common/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '../../../common/ui/popover'
import { Checkbox } from '../../../common/ui/checkbox'
import { CalendarEvent, CalendarListEntry } from '../../../../../backend/api/calendar/calendar'
import { CreateEventPopover } from '../../../../components/MiddlePanel/CalendarViewer/CreateEventPopover'
import { ApiService } from 'backend/api/apiService'
import { loadCalendars } from './handlers/loadCalendars'
import { loadMicrosoftCalendars } from './handlers/loadMicrosoftCalendars'
import { checkMicrosoftCalendarStatus, type MicrosoftCalendarStatus } from './handlers/checkMicrosoftCalendarStatus'
import { 
  getVisibleCalendarIds, 
  initializeVisibleCalendarIds,
  toggleCalendarVisibility,
  subscribeToVisibilityChanges 
} from './handlers/calendarVisibility'
import { 
  getSelectedProvider,
  setSelectedProvider,
  subscribeToProviderChanges,
  type CalendarProvider
} from './calendarProvider'
import { OutlookIcon } from '../../../../components/icons/OutlookIcon'
import { CONFIG } from '../../../../config/config'
import { useCalendarWorkspaceHandlers } from './handlers/calendarWorkspaceHandlers'
import { PanelGroup } from '../../../../pages/Workspaces/types'

interface CalendarTabProps {
  onOpenCalendarApp?: () => void
  onCreateEvent?: () => void
  // Workspace dependencies
  activePanelId?: string
  panelLayout?: PanelGroup
  setPanelLayout?: React.Dispatch<React.SetStateAction<PanelGroup>>
  setActivePanelId?: React.Dispatch<React.SetStateAction<string>>
  setCalendarJumpDate?: React.Dispatch<React.SetStateAction<Date | null>>
  setCalendarSelectedEvent?: React.Dispatch<React.SetStateAction<CalendarEvent | null>>
}

const EVENTS_PER_PAGE = 20

// Google Calendar icon component
function GoogleCalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M18.316 5.684H5.684v12.632h12.632V5.684z" fill="#fff"/>
      <path d="M18.316 23.5l5.184-5.184h-5.184V23.5z" fill="#EA4335"/>
      <path d="M23.5 5.684V18.316h-5.184V5.684H23.5z" fill="#FBBC04"/>
      <path d="M18.316 18.316H5.684v5.184h12.632v-5.184z" fill="#34A853"/>
      <path d="M0.5 18.316v3.107c0 1.147.93 2.077 2.077 2.077h3.107v-5.184H0.5z" fill="#188038"/>
      <path d="M23.5 5.684H18.316V0.5l5.184 5.184z" fill="#1967D2"/>
      <path d="M18.316 0.5H2.577A2.077 2.077 0 000.5 2.577v15.739h5.184V5.684h12.632V0.5z" fill="#4285F4"/>
      <path d="M8.27 16.393a3.24 3.24 0 01-1.357-.96l.957-.788c.22.289.489.521.807.696.318.175.67.262 1.056.262.401 0 .749-.098 1.044-.294.294-.196.442-.475.442-.837 0-.375-.156-.657-.469-.845-.312-.188-.728-.282-1.247-.282h-.77v-1.21h.696c.437 0 .794-.083 1.069-.249.276-.166.413-.42.413-.762 0-.306-.127-.545-.381-.717-.254-.173-.582-.259-.985-.259-.331 0-.632.07-.902.21a1.797 1.797 0 00-.659.56l-.907-.843c.26-.33.609-.597 1.045-.8.437-.203.934-.305 1.491-.305.454 0 .864.068 1.23.205.366.136.654.335.864.595.21.26.315.572.315.934 0 .394-.115.72-.344.978-.229.259-.518.443-.866.553v.057c.427.1.77.298 1.03.592.259.294.389.653.389 1.077 0 .409-.107.769-.32 1.08-.214.311-.514.553-.901.725-.387.173-.836.259-1.347.259-.629 0-1.17-.115-1.621-.344zm6.598-.153v-6.165l-1.645.586-.312-1.13 2.275-.832h1.078v7.54H14.87z" fill="#4285F4"/>
    </svg>
  )
}

export function CalendarTab({ 
  onOpenCalendarApp, 
  onCreateEvent,
  activePanelId = 'main-panel',
  panelLayout,
  setPanelLayout,
  setActivePanelId,
  setCalendarJumpDate,
  setCalendarSelectedEvent
}: CalendarTabProps) {
  // Always call hooks unconditionally
  const workspaceHandlers = useCalendarWorkspaceHandlers({
    activePanelId,
    panelLayout,
    setPanelLayout,
    setActivePanelId,
    setCalendarJumpDate,
    setCalendarSelectedEvent
  })

  const onEventSelect = workspaceHandlers?.handleCalendarEventSelect
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
  const [provider, setProvider] = useState<CalendarProvider>(() => getSelectedProvider())
  const [msCalendarStatus, setMsCalendarStatus] = useState<MicrosoftCalendarStatus | null>(null)
  const [checkingMsStatus, setCheckingMsStatus] = useState(false)
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
      const CalendarApi = provider === 'microsoft' ? ApiService.OutlookCalendar : ApiService.Calendar
      const eventPromises = validCalendarIds.map(async (calendarId) => {
        try {
          const resp = await CalendarApi.listEvents({
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
  }, [visibleCalendarIds, dateRange.start, dateRange.end, calendars, provider])

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

  const checkMsCalendarAccess = useCallback(async () => {
    try {
      setCheckingMsStatus(true)
      const status = await checkMicrosoftCalendarStatus()
      setMsCalendarStatus(status)
    } catch {
      setMsCalendarStatus({ connected: false, hasCalendarScope: false, needsReconnect: false })
    } finally {
      setCheckingMsStatus(false)
    }
  }, [])

  const requestCalendarAccess = useCallback(async () => {
    try {
      await ApiService.Scopes.requestFeatureAccess(['calendar'])
    } catch { /* empty */ }
  }, [])

  const handleMicrosoftConnect = useCallback(async () => {
    try {
      const backendUrl = CONFIG.url
      const callbackUrl = `${backendUrl}/authentication/outlook/oauth_callback/`
      const response = await ApiService.post('/authentication/outlook/initiate_oauth/', {
        callback_url: callbackUrl
      }) as { auth_url?: string }
      if (response?.auth_url) {
        window.location.href = response.auth_url
      }
    } catch (err) {
      console.error('Failed to initiate Microsoft OAuth:', err)
    }
  }, [])

  const fetchCalendars = useCallback(async () => {
    setCalendarsLoading(true)
    try {
      const cals = provider === 'microsoft' 
        ? await loadMicrosoftCalendars()
        : await loadCalendars()
      setCalendars(cals)
      initializeVisibleCalendarIds(cals.map(calendar => calendar.id))
    } catch {
      setCalendars([])
    } finally {
      setCalendarsLoading(false)
    }
  }, [provider])

  const handleProviderChange = useCallback((newProvider: string) => {
    const p = newProvider as CalendarProvider
    setProvider(p)
    setSelectedProvider(p)
    // Reset calendars and events when switching providers
    setCalendars([])
    setEvents([])
    setVisibleCalendarIds([])
  }, [])

  useEffect(() => {
    if (provider === 'google') {
      checkCalendarAccess()
    } else {
      checkMsCalendarAccess()
    }
  }, [provider, checkCalendarAccess, checkMsCalendarAccess])

  useEffect(() => {
    const isAvailable = provider === 'google' 
      ? calendarAvailable 
      : (msCalendarStatus?.connected && msCalendarStatus?.hasCalendarScope)
    
    if (isAvailable) {
      fetchCalendars()
    }
  }, [provider, calendarAvailable, msCalendarStatus, fetchCalendars])

  useEffect(() => {
    const unsubscribe = subscribeToVisibilityChanges((ids) => {
      setVisibleCalendarIds(ids)
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    const unsubscribe = subscribeToProviderChanges((p) => {
      setProvider(p)
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    const isAvailable = provider === 'google'
      ? calendarAvailable
      : (msCalendarStatus?.connected && msCalendarStatus?.hasCalendarScope)
    
    if (isAvailable) {
      loadMergedEvents()
    }
  }, [visibleCalendarIds, provider, calendarAvailable, msCalendarStatus, loadMergedEvents])

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

  // Determine availability and loading states based on provider
  const isGoogleProvider = provider === 'google'
  const isCheckingAccess = isGoogleProvider ? checkingAccess : checkingMsStatus
  const isAvailable = isGoogleProvider 
    ? calendarAvailable 
    : (msCalendarStatus?.connected && msCalendarStatus?.hasCalendarScope)
  const needsReconnect = !isGoogleProvider && msCalendarStatus?.needsReconnect

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-col bg-card">
        <div className="flex items-center justify-between px-4 py-2 border-b min-w-0 gap-3">
          <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden @container">
            {/* Provider Selector */}
            <Select value={provider} onValueChange={handleProviderChange}>
              <SelectTrigger size="xs" className="min-w-0 w-auto">
                <SelectValue>
                  <div className="flex items-center gap-2 min-w-0">
                    {isGoogleProvider ? (
                      <GoogleCalendarIcon className="h-3.5 w-3.5 flex-shrink-0" />
                    ) : (
                      <OutlookIcon size={14} className="h-3.5 w-3.5 flex-shrink-0" />
                    )}
                    <Typography variant="xs" className="font-medium truncate hidden @[280px]:inline">
                      {isGoogleProvider ? 'Google' : 'Microsoft'}
                    </Typography>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Calendar Provider</SelectLabel>
                  <SelectItem value="google">
                    <div className="flex items-center gap-2">
                      <GoogleCalendarIcon className="h-3.5 w-3.5" />
                      <Typography variant="xs" className="font-medium">Google</Typography>
                    </div>
                  </SelectItem>
                  <SelectItem value="microsoft">
                    <div className="flex items-center gap-2">
                      <OutlookIcon size={14} className="h-3.5 w-3.5" />
                      <Typography variant="xs" className="font-medium">Microsoft</Typography>
                    </div>
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>

            {/* Calendar Navigation - only show when available */}
            {isAvailable && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="xs"
                    title="Calendars"
                    className="flex-shrink-0 hover:bg-accent hover:text-accent-foreground"
                  >
                    <Calendar className="h-3.5 w-3.5 @[280px]:mr-1 text-muted-foreground" strokeWidth={1.5} />
                    {totalCount > 0 && (
                      <Typography variant="xs" className="font-medium hidden @[280px]:inline">
                        {visibleCount}/{totalCount}
                      </Typography>
                    )}
                    <ChevronDown className="h-3 w-3 text-muted-foreground" strokeWidth={1.5} />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-2" align="start">
                  <div className="mb-2 pb-2 border-b">
                    <Typography variant="xs" className="font-medium">Show calendars</Typography>
                  </div>
                  {calendarsLoading ? (
                    <div className="flex items-center justify-center py-2">
                      <RefreshCw className="h-3 w-3 animate-spin mr-2 text-muted-foreground" strokeWidth={1} />
                      <Typography variant="xs" className="text-muted-foreground">Loading...</Typography>
                    </div>
                  ) : calendars.length === 0 ? (
                    <div className="px-2 py-1 text-xs text-muted-foreground">No calendars found</div>
                  ) : (
                    <div className="space-y-1">
                      {calendars.map((cal) => {
                        const isVisible = visibleCalendarIds.includes(cal.id)
                        return (
                          <label
                            key={cal.id}
                            className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer"
                          >
                            <Checkbox
                              checked={isVisible}
                              onCheckedChange={() => handleCalendarToggle(cal.id)}
                            />
                            <div 
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: cal.backgroundColor || '#3b82f6' }}
                            />
                            <Typography variant="xs" className="truncate flex-1">{getCalendarDisplayName(cal)}</Typography>
                            {cal.primary && <Typography variant="xs" className="text-muted-foreground ml-auto">(Primary)</Typography>}
                          </label>
                        )
                      })}
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
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
              <SquareArrowOutUpRight className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
            </Button>
            <Button
              variant="ghost"
              size="xs"
              onClick={() => loadMergedEvents()}
              disabled={loading || !isAvailable}
              title="Refresh"
            >
              <RefreshCw className={`${loading ? 'animate-spin' : ''}`} strokeWidth={1} />
            </Button>
            {isAvailable && (
              <Button
                variant="secondary"
                size="xs"
                onClick={handleCreateEvent}
                title="Create Event"
              >
                <Plus className="h-4 w-4 text-accent-foreground" strokeWidth={1} />
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {isCheckingAccess ? (
          <div className="flex items-center justify-center h-full">
            <RefreshCw className="h-4 w-4 animate-spin mr-2 text-muted-foreground" strokeWidth={1} />
            <Typography variant="muted">
              Checking {isGoogleProvider ? 'Google' : 'Microsoft'} Calendar access...
            </Typography>
          </div>
        ) : !isAvailable ? (
          <div className="flex flex-col items-center justify-center h-full p-4">
            {isGoogleProvider ? (
              <>
                <Calendar className="h-12 w-12 mb-4 opacity-50 text-muted-foreground" strokeWidth={1} />
                <Typography variant="h3" className="mb-2">Google Calendar Access Required</Typography>
                <Typography variant="small" className="text-center mb-4 max-w-md text-muted-foreground">
                  To use calendar features, you need to grant Calendar access to your Google account.
                </Typography>
                <Button onClick={requestCalendarAccess} variant="default">
                  <Settings className="h-4 w-4 mr-2" strokeWidth={1} />
                  Activate Calendar Access
                </Button>
              </>
            ) : (
              <>
                <OutlookIcon size={48} className="mb-4 opacity-50" />
                <Typography variant="h3" className="mb-2">
                  {needsReconnect ? 'Calendar Permissions Required' : 'Microsoft Calendar Not Connected'}
                </Typography>
                <Typography variant="small" className="text-center mb-4 max-w-md text-muted-foreground">
                  {needsReconnect 
                    ? 'Your Microsoft account is connected but needs additional calendar permissions. Please reconnect to grant access.'
                    : 'Connect your Microsoft account to view and manage your Outlook calendar events.'
                  }
                </Typography>
                <Button onClick={handleMicrosoftConnect} variant="default">
                  <OutlookIcon size={16} className="mr-2" />
                  {needsReconnect ? 'Reconnect Microsoft Account' : 'Connect Microsoft Account'}
                </Button>
              </>
            )}
          </div>
        ) : (
          <div className="h-full flex flex-col">
            {error && (
              <div className="p-4 bg-destructive/10 border border-destructive/30 rounded m-2">
                <Typography variant="small" className="text-destructive">{error}</Typography>
              </div>
            )}
            {!calendarsLoading && isAvailable && calendars.length > 0 && visibleCount === 0 ? (
              <div className="flex flex-col items-center justify-center flex-1 p-4">
                <Calendar className="h-12 w-12 mb-4 opacity-50 text-muted-foreground" strokeWidth={1} />
                <Typography variant="small" className="mb-2 text-muted-foreground">No calendars selected</Typography>
                <Typography variant="xs" className="text-muted-foreground text-center">Select calendars from the dropdown above to view events</Typography>
              </div>
            ) : (loading || calendarsLoading || (isAvailable && calendars.length > 0 && events.length === 0 && !error && visibleCount > 0)) ? (
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
                        className="group bg-card p-3 border-b border-border cursor-pointer hover:bg-accent/50 transition-colors"
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
        provider={provider}
      />
    </div>
  )
}

export default CalendarTab
