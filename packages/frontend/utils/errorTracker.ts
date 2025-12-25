import { ApiService } from '../../backend/api/apiService'
import axios from 'axios'

interface ErrorEvent {
  user_id?: string
  username?: string
  error_type: string
  error_message: string
  endpoint?: string
  stack_trace?: string
}

class ErrorTracker {
  private initialized: boolean = false

  initialize() {
    if (this.initialized || typeof window === 'undefined') {
      return
    }

    // Track unhandled errors
    window.addEventListener('error', (event) => {
      this.trackError({
        error_type: 'javascript_error',
        error_message: event.message || 'Unknown error',
        stack_trace: event.error?.stack || event.filename || undefined
      })
    })

    // Track unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError({
        error_type: 'unhandled_promise_rejection',
        error_message: event.reason?.message || String(event.reason) || 'Unhandled promise rejection',
        stack_trace: event.reason?.stack || undefined
      })
    })

    // Setup axios interceptor for API errors
    this.setupAxiosInterceptor()

    this.initialized = true
  }

  private setupAxiosInterceptor() {
    axios.interceptors.response.use(
      (response) => response,
      (error) => {
        // Track API errors
        if (error.response) {
          const status = error.response.status
          const endpoint = error.config?.url || 'unknown'
          
          this.trackError({
            error_type: status >= 500 ? 'server_error' : 'client_error',
            error_message: error.response.data?.error || error.response.data?.message || error.message || 'API Error',
            endpoint: endpoint,
            stack_trace: error.stack
          })
        } else if (error.request) {
          // Network error
          this.trackError({
            error_type: 'network_error',
            error_message: 'Network request failed',
            endpoint: error.config?.url || 'unknown'
          })
        }

        return Promise.reject(error)
      }
    )
  }

  trackError(data: {
    error_type: string
    error_message: string
    endpoint?: string
    stack_trace?: string
  }) {
    if (typeof window === 'undefined') return

    const username = this.getUsername()
    const userId = this.getUserId()

    const event: ErrorEvent = {
      user_id: userId,
      username: username,
      error_type: data.error_type,
      error_message: data.error_message,
      endpoint: data.endpoint,
      stack_trace: data.stack_trace
    }

    // Send to backend asynchronously
    this.sendError(event)
  }

  private async sendError(event: ErrorEvent) {
    try {
      await ApiService.post('/analytics/track_error/', event)
    } catch (error) {
      // Silently fail to avoid infinite loops
      console.error('Failed to track error:', error)
    }
  }

  private getUsername(): string | undefined {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem('username') || undefined
    }
    return undefined
  }

  private getUserId(): string | undefined {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem('userId') || undefined
    }
    return undefined
  }
}

// Singleton instance
let trackerInstance: ErrorTracker | null = null

export function getErrorTracker(): ErrorTracker {
  if (!trackerInstance) {
    trackerInstance = new ErrorTracker()
  }
  return trackerInstance
}

export default getErrorTracker

