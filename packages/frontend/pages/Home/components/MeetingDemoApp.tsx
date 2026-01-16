import React, { useState, useEffect } from 'react'
import { CalendarTab } from '../../../components/LeftPanel/components/CalendarTab'
import { CalendarEventViewer } from '../../../components/MiddlePanel/CalendarViewer/CalendarEventViewer'
import { ApiService } from '../../../../backend/api/apiService'
import { CalendarEvent, CalendarListEntry } from '../../../../backend/api/calendar/calendar'
import { setVisibleCalendarIds, getVisibleCalendarIds } from '../../../components/LeftPanel/components/handlers/calendarVisibility'

// Mock Calendar Events
const mockCalendarEvents: CalendarEvent[] = [
  {
    id: 'event-1',
    calendarId: 'primary',
    status: 'confirmed',
    summary: 'Daily Team Standup',
    description: `Morning sync to review progress and blockers.

Agenda:
1. Yesterday's accomplishments
2. Today's priorities
3. Any blockers or dependencies

Please come prepared with a brief update on your current sprint tasks.`,
    location: 'Conference Room A',
    htmlLink: 'https://calendar.google.com/event/1',
    start: { dateTime: '2025-10-23T09:00:00-07:00', timeZone: 'America/Los_Angeles' },
    end: { dateTime: '2025-10-23T09:30:00-07:00', timeZone: 'America/Los_Angeles' },
    attendees: [
      { email: 'sarah@company.com', displayName: 'Sarah Chen', responseStatus: 'accepted' },
      { email: 'john@company.com', displayName: 'John Smith', responseStatus: 'accepted' },
      { email: 'emily@company.com', displayName: 'Emily Johnson', responseStatus: 'tentative' },
    ],
    organizer: { email: 'demo@example.com', displayName: 'Demo User' },
  },
  {
    id: 'event-2',
    calendarId: 'primary',
    status: 'confirmed',
    summary: 'Client Presentation - Q4 Roadmap',
    description: `Presenting the Q4 product roadmap to Acme Corp stakeholders.

Key Topics:
- New feature releases planned for Q4
- Integration timeline for their custom requirements
- Support and training schedule
- Pricing discussion for enterprise tier

Materials: Slide deck has been shared in the #client-acme channel.

Please join 5 minutes early to test screen sharing.`,
    location: 'Zoom Meeting',
    htmlLink: 'https://calendar.google.com/event/2',
    hangoutLink: 'https://zoom.us/j/123456789',
    start: { dateTime: '2025-10-23T14:00:00-07:00', timeZone: 'America/Los_Angeles' },
    end: { dateTime: '2025-10-23T15:30:00-07:00', timeZone: 'America/Los_Angeles' },
    attendees: [
      { email: 'client.lead@acme.com', displayName: 'Michael Brown', responseStatus: 'accepted' },
      { email: 'client.tech@acme.com', displayName: 'Lisa Wang', responseStatus: 'accepted' },
      { email: 'sales@company.com', displayName: 'David Miller', responseStatus: 'accepted' },
    ],
    organizer: { email: 'demo@example.com', displayName: 'Demo User' },
  },
  {
    id: 'event-3',
    calendarId: 'work-calendar',
    status: 'confirmed',
    summary: 'Strategy Review Meeting',
    description: `Quarterly strategy review with leadership team.

Discussion Points:
1. Q3 performance review and key learnings
2. Market analysis and competitive landscape
3. Q4 OKRs and priority initiatives
4. Budget allocation for new projects
5. Hiring plan for engineering team

Pre-read materials have been shared via email. Please review before the meeting.`,
    location: 'Executive Boardroom',
    htmlLink: 'https://calendar.google.com/event/3',
    start: { dateTime: '2025-10-24T10:00:00-07:00', timeZone: 'America/Los_Angeles' },
    end: { dateTime: '2025-10-24T12:00:00-07:00', timeZone: 'America/Los_Angeles' },
    attendees: [
      { email: 'ceo@company.com', displayName: 'Alex Thompson', responseStatus: 'accepted' },
      { email: 'cto@company.com', displayName: 'Rachel Kim', responseStatus: 'accepted' },
      { email: 'vp.product@company.com', displayName: 'James Wilson', responseStatus: 'accepted' },
    ],
    organizer: { email: 'ceo@company.com', displayName: 'Alex Thompson' },
  },
  {
    id: 'event-4',
    calendarId: 'primary',
    status: 'confirmed',
    summary: '1:1 with Manager',
    description: `Weekly check-in with direct manager.

Standing agenda:
- Career development progress
- Current project updates
- Feedback and recognition
- Any support needed
- Action items from last week

Feel free to add any topics you'd like to discuss.`,
    location: 'Manager Office (Room 204)',
    htmlLink: 'https://calendar.google.com/event/4',
    start: { dateTime: '2025-10-24T15:00:00-07:00', timeZone: 'America/Los_Angeles' },
    end: { dateTime: '2025-10-24T15:30:00-07:00', timeZone: 'America/Los_Angeles' },
    attendees: [
      { email: 'manager@company.com', displayName: 'Patricia Lee', responseStatus: 'accepted' },
    ],
    organizer: { email: 'manager@company.com', displayName: 'Patricia Lee' },
  },
  {
    id: 'event-5',
    calendarId: 'work-calendar',
    status: 'confirmed',
    summary: 'Product Demo - New Features',
    description: `Live demo of the latest product features for the sales team.

Features to demo:
- AI-powered automation workflows
- New calendar integration
- Enhanced reporting dashboard
- Mobile app improvements

This will help the sales team understand new capabilities for customer conversations.

Recording will be available after the session.`,
    location: 'Google Meet',
    htmlLink: 'https://calendar.google.com/event/5',
    hangoutLink: 'https://meet.google.com/abc-defg-hij',
    start: { dateTime: '2025-10-25T11:00:00-07:00', timeZone: 'America/Los_Angeles' },
    end: { dateTime: '2025-10-25T12:00:00-07:00', timeZone: 'America/Los_Angeles' },
    attendees: [
      { email: 'sales.team@company.com', displayName: 'Sales Team', responseStatus: 'accepted' },
      { email: 'product@company.com', displayName: 'Product Team', responseStatus: 'accepted' },
    ],
    organizer: { email: 'demo@example.com', displayName: 'Demo User' },
  },
]

// Mock Calendars
const mockCalendars: CalendarListEntry[] = [
  {
    id: 'primary',
    summary: 'Primary Calendar',
    description: 'Your main calendar',
    backgroundColor: '#3b82f6',
    foregroundColor: '#ffffff',
    primary: true,
    accessRole: 'owner',
    timeZone: 'America/Los_Angeles',
  },
  {
    id: 'work-calendar',
    summary: 'Work Calendar',
    description: 'Work events and meetings',
    backgroundColor: '#8b5cf6',
    foregroundColor: '#ffffff',
    primary: false,
    accessRole: 'owner',
    timeZone: 'America/Los_Angeles',
  },
]

// Store original service methods
let originalIsFeatureAvailable: typeof ApiService.Scopes.isFeatureAvailable | null = null
let originalListEvents: typeof ApiService.Calendar.listEvents | null = null
let originalListCalendars: typeof ApiService.Calendar.listCalendars | null = null
let originalGetEvent: typeof ApiService.Calendar.getEvent | null = null
let originalVisibleCalendarIds: string[] | null = null

// Setup mocks
function setupMeetingDemoMocks() {
  // Save originals only if not already saved
  if (originalIsFeatureAvailable === null) {
    originalIsFeatureAvailable = ApiService.Scopes.isFeatureAvailable
  }
  if (originalListEvents === null) {
    originalListEvents = ApiService.Calendar.listEvents
  }
  if (originalListCalendars === null) {
    originalListCalendars = ApiService.Calendar.listCalendars
  }
  if (originalGetEvent === null) {
    originalGetEvent = ApiService.Calendar.getEvent
  }
  if (originalVisibleCalendarIds === null) {
    originalVisibleCalendarIds = getVisibleCalendarIds()
  }

  // Set visible calendar IDs for the mock calendars
  setVisibleCalendarIds(['primary', 'work-calendar'])

  // Mock ScopeService - make calendar available
  ApiService.Scopes.isFeatureAvailable = async (feature: string) => {
    return feature === 'calendar'
  }

  // Mock list events
  ApiService.Calendar.listEvents = async (params?: { calendarId?: string }) => {
    const calendarId = params?.calendarId || 'primary'
    const filtered = mockCalendarEvents.filter(
      (ev) => ev.calendarId === calendarId || calendarId === 'primary'
    )
    return {
      items: filtered,
      nextPageToken: undefined,
    }
  }

  // Mock list calendars
  ApiService.Calendar.listCalendars = async () => {
    return {
      items: mockCalendars,
      nextPageToken: undefined,
    }
  }

  // Mock get single event
  ApiService.Calendar.getEvent = async (eventId: string) => {
    return mockCalendarEvents.find((ev) => ev.id === eventId) || mockCalendarEvents[0]
  }
}

// Cleanup mocks
function cleanupMeetingDemoMocks() {
  if (originalIsFeatureAvailable !== null) {
    ApiService.Scopes.isFeatureAvailable = originalIsFeatureAvailable
  }
  if (originalListEvents !== null) {
    ApiService.Calendar.listEvents = originalListEvents
  }
  if (originalListCalendars !== null) {
    ApiService.Calendar.listCalendars = originalListCalendars
  }
  if (originalGetEvent !== null) {
    ApiService.Calendar.getEvent = originalGetEvent
  }
  if (originalVisibleCalendarIds !== null) {
    setVisibleCalendarIds(originalVisibleCalendarIds)
  }
}

// Track if mocks are currently active (module level to survive remounts)
let mocksActive = false

export default function MeetingDemoApp() {
  // Pre-select the first event (Client Presentation) to show the viewer by default
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(mockCalendarEvents[1])
  const [, forceUpdate] = useState({})

  // Setup mocks on mount
  useEffect(() => {
    if (!mocksActive) {
      setupMeetingDemoMocks()
      mocksActive = true
      forceUpdate({}) // Trigger re-render now that mocks are ready
    }

    return () => {
      cleanupMeetingDemoMocks()
      mocksActive = false
    }
  }, [])

  const handleEventSelect = (event: CalendarEvent) => {
    setSelectedEvent(event)
  }

  const handleBack = () => {
    setSelectedEvent(null)
  }

  // Don't render CalendarTab until mocks are ready
  if (!mocksActive) {
    return (
      <div className="w-full h-[400px] sm:h-[450px] md:h-[500px] flex overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-2xl bg-white dark:bg-zinc-900">
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-zinc-500">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-[400px] sm:h-[450px] md:h-[500px] flex overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-2xl bg-white dark:bg-zinc-900">
      {/* Calendar List Panel - using actual CalendarTab */}
      <div className="w-[40%] h-full border-r border-zinc-200 dark:border-zinc-700 overflow-hidden">
        <CalendarTab
          onEventSelect={handleEventSelect}
          onOpenCalendarApp={() => {}}
        />
      </div>

      {/* Event Preview Panel - using actual CalendarEventViewer */}
      <div className="flex-1 h-full overflow-hidden">
        {selectedEvent ? (
          <CalendarEventViewer
            event={selectedEvent}
            onBack={handleBack}
          />
        ) : (
          <div className="h-full flex items-center justify-center bg-zinc-50 dark:bg-zinc-800/30">
            <div className="text-center text-zinc-500 dark:text-zinc-400">
              <p className="text-sm">Select an event to view</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
