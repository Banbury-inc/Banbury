import axios from 'axios'
import { CONFIG } from '../config/config'

export interface GoogleFeature {
  name: string
  description: string
  scopes: string[]
  required: boolean
}

export interface UserScopes {
  scopes: string[]
  available_features: {
    profile: boolean
    drive: boolean
    gmail: boolean
    calendar: boolean
  }
  message: string
}

export interface AvailableFeatures {
  features: {
    profile: GoogleFeature
    drive: GoogleFeature
    gmail: GoogleFeature
    calendar: GoogleFeature
  }
  message: string
}

export class ScopeService {
  private static baseURL = CONFIG.url

  private static withAuthHeaders() {
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  /**
   * Get the current scopes for the authenticated user
   */
  static async getUserScopes(): Promise<UserScopes> {
    const resp = await axios.get<UserScopes>(
      `${this.baseURL}/authentication/scopes/user/`,
      { headers: this.withAuthHeaders() }
    )
    return resp.data
  }

  /**
   * Get information about available Google features and their required scopes
   */
  static async getAvailableFeatures(): Promise<AvailableFeatures> {
    const resp = await axios.get<AvailableFeatures>(
      `${this.baseURL}/authentication/scopes/features/`,
      { headers: this.withAuthHeaders() }
    )
    return resp.data
  }

  /**
   * Request additional scopes for specific features
   */
  static async requestAdditionalScopes(features: string[]): Promise<{
    authUrl: string
    requested_features: string[]
    new_scopes: string[]
    message: string
  }> {
    const redirectUri = typeof window !== 'undefined' 
      ? `${window.location.origin}/authentication/auth/callback`
      : 'http://localhost:3000/authentication/auth/callback'

    const resp = await axios.post(
      `${this.baseURL}/authentication/scopes/request/?redirect_uri=${encodeURIComponent(redirectUri)}`,
      { features },
      { headers: { 'Content-Type': 'application/json', ...this.withAuthHeaders() } }
    )
    return resp.data
  }

  /**
   * Check if a specific feature is available for the user
   */
  static async isFeatureAvailable(feature: string): Promise<boolean> {
    try {
      const userScopes = await this.getUserScopes()
      return userScopes.available_features[feature as keyof typeof userScopes.available_features] || false
    } catch (error) {
      console.error(`Error checking feature availability for ${feature}:`, error)
      return false
    }
  }

  /**
   * Get missing features that the user doesn't have access to
   */
  static async getMissingFeatures(): Promise<string[]> {
    try {
      const [userScopes, availableFeatures] = await Promise.all([
        this.getUserScopes(),
        this.getAvailableFeatures()
      ])

      const missingFeatures: string[] = []
      
      Object.entries(availableFeatures.features).forEach(([featureKey, feature]) => {
        if (!feature.required && !userScopes.available_features[featureKey as keyof typeof userScopes.available_features]) {
          missingFeatures.push(featureKey)
        }
      })

      return missingFeatures
    } catch (error) {
      console.error('Error getting missing features:', error)
      return []
    }
  }

  /**
   * Redirect user to Google OAuth for additional scopes
   */
  static async requestFeatureAccess(features: string[]): Promise<void> {
    try {
      const result = await this.requestAdditionalScopes(features)
      
      if (result.authUrl) {
        // Store the requested features in session storage for callback handling
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('requestedFeatures', JSON.stringify(features))
        }
        
        // Redirect to Google OAuth
        window.location.href = result.authUrl
      } else {
        throw new Error('No authorization URL received')
      }
    } catch (error) {
      console.error('Error requesting feature access:', error)
      throw error
    }
  }

  /**
   * Get features that were requested during the current session
   */
  static getRequestedFeatures(): string[] {
    if (typeof window === 'undefined') return []
    
    try {
      const requested = sessionStorage.getItem('requestedFeatures')
      return requested ? JSON.parse(requested) : []
    } catch (error) {
      console.error('Error getting requested features:', error)
      return []
    }
  }

  /**
   * Clear requested features from session storage
   */
  static clearRequestedFeatures(): void {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('requestedFeatures')
    }
  }
}
