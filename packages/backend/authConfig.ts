/**
 * Authentication configuration for different environments
 * This helps manage the redirect URI issues seen in the backend
 */

// Custom protocol redirect for Electron desktop app (used after web callback)
const ELECTRON_PROTOCOL_URI = 'banbury://auth/callback'

/**
 * Checks if the app is running in the Electron desktop shell
 */
function isElectronApp(): boolean {
  return typeof window !== 'undefined' && !!(window as any).desktopApp?.isDesktop
}

/**
 * Gets the web-based redirect URI for Electron OAuth
 * Google OAuth only accepts http/https URLs, so we use a web callback
 * that then redirects to the custom protocol
 */
function getElectronRedirectUri(): string {
  // In development, try to use localhost if available (for local testing)
  // Google OAuth allows http://localhost for redirect URIs
  if (typeof window !== 'undefined' && window.location) {
    const origin = window.location.origin
    // Check if we're running on localhost (development)
    if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      return `${origin}/authentication/auth/callback?electron=true`
    }
  }
  
  // For production or when origin is not available, use the production HTTPS URL
  // which is registered in Google OAuth
  return 'https://www.banbury.io/authentication/auth/callback?electron=true'
}

export const AUTH_CONFIG = {
  // Get the current environment redirect URI
  getRedirectUri(): string {
    // Use web-based redirect URI for Electron desktop app with electron=true parameter
    // This allows Google OAuth to accept it, then the web callback redirects to banbury://
    if (isElectronApp()) {
      return getElectronRedirectUri()
    }
    
    const origin = window.location.origin;
    
    // Map of known domains to their correct redirect URIs
    const redirectUriMap: Record<string, string> = {
      'http://localhost:3000': 'http://localhost:3000/authentication/auth/callback',
      'http://localhost:3001': 'http://localhost:3001/authentication/auth/callback',
      'http://localhost:3002': 'http://localhost:3002/authentication/auth/callback',
      'http://localhost:8080': 'http://localhost:8080/authentication/auth/callback',
      'https://banbury.io': 'https://banbury.io/authentication/auth/callback',
      'https://www.banbury.io': 'https://www.banbury.io/authentication/auth/callback',
      'https://dev.banbury.io': 'https://dev.banbury.io/authentication/auth/callback',
      'https://www.dev.banbury.io': 'https://www.dev.banbury.io/authentication/auth/callback',
    };

    return redirectUriMap[origin] || `${origin}/authentication/auth/callback`
  },

  // Get the redirect URI without query parameters (used when processing callbacks)
  // Google OAuth strips query parameters from redirect URIs, so we need to match what Google actually used
  getRedirectUriForCallback(): string {
    if (isElectronApp()) {
      // Priority 1: Check URL query params (passed through banbury:// protocol from browser)
      // This is the most reliable as it comes from where Google actually redirected
      if (typeof window !== 'undefined' && window.location) {
        const urlParams = new URLSearchParams(window.location.search)
        const redirectUriFromUrl = urlParams.get('redirect_uri')
        if (redirectUriFromUrl) {
          // URLSearchParams.get() automatically decodes the value, so redirectUriFromUrl is already decoded
          // Remove query parameters to match what Google actually redirected to
          try {
            const url = new URL(redirectUriFromUrl)
            url.search = '' // Remove query parameters
            // Ensure no trailing slash (backend expects no trailing slash)
            let normalized = url.toString()
            if (normalized.endsWith('/') && normalized !== url.origin + '/') {
              normalized = normalized.slice(0, -1)
            }
            console.log('[AUTH_CONFIG] Using redirect_uri from URL query params:', normalized)
            return normalized
          } catch (e) {
            console.warn('[AUTH_CONFIG] Failed to parse redirect_uri from URL:', redirectUriFromUrl, e)
            // If URL parsing fails, fall through to other methods
          }
        } else {
          console.log('[AUTH_CONFIG] No redirect_uri in URL query params')
        }
      }
      
      // Priority 2: Check sessionStorage (set during OAuth initiation)
      // This should match what was used when initiating OAuth
      if (typeof window !== 'undefined' && window.sessionStorage) {
        const storedRedirectUri = sessionStorage.getItem('oauth_redirect_uri')
        if (storedRedirectUri) {
          // Remove query parameters to match what Google actually redirected to
          try {
            const url = new URL(storedRedirectUri)
            url.search = '' // Remove query parameters
            const normalized = url.toString()
            console.log('[AUTH_CONFIG] Using redirect_uri from sessionStorage:', normalized)
            return normalized
          } catch (e) {
            console.warn('[AUTH_CONFIG] Failed to parse redirect_uri from sessionStorage:', e)
            // If URL parsing fails, fall through to default
          }
        }
      }
      
      // Priority 3: Infer from current context (fallback)
      // This handles cases where sessionStorage might not be available or was cleared
      if (typeof window !== 'undefined' && window.location) {
        const origin = window.location.origin
        // If we're on localhost in Electron, the OAuth redirect was likely also localhost
        // (unless explicitly configured otherwise)
        if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
          const inferred = `${origin}/authentication/auth/callback`
          console.log('[AUTH_CONFIG] Using inferred redirect_uri from origin:', inferred)
          return inferred
        }
      }
      
      // Priority 4: Default to production redirect URI (without query params)
      // This is what Google actually redirected to when electron=true was in the original URI
      const defaultUri = 'https://www.banbury.io/authentication/auth/callback'
      console.log('[AUTH_CONFIG] Using default redirect_uri:', defaultUri)
      return defaultUri
    }
    
    // For web, use the same as getRedirectUri
    return this.getRedirectUri()
  },

  // Check if current domain is allowed for OAuth
  isAllowedDomain(): boolean {
    // Electron desktop app is always allowed
    if (isElectronApp()) {
      return true
    }
    
    const origin = window.location.origin;
    const allowedDomains = [
      'http://localhost:3000',
      'http://localhost:3001', 
      'http://localhost:3002',
      'http://localhost:8080',
      'https://banbury.io',
      'https://www.banbury.io',
      'https://dev.banbury.io',
      'https://www.dev.banbury.io',
    ];

    return allowedDomains.includes(origin);
  },

  // Get helpful error message for disallowed domains
  getRedirectUriError(): string {
    const origin = window.location.origin;
    return `The domain "${origin}" is not configured for Google OAuth. Please contact support to add this domain to the allowlist.`;
  }
};