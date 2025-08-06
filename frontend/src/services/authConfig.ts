/**
 * Authentication configuration for different environments
 * This helps manage the redirect URI issues seen in the backend
 */

export const AUTH_CONFIG = {
  // Get the current environment redirect URI
  getRedirectUri(): string {
    const origin = window.location.origin;
    
    // Map of known domains to their correct redirect URIs
    const redirectUriMap: Record<string, string> = {
      'http://localhost:3000': 'http://localhost:3000/auth/callback',
      'http://localhost:3001': 'http://localhost:3001/auth/callback',
      'http://localhost:3002': 'http://localhost:3002/auth/callback',
      'https://banbury.io': 'https://banbury.io/auth/callback',
      'https://www.banbury.io': 'https://www.banbury.io/auth/callback',
      'https://dev.banbury.io': 'https://dev.banbury.io/auth/callback',
      'https://www.dev.banbury.io': 'https://www.dev.banbury.io/auth/callback',
    };

    return redirectUriMap[origin] || `${origin}/auth/callback`;
  },

  // Check if current domain is allowed for OAuth
  isAllowedDomain(): boolean {
    const origin = window.location.origin;
    const allowedDomains = [
      'http://localhost:3000',
      'http://localhost:3001', 
      'http://localhost:3002',
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