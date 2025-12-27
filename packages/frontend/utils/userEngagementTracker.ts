import { ApiService } from '../../backend/api/apiService'

interface SessionData {
  user_id?: string
  username?: string
  session_start: string
  session_end?: string
  active_time_seconds: number
  feature_interactions: string[]
}

class UserEngagementTracker {
  private sessionStartTime: Date | null = null
  private activeTime: number = 0
  private lastActiveTime: Date | null = null
  private isActive: boolean = false
  private featureInteractions: Set<string> = new Set()
  private heartbeatInterval: NodeJS.Timeout | null = null
  private readonly HEARTBEAT_INTERVAL = 60000 // 60 seconds
  private readonly INACTIVITY_THRESHOLD = 300000 // 5 minutes

  constructor() {
    this.initializeEventListeners()
  }

  private initializeEventListeners() {
    if (typeof window === 'undefined') return

    // Track user activity
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    activityEvents.forEach(event => {
      window.addEventListener(event, () => this.markActive(), { passive: true })
    })

    // Track visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.markInactive()
      } else {
        this.markActive()
      }
    })

    // Track window focus
    window.addEventListener('focus', () => this.markActive())
    window.addEventListener('blur', () => this.markInactive())
  }

  startSession(userId?: string, username?: string) {
    if (this.sessionStartTime) {
      // Session already started
      return
    }

    this.sessionStartTime = new Date()
    this.lastActiveTime = new Date()
    this.isActive = true
    this.activeTime = 0
    this.featureInteractions.clear()

    // Start heartbeat
    this.startHeartbeat(userId, username)
  }

  endSession(userId?: string, username?: string) {
    if (!this.sessionStartTime) {
      return
    }

    this.stopHeartbeat()
    
    const sessionEnd = new Date()
    const sessionData: SessionData = {
      user_id: userId,
      username: username || this.getUsername(),
      session_start: this.sessionStartTime.toISOString(),
      session_end: sessionEnd.toISOString(),
      active_time_seconds: this.activeTime,
      feature_interactions: Array.from(this.featureInteractions)
    }

    // Send session data to backend
    this.sendSessionData(sessionData)

    // Reset session state
    this.sessionStartTime = null
    this.lastActiveTime = null
    this.isActive = false
    this.activeTime = 0
    this.featureInteractions.clear()
  }

  trackFeatureInteraction(featureName: string) {
    this.featureInteractions.add(featureName)
  }

  private markActive() {
    const now = new Date()
    
    if (this.lastActiveTime && this.isActive) {
      // Add time since last active
      const timeDiff = (now.getTime() - this.lastActiveTime.getTime()) / 1000
      this.activeTime += timeDiff
    }
    
    this.lastActiveTime = now
    this.isActive = true
  }

  private markInactive() {
    if (this.lastActiveTime && this.isActive) {
      const now = new Date()
      const timeDiff = (now.getTime() - this.lastActiveTime.getTime()) / 1000
      this.activeTime += timeDiff
    }
    
    this.isActive = false
  }

  private startHeartbeat(userId?: string, username?: string) {
    if (this.heartbeatInterval) {
      return
    }

    this.heartbeatInterval = setInterval(() => {
      if (this.sessionStartTime && this.isActive) {
        this.markActive()
        
        // Check for inactivity
        if (this.lastActiveTime) {
          const timeSinceLastActive = Date.now() - this.lastActiveTime.getTime()
          if (timeSinceLastActive > this.INACTIVITY_THRESHOLD) {
            this.markInactive()
          }
        }
      }
    }, this.HEARTBEAT_INTERVAL)
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  private async sendSessionData(sessionData: SessionData) {
    try {
      await ApiService.post('/analytics/track_user_engagement/', sessionData)
    } catch (error) {
      console.error('Failed to send user engagement data:', error)
    }
  }

  private getUsername(): string | undefined {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem('username') || undefined
    }
    return undefined
  }

  getActiveTime(): number {
    if (this.lastActiveTime && this.isActive) {
      const now = new Date()
      const additionalTime = (now.getTime() - this.lastActiveTime.getTime()) / 1000
      return this.activeTime + additionalTime
    }
    return this.activeTime
  }
}

// Singleton instance
let trackerInstance: UserEngagementTracker | null = null

export function getUserEngagementTracker(): UserEngagementTracker {
  if (!trackerInstance) {
    trackerInstance = new UserEngagementTracker()
  }
  return trackerInstance
}

export default getUserEngagementTracker


