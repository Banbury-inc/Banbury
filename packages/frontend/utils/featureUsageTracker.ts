import { ApiService } from '../../backend/api/apiService'

interface FeatureUsageEvent {
  user_id?: string
  username?: string
  feature: string
  context?: Record<string, any>
}

class FeatureUsageTracker {
  private trackFeatureUsage(feature: string, context?: Record<string, any>) {
    if (typeof window === 'undefined') return

    const username = this.getUsername()
    const userId = this.getUserId()

    const event: FeatureUsageEvent = {
      user_id: userId,
      username: username,
      feature: feature,
      context: context || {}
    }

    // Send to backend asynchronously
    this.sendFeatureUsage(event)
  }

  private async sendFeatureUsage(event: FeatureUsageEvent) {
    try {
      await ApiService.post('/analytics/track_feature_usage/', event)
    } catch (error) {
      console.error('Failed to track feature usage:', error)
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

  // Public methods for tracking specific features
  trackFilesAccess(context?: { workspace_id?: string; folder_path?: string }) {
    this.trackFeatureUsage('files', context)
  }

  trackEmailsAccess(context?: { workspace_id?: string }) {
    this.trackFeatureUsage('emails', context)
  }

  trackCalendarAccess(context?: { workspace_id?: string }) {
    this.trackFeatureUsage('calendar', context)
  }

  trackMeetingsAccess(context?: { workspace_id?: string; meeting_id?: string }) {
    this.trackFeatureUsage('meetings', context)
  }

  trackConversationsAccess(context?: { workspace_id?: string; conversation_id?: string }) {
    this.trackFeatureUsage('conversations', context)
  }

  trackKnowledgeAccess(context?: { workspace_id?: string }) {
    this.trackFeatureUsage('knowledge', context)
  }

  trackDriveAccess(context?: { workspace_id?: string }) {
    this.trackFeatureUsage('drive', context)
  }

  trackWebSearchAccess(context?: { workspace_id?: string; query?: string }) {
    this.trackFeatureUsage('web_search', context)
  }

  trackBrowserbaseAccess(context?: { workspace_id?: string; session_id?: string }) {
    this.trackFeatureUsage('browserbase', context)
  }

  trackCustomFeature(featureName: string, context?: Record<string, any>) {
    this.trackFeatureUsage(featureName, context)
  }
}

// Singleton instance
let trackerInstance: FeatureUsageTracker | null = null

export function getFeatureUsageTracker(): FeatureUsageTracker {
  if (!trackerInstance) {
    trackerInstance = new FeatureUsageTracker()
  }
  return trackerInstance
}

export default getFeatureUsageTracker


