/**
 * Page Time Tracker
 * Tracks the amount of time users spend on each page
 */

interface PageTimeData {
  path: string
  pageTitle?: string
  contentType?: string
  startTime: number
  endTime?: number
  duration?: number
}

class PageTimeTracker {
  private currentPage: PageTimeData | null = null
  private readonly minDuration = 1000 // Minimum 1 second to record
  private readonly maxDuration = 3600000 // Maximum 1 hour per session
  private visibilityChangeHandler: (() => void) | null = null
  private beforeUnloadHandler: (() => void) | null = null
  private pausedTime: number = 0
  private pauseStartTime: number = 0

  /**
   * Start tracking time on a page
   */
  startPage(path: string, pageTitle?: string, contentType?: string): void {
    // End previous page if exists
    if (this.currentPage) {
      this.endPage()
    }

    // Start tracking new page
    this.currentPage = {
      path,
      pageTitle,
      contentType,
      startTime: Date.now()
    }

    // Set up visibility change handler to pause/resume tracking
    if (typeof document !== 'undefined') {
      this.visibilityChangeHandler = () => {
        if (document.hidden) {
          // Page is hidden, pause tracking
          if (this.currentPage && !this.currentPage.endTime) {
            this.pauseStartTime = Date.now()
          }
        } else {
          // Page is visible again, resume tracking
          if (this.currentPage && !this.currentPage.endTime && this.pauseStartTime > 0) {
            // Add paused duration to pausedTime
            this.pausedTime += Date.now() - this.pauseStartTime
            this.pauseStartTime = 0
          }
        }
      }
      document.addEventListener('visibilitychange', this.visibilityChangeHandler)

      // Set up beforeunload handler to track when user leaves
      this.beforeUnloadHandler = () => {
        this.endPage(true)
      }
      window.addEventListener('beforeunload', this.beforeUnloadHandler)
    }
  }

  /**
   * End tracking time on current page
   */
  endPage(sendImmediately: boolean = false): void {
    if (!this.currentPage) return

    // If page was paused, add the current pause duration
    if (this.pauseStartTime > 0) {
      this.pausedTime += Date.now() - this.pauseStartTime
      this.pauseStartTime = 0
    }

    const endTime = Date.now()
    const duration = endTime - this.currentPage.startTime - this.pausedTime

    // Only record if duration meets minimum threshold
    if (duration >= this.minDuration && duration <= this.maxDuration) {
      const pageTimeData = {
        ...this.currentPage,
        endTime,
        duration
      }

      // Send to backend
      if (sendImmediately) {
        // Synchronous send for beforeunload
        this.sendPageTimeSync(pageTimeData)
      } else {
        // Async send for normal navigation
        this.sendPageTime(pageTimeData)
      }
    }

    // Clean up
    this.currentPage = null
    this.pausedTime = 0
    this.pauseStartTime = 0
    if (this.visibilityChangeHandler && typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.visibilityChangeHandler)
      this.visibilityChangeHandler = null
    }
    if (this.beforeUnloadHandler && typeof window !== 'undefined') {
      window.removeEventListener('beforeunload', this.beforeUnloadHandler)
      this.beforeUnloadHandler = null
    }
  }

  /**
   * Send page time data to backend (async)
   */
  private async sendPageTime(data: PageTimeData): Promise<void> {
    try {
      const { ApiService } = await import('../../backend/api/apiService')
      await ApiService.trackPageTime({
        path: data.path,
        pageTitle: data.pageTitle,
        contentType: data.contentType,
        duration: data.duration!,
        startTime: new Date(data.startTime).toISOString(),
        endTime: new Date(data.endTime!).toISOString()
      })
    } catch (error) {
      // Silently fail - tracking shouldn't affect user experience
    }
  }

  /**
   * Send page time data synchronously (for beforeunload)
   */
  private sendPageTimeSync(data: PageTimeData): void {
    try {
      // Use navigator.sendBeacon for reliable delivery on page unload
      if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
        const { ApiService } = require('../../backend/api/apiService')
        const url = `${ApiService.baseURL}/analytics/track_page_time/`
        const username = typeof window !== 'undefined' ? localStorage.getItem('username') : null

        const payload = JSON.stringify({
          path: data.path,
          page_title: data.pageTitle,
          content_type: data.contentType,
          duration: data.duration,
          start_time: new Date(data.startTime).toISOString(),
          end_time: new Date(data.endTime!).toISOString(),
          username: username
        })

        const blob = new Blob([payload], { type: 'application/json' })
        navigator.sendBeacon(url, blob)
      }
    } catch (error) {
      // Silently fail
    }
  }

  /**
   * Get current page tracking data
   */
  getCurrentPage(): PageTimeData | null {
    return this.currentPage
  }
}

// Singleton instance
let trackerInstance: PageTimeTracker | null = null

export function getPageTimeTracker(): PageTimeTracker {
  if (!trackerInstance) {
    trackerInstance = new PageTimeTracker()
  }
  return trackerInstance
}
