import { ApiService } from '../../../backend/api/apiService'
import { AUTH_CONFIG } from '../../../backend/authConfig'

interface GoogleLoginResult {
  success: boolean
  error?: string
}

/**
 * Checks if the app is running in Electron desktop shell
 */
export function isElectronApp(): boolean {
  return typeof window !== 'undefined' && !!window.desktopApp?.isDesktop
}

/**
 * Opens a URL in the system's default browser when running in Electron.
 * Falls back to window.location.href for web browser.
 */
async function openUrlForOAuth(url: string): Promise<void> {
  if (isElectronApp() && window.desktopApp?.openExternal) {
    const result = await window.desktopApp.openExternal(url)
    if (!result.success) {
      throw new Error(result.error || 'Failed to open system browser')
    }
  } else {
    window.location.href = url
  }
}

/**
 * Resolves where to send the user after a successful login.
 * Only allows internal paths (e.g. deep links like the email unsubscribe link)
 * to prevent open-redirect abuse.
 */
export function getPostLoginRedirect(returnUrl: unknown): string {
  if (typeof returnUrl !== 'string') return '/workspaces'
  if (!returnUrl.startsWith('/') || returnUrl.startsWith('//')) return '/workspaces'
  return returnUrl
}

/**
 * Handles Google OAuth login flow.
 * Opens OAuth URL in system browser when running in Electron to avoid
 * "This browser doesn't support JavaScript" error from Google.
 */
export async function handleGoogleLogin(): Promise<GoogleLoginResult> {
  // Check if current domain is allowed for OAuth
  if (!AUTH_CONFIG.isAllowedDomain()) {
    return { success: false, error: AUTH_CONFIG.getRedirectUriError() }
  }

  const redirectUri = AUTH_CONFIG.getRedirectUri()
  const isDesktop = isElectronApp()
  
  // Store the redirect URI in sessionStorage so we can use it later when processing the callback
  // This ensures we use the exact same redirect URI that was registered with Google
  if (typeof window !== 'undefined' && window.sessionStorage) {
    sessionStorage.setItem('oauth_redirect_uri', redirectUri)
    sessionStorage.setItem('oauth_is_desktop', String(isDesktop))
  }
  
  // Use the same OAuth client as the web app by not passing isDesktop parameter
  // The redirect URI already indicates it's for Electron (contains ?electron=true)
  const result = await ApiService.initiateGoogleAuth(redirectUri)
  
  if (!result.success || !result.authUrl) {
    return { success: false, error: 'Failed to get Google auth URL' }
  }

  await openUrlForOAuth(result.authUrl)
  return { success: true }
}
