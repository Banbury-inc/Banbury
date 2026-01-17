import { ApiService } from '../../backend/api/apiService'

interface JourneyEvent {
  event_type: 'page_view' | 'navigation' | 'button_click' | 'file_open' | 'tab_open'
  event_name: string
  from_page?: string
  to_page?: string
  metadata?: Record<string, any>
  timestamp?: string
}

class UserJourneyTracker {
  private sessionId: string
  private userId: string | null = null
  private username: string | null = null
  private eventQueue: JourneyEvent[] = []
  private batchSize = 10
  private flushInterval = 5000 // 5 seconds
  private flushTimer: NodeJS.Timeout | null = null
  private currentPage: string | null = null

  constructor() {
    // Generate or retrieve session ID
    this.sessionId = this.getOrCreateSessionId()
    
    // Get user info from localStorage
    if (typeof window !== 'undefined') {
      this.username = localStorage.getItem('username') || localStorage.getItem('authUsername') || null
      this.userId = localStorage.getItem('userId') || null
    }
    
    // Start periodic flush
    this.startFlushTimer()
    
    // Flush on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.flush()
      })
    }
  }

  private getOrCreateSessionId(): string {
    if (typeof window === 'undefined') return ''
    
    let sessionId = sessionStorage.getItem('journey_session_id')
    if (!sessionId) {
      sessionId = `journey_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      sessionStorage.setItem('journey_session_id', sessionId)
    }
    return sessionId
  }

  private startFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
    }
    
    this.flushTimer = setInterval(() => {
      this.flush()
    }, this.flushInterval)
  }

  private async flush(): Promise<void> {
    if (this.eventQueue.length === 0) return

    const eventsToSend = [...this.eventQueue]
    this.eventQueue = []

    // Send events in batches
    for (let i = 0; i < eventsToSend.length; i += this.batchSize) {
      const batch = eventsToSend.slice(i, i + this.batchSize)
      
      for (const event of batch) {
        try {
          await ApiService.trackUserJourneyEvent({
            user_id: this.userId || undefined,
            username: this.username || undefined,
            session_id: this.sessionId,
            event_type: event.event_type,
            event_name: event.event_name,
            from_page: event.from_page,
            to_page: event.to_page,
            metadata: event.metadata || {},
            timestamp: event.timestamp || new Date().toISOString()
          })
        } catch (error) {
          // Silently fail - don't interrupt user experience
          console.error('Failed to track journey event:', error)
        }
      }
    }
  }

  private queueEvent(event: JourneyEvent): void {
    this.eventQueue.push(event)
    
    // Flush if queue is full
    if (this.eventQueue.length >= this.batchSize) {
      this.flush()
    }
  }

  trackEvent(
    eventType: JourneyEvent['event_type'],
    eventName: string,
    fromPage?: string,
    toPage?: string,
    metadata?: Record<string, any>
  ): void {
    this.queueEvent({
      event_type: eventType,
      event_name: eventName,
      from_page: fromPage || this.currentPage || undefined,
      to_page: toPage,
      metadata: metadata,
      timestamp: new Date().toISOString()
    })
  }

  trackPageView(page: string, metadata?: Record<string, any>): void {
    const previousPage = this.currentPage
    this.currentPage = page
    
    this.queueEvent({
      event_type: 'page_view',
      event_name: `View ${page}`,
      from_page: previousPage || undefined,
      to_page: page,
      metadata: metadata,
      timestamp: new Date().toISOString()
    })
  }

  trackNavigation(fromPage: string, toPage: string, metadata?: Record<string, any>): void {
    this.currentPage = toPage
    
    this.queueEvent({
      event_type: 'navigation',
      event_name: `Navigate: ${fromPage} → ${toPage}`,
      from_page: fromPage,
      to_page: toPage,
      metadata: metadata,
      timestamp: new Date().toISOString()
    })
  }

  trackButtonClick(buttonId: string, buttonLabel: string, currentPage?: string, metadata?: Record<string, any>): void {
    this.queueEvent({
      event_type: 'button_click',
      event_name: buttonLabel || buttonId,
      from_page: currentPage || this.currentPage || undefined,
      metadata: {
        button_id: buttonId,
        button_label: buttonLabel,
        ...metadata
      },
      timestamp: new Date().toISOString()
    })
  }

  trackFileOpen(fileId: string, fileName: string, currentPage?: string, metadata?: Record<string, any>): void {
    this.queueEvent({
      event_type: 'file_open',
      event_name: `Open File: ${fileName}`,
      from_page: currentPage || this.currentPage || undefined,
      metadata: {
        file_id: fileId,
        file_name: fileName,
        ...metadata
      },
      timestamp: new Date().toISOString()
    })
  }

  trackTabOpen(tabType: string, tabName: string, currentPage?: string, metadata?: Record<string, any>): void {
    this.queueEvent({
      event_type: 'tab_open',
      event_name: `Open ${tabType}: ${tabName}`,
      from_page: currentPage || this.currentPage || undefined,
      metadata: {
        tab_type: tabType,
        tab_name: tabName,
        ...metadata
      },
      timestamp: new Date().toISOString()
    })
  }

  updateUserInfo(userId?: string, username?: string): void {
    if (userId) this.userId = userId
    if (username) this.username = username
  }

  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
      this.flushTimer = null
    }
    this.flush()
  }
}

let trackerInstance: UserJourneyTracker | null = null

export function getUserJourneyTracker(): UserJourneyTracker {
  if (!trackerInstance) {
    trackerInstance = new UserJourneyTracker()
  }
  return trackerInstance
}

export default getUserJourneyTracker
