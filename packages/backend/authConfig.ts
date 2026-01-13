/**
 * Authentication configuration for different environments
 * This helps manage the redirect URI issues seen in the backend
 */

// Custom protocol redirect for Electron desktop app
const ELECTRON_REDIRECT_URI = 'banbury://auth/callback'

/**
 * Checks if the app is running in the Electron desktop shell
 */
function isElectronApp(): boolean {
  return typeof window !== 'undefined' && !!(window as any).desktopApp?.isDesktop
}

export const AUTH_CONFIG = {
  // Get the current environment redirect URI
  getRedirectUri(): string {
    // Use custom protocol for Electron desktop app
    if (isElectronApp()) {
      return ELECTRON_REDIRECT_URI
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

    return redirectUriMap[origin] || `${origin}/authentication/auth/callback`;
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