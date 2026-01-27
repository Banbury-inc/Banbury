export interface GoogleIntegrationFlags {
  hasGmail: boolean
  hasDrive: boolean
  hasCalendar: boolean
  scopeCount: number
  scopes: string[]
}

export interface UserScopeData {
  user_id: string
  username: string
  email: string
  scopes: string[]
  scope_count: number
}

export interface GoogleScopesAnalyticsData {
  users_with_scopes: UserScopeData[]
}

// Map of user identifiers to their integration flags
export type UserIntegrationsMap = Map<string, GoogleIntegrationFlags>

/**
 * Determines which Google services are enabled based on OAuth scopes
 */
export function getGoogleIntegrationFlagsFromScopes(scopes: string[]): GoogleIntegrationFlags {
  const hasGmail = scopes.some(scope => 
    scope.includes('gmail.modify') || 
    scope.includes('gmail.settings') ||
    scope.includes('gmail.readonly') ||
    scope.includes('gmail.send')
  )
  
  const hasDrive = scopes.some(scope => 
    scope.includes('/auth/drive') || 
    scope.includes('drive.file') ||
    scope.includes('drive.readonly')
  )
  
  const hasCalendar = scopes.some(scope => 
    scope.includes('/auth/calendar') ||
    scope.includes('calendar.readonly') ||
    scope.includes('calendar.events')
  )
  
  return {
    hasGmail,
    hasDrive,
    hasCalendar,
    scopeCount: scopes.length,
    scopes
  }
}

/**
 * Builds a lookup map from scopes analytics data, keyed by user_id, email, and username
 * for flexible matching
 */
export function buildUserGoogleIntegrationsMap(
  analytics: GoogleScopesAnalyticsData | null
): UserIntegrationsMap {
  const map = new Map<string, GoogleIntegrationFlags>()
  
  if (!analytics?.users_with_scopes) return map
  
  for (const user of analytics.users_with_scopes) {
    const flags = getGoogleIntegrationFlagsFromScopes(user.scopes)
    
    // Add entries for all possible keys to enable flexible lookup
    if (user.user_id) map.set(user.user_id, flags)
    if (user.email) map.set(user.email.toLowerCase(), flags)
    if (user.username) map.set(user.username.toLowerCase(), flags)
  }
  
  return map
}

/**
 * Gets the Google integration flags for a specific user, trying multiple identifiers
 */
export function getGoogleIntegrationsForUser(
  map: UserIntegrationsMap,
  userId?: string,
  email?: string,
  username?: string
): GoogleIntegrationFlags | null {
  // Try user_id first (most reliable)
  if (userId && map.has(userId)) return map.get(userId)!
  
  // Try email
  if (email && map.has(email.toLowerCase())) return map.get(email.toLowerCase())!
  
  // Try username
  if (username && map.has(username.toLowerCase())) return map.get(username.toLowerCase())!
  
  return null
}
