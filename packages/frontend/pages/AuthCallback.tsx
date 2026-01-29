import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';

import { ApiService } from '../../backend/api/apiService';

const AuthCallback = (): JSX.Element => {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'electron-redirect'>('loading');
  const [error, setError] = useState('');
  const handledRef = useRef(false);
  const electronRedirectAttemptedRef = useRef(false);

  useEffect(() => {
    if (!router.isReady) return;

    // Read from router.query first, but also check URL directly as fallback
    // (Next.js router.query can be unreliable on initial render, especially for query params)
    let code: string | undefined;
    let token: string | undefined;
    let scope: string | undefined;
    let urlError: string | undefined;
    let electron: string | undefined;
    let email: string | undefined;
    let username: string | undefined;
    let firstName: string | undefined;
    let lastName: string | undefined;
    let picture: string | undefined;
    
    // Always check URL directly for more reliable parameter reading
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      code = urlParams.get('code') || router.query.code as string | undefined;
      token = urlParams.get('token') || router.query.token as string | undefined;
      scope = urlParams.get('scope') || router.query.scope as string | undefined;
      urlError = urlParams.get('error') || router.query.error as string | undefined;
      electron = urlParams.get('electron') || router.query.electron as string | undefined;
      email = urlParams.get('email') || router.query.email as string | undefined;
      username = urlParams.get('username') || router.query.username as string | undefined;
      firstName = urlParams.get('first_name') || router.query.first_name as string | undefined;
      lastName = urlParams.get('last_name') || router.query.last_name as string | undefined;
      picture = urlParams.get('picture') || router.query.picture as string | undefined;
    } else {
      code = router.query.code as string | undefined;
      token = router.query.token as string | undefined;
      scope = router.query.scope as string | undefined;
      urlError = router.query.error as string | undefined;
      electron = router.query.electron as string | undefined;
      email = router.query.email as string | undefined;
      username = router.query.username as string | undefined;
      firstName = router.query.first_name as string | undefined;
      lastName = router.query.last_name as string | undefined;
      picture = router.query.picture as string | undefined;
    }

    // Guard: prevent double-calls in React Strict Mode or route re-mounts
    if (handledRef.current) return;
    
    // Detect Electron callbacks: Google OAuth strips the electron=true parameter.
    // Electron uses either localhost (development) or www.banbury.io (production) as redirect URI.
    // We detect Electron callbacks by checking:
    // 1. Explicit electron=true parameter in URL, OR
    // 2. We're in a browser (not Electron) - window.desktopApp?.isDesktop is false/undefined
    // 3. The callback URL is from a known Electron redirect origin (localhost or www.banbury.io), OR
    //    sessionStorage indicates this OAuth flow was initiated from Electron (oauth_is_desktop=true)
    // 4. We're at the callback path (for origin-based detection)
    // 5. We have OAuth response parameters (code or error)
    const isInElectron = typeof window !== 'undefined' && !!window.desktopApp?.isDesktop
    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : ''
    const isLocalhost = currentOrigin.startsWith('http://localhost:') || currentOrigin.startsWith('http://127.0.0.1:')
    const isElectronRedirectOrigin = currentOrigin === 'https://www.banbury.io' || isLocalhost
    const isAtCallbackPath = typeof window !== 'undefined' && window.location.pathname === '/authentication/auth/callback'
    const oauthIsDesktop = typeof window !== 'undefined' && window.sessionStorage 
      ? window.sessionStorage.getItem('oauth_is_desktop') === 'true'
      : false
    const hasOAuthResponse = !!(code || urlError)
    
    // Electron callback if: explicit electron parameter OR (not in Electron AND (origin-based detection OR sessionStorage-based detection) AND has OAuth response)
    // const isElectronCallback = electron === 'true' || (
    //   !isInElectron && 
    //   hasOAuthResponse && 
    //   ((isElectronRedirectOrigin && isAtCallbackPath) || oauthIsDesktop)
    // )

    const isElectronCallback = isInElectron
    
    // If this is an Electron callback, handle it specially
    // Note: electron=true means this callback is FOR Electron (in browser),
    // not that we're currently IN Electron
    // Check for token first (from backend google_callback_electron), then code/error

function isElectronApp(): boolean {
  return typeof window !== 'undefined' && !!window.desktopApp?.isDesktop
}
    if (isElectronApp()) {
      // If token is present (from backend electron callback), save it and user info, then redirect to workspaces
      if (token) {
        handledRef.current = true;
        setStatus('success');
        // Save token using ApiService
        const tokenUsername = username || email || 'User';
        ApiService.setAuthToken(token, tokenUsername);
        
        // Store user info in localStorage (matching the format used in handleOAuthCallback)
          if (email) {
            localStorage.setItem('userEmail', email);
          }
          // Note: username is already stored by setAuthToken above, but store again for consistency
          if (username) {
            localStorage.setItem('username', username);
          }
          if (firstName) {
            localStorage.setItem('userFirstName', firstName);
          }
          if (lastName) {
            localStorage.setItem('userLastName', lastName);
          }
          if (picture) {
            try {
              // Try to parse as JSON (if it's a base64 object), otherwise treat as URL string
              const pictureData = JSON.parse(picture);
              if (pictureData && pictureData.data) {
                const pictureUrl = `data:${pictureData.content_type || 'image/jpeg'};base64,${pictureData.data}`;
                localStorage.setItem('userPicture', pictureUrl);
              }
            } catch {
              // If parsing fails, treat as URL string
              localStorage.setItem('userPicture', picture);
            }
          }
        // Redirect to workspaces
        router.replace('/workspaces');
        return;
      }
      
      // Wait for code/error to be present before proceeding (fallback for old flow)
      if (!code && !urlError) {
        // Still mark as handled to prevent processing as normal callback
        handledRef.current = true;
        return;
      }
      if (!electronRedirectAttemptedRef.current) {
        handledRef.current = true;
        electronRedirectAttemptedRef.current = true;
        
        // Clean up sessionStorage after detecting Electron callback
        if (typeof window !== 'undefined' && window.sessionStorage) {
          sessionStorage.removeItem('oauth_is_desktop');
          sessionStorage.removeItem('oauth_redirect_uri');
        }
        
        // Handle error case for Electron
        if (urlError) {
          setStatus('error');
          setError(`Authentication failed: ${urlError}`);
          
          // For Electron, we still want to redirect to the app with the error
          const params = new URLSearchParams();
          params.set('error', urlError);
          // Include redirect URI for consistency
          const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
          const redirectUri = `${currentOrigin}/authentication/auth/callback`;
          params.set('redirect_uri', redirectUri);
          const banburyUrl = `banbury://auth/callback?${params.toString()}`;
          
          setTimeout(() => {
            window.location.href = banburyUrl;
            setTimeout(() => router.push('/login'), 3000);
          }, 1000);
          return;
        }
        
        // Success case: redirect to banbury:// with code
        if (code) {
          setStatus('electron-redirect');
          
          // Automatically attempt redirect after a short delay
          const params = new URLSearchParams();
          params.set('code', code);
          if (scope) {
            params.set('scope', scope);
          }
          // Include the redirect URI so Electron can use it when processing the callback
          // Get it from the current URL origin (where Google redirected to)
          const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
          const redirectUri = `${currentOrigin}/authentication/auth/callback`;
          params.set('redirect_uri', redirectUri);
          const banburyUrl = `banbury://auth/callback?${params.toString()}`;
          
          // Try automatic redirect after 1 second
          setTimeout(() => {
            window.location.href = banburyUrl;
          }, 1000);
        } else {
          // No code and no error - this shouldn't happen but handle it
          setStatus('error');
          setError('No authorization code received from Google');
          setTimeout(() => router.push('/login'), 3000);
        }
      }
      // Always return here - never process OAuth callback for Electron redirects
      return;
    }

    // Also guard by code value in sessionStorage (avoid reusing same code)
    const lastCode = typeof window !== 'undefined' ? sessionStorage.getItem('lastOAuthCode') : null;
    if (code && lastCode === code) return;

    // Don't process if electron=true was present (should have been handled above)
    // This is a safety check in case electron parameter wasn't detected initially
    if (!electron && typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const electronCheck = urlParams.get('electron');
      if (electronCheck === 'true') {
        // Electron parameter found but wasn't processed - don't continue
        return;
      }
    }

    handledRef.current = true;

    const handleCallback = async () => {
      // Clean up sessionStorage if we're processing a regular web callback
      if (typeof window !== 'undefined' && window.sessionStorage) {
        sessionStorage.removeItem('oauth_is_desktop');
        sessionStorage.removeItem('oauth_redirect_uri');
      }

      if (urlError) {
        setStatus('error');
        setError(`Authentication failed: ${urlError}`);
        setTimeout(() => router.push('/login'), 3000);
        return;
      }

      if (!code) {
        setStatus('error');
        setError('No authorization code received from Google');
        setTimeout(() => router.push('/login'), 3000);
        return;
      }

      try {
        // Persist code to avoid reuse
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('lastOAuthCode', code);
        }

        const result = await ApiService.handleOAuthCallback(code, scope);

        if (result.success) {
          // Check if this was a scope activation callback
          const requestedFeatures = ApiService.Scopes.getRequestedFeatures();
          
          if (requestedFeatures.length > 0) {
            setStatus('success');
            ApiService.Scopes.clearRequestedFeatures();
            setTimeout(() => {
              router.replace('/workspaces?scopeActivated=true');
            }, 2000);
          } else {
            setStatus('success');
            router.replace('/workspaces');
          }
        } else {
          setStatus('error');
          setError('OAuth callback succeeded but result was not successful');
          router.replace('/login');
        }
      } catch (err) {
        // Clean up sessionStorage on error
        if (typeof window !== 'undefined' && window.sessionStorage) {
          sessionStorage.removeItem('oauth_is_desktop');
          sessionStorage.removeItem('oauth_redirect_uri');
        }
        
        setStatus('error');
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        // eslint-disable-next-line no-console
        console.error('[AuthCallback] OAuth callback error:', err);
        setError(`OAuth callback failed: ${errorMessage}`);
        router.replace('/login');
      }
    };

    handleCallback();
  }, [router.isReady, router.query.code, router.query.token, router.query.scope, router.query.error, router.query.electron, router]);

  const handleOpenBanbury = () => {
    const code = router.query.code as string | undefined;
    const scope = router.query.scope as string | undefined;
    
    if (!code) return;
    
    const params = new URLSearchParams();
    params.set('code', code);
    if (scope) {
      params.set('scope', scope);
    }
    // Include redirect URI
    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
    const redirectUri = `${currentOrigin}/authentication/auth/callback`;
    params.set('redirect_uri', redirectUri);
    const banburyUrl = `banbury://auth/callback?${params.toString()}`;
    window.location.href = banburyUrl;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <div className="text-center max-w-sm">
        {status === 'loading' && (
          <>
            <div className="w-10 h-10 border-2 border-zinc-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <h2 className="text-white text-lg mb-1">Completing Authentication</h2>
            <p className="text-zinc-400 text-sm">Please wait while we finish setting up your account...</p>
          </>
        )}

        {status === 'electron-redirect' && (
          <>
            <div className="text-green-500 text-5xl mb-2">✓</div>
            <h2 className="text-white text-lg mb-3">Authentication Successful!</h2>
            <p className="text-zinc-400 text-sm mb-6">
              Redirecting to the Banbury app...
              <br />
              <span className="text-zinc-500 text-xs mt-2 block">Click below if you haven't been redirected</span>
            </p>
            <button
              onClick={handleOpenBanbury}
              className="px-6 py-3 bg-background border border-zinc-700 text-white rounded-lg hover:bg-zinc-800 transition-colors font-medium"
            >
              Open Banbury
            </button>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="text-green-500 text-5xl mb-2">✓</div>
            <h2 className="text-green-500 text-lg mb-1">Authentication Successful!</h2>
            <p className="text-zinc-400 text-sm">
              {ApiService.Scopes.getRequestedFeatures().length > 0 
                ? 'Additional features activated successfully! Redirecting to dashboard...'
                : 'Redirecting to your dashboard...'
              }
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="text-red-400 text-sm mb-2">{error}</div>
            <p className="text-zinc-400 text-sm">Redirecting to login page...</p>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;
