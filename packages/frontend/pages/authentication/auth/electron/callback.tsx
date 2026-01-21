import { useRouter } from 'next/router'
import { useEffect, useRef, useState } from 'react'
import { ApiService } from '../../../../../backend/api/apiService'
import { AUTH_CONFIG } from '../../../../../backend/authConfig'
import { CONFIG } from '../../../../config/config'

const AuthCallbackElectron = (): JSX.Element => {
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'electron-redirect'>('loading')
  const [error, setError] = useState('')
  const handledRef = useRef(false)
  const electronRedirectAttemptedRef = useRef(false)

  useEffect(() => {
    if (!router.isReady) return

    // Read OAuth parameters from URL
    let code: string | undefined
    let scope: string | undefined
    let urlError: string | undefined
    
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      code = urlParams.get('code') || router.query.code as string | undefined
      scope = urlParams.get('scope') || router.query.scope as string | undefined
      urlError = urlParams.get('error') || router.query.error as string | undefined
    } else {
      code = router.query.code as string | undefined
      scope = router.query.scope as string | undefined
      urlError = router.query.error as string | undefined
    }

    // Guard: prevent double-calls in React Strict Mode or route re-mounts
    if (handledRef.current) return
    
    // Wait for code/error to be present before proceeding
    if (!code && !urlError) {
      handledRef.current = true
      return
    }

    if (!electronRedirectAttemptedRef.current) {
      handledRef.current = true
      electronRedirectAttemptedRef.current = true
      
      // Clean up sessionStorage after detecting Electron callback
      if (typeof window !== 'undefined' && window.sessionStorage) {
        sessionStorage.removeItem('oauth_is_desktop')
        sessionStorage.removeItem('oauth_redirect_uri')
      }
      
      // Handle error case for Electron
      if (urlError) {
        setStatus('error')
        setError(`Authentication failed: ${urlError}`)
        
        // For Electron, we still want to redirect to the app with the error
        const params = new URLSearchParams()
        params.set('error', urlError)
        // Include redirect URI for consistency
        const currentOrigin = typeof window !== 'undefined' ? window.location.origin : ''
        const redirectUri = `${currentOrigin}/authentication/auth/electron/callback`
        params.set('redirect_uri', redirectUri)
        const banburyUrl = `banbury://auth/callback?${params.toString()}`
        
        setTimeout(() => {
          if (typeof window !== 'undefined') {
            window.location.href = banburyUrl
            setTimeout(() => router.push('/login'), 3000)
          }
        }, 1000)
        return
      }
      
      // Success case: exchange code for token via backend, then redirect to banbury:// with token
      if (code) {
        setStatus('loading')
        
        // Call backend endpoint to exchange code for token
        const exchangeCodeForToken = async () => {
          try {
            // Since we're on the electron callback route, always use the electron redirect URI
            // Construct it from the current origin to match what was used during OAuth initiation
            const currentOrigin = typeof window !== 'undefined' ? window.location.origin : ''
            const redirectUri = currentOrigin 
              ? `${currentOrigin}/authentication/auth/electron/callback`
              : 'https://www.banbury.io/authentication/auth/electron/callback'
            
            console.log('[AuthCallbackElectron] Using redirect URI:', redirectUri)
            
            // Call the backend electron callback endpoint directly
            const params = new URLSearchParams()
            params.set('code', code!)
            if (redirectUri) {
              params.set('redirect_uri', redirectUri)
            }
            if (scope) {
              params.set('scope', scope)
            }
            
            // Get backend URL from config
            // Ensure no trailing slash to avoid double slashes
            const backendUrl = CONFIG.url.replace(/\/$/, '')
            const apiUrl = `${backendUrl}/authentication/auth/electron/callback/?${params.toString()}`
            
            // Log for debugging
            console.log('[AuthCallbackElectron] Calling backend API:', apiUrl)
            console.log('[AuthCallbackElectron] Backend URL from CONFIG:', backendUrl)
            
            // Call backend with Accept: application/json to get JSON response
            const response = await fetch(apiUrl, {
              headers: {
                'Accept': 'application/json'
              }
            })
            
            console.log('[AuthCallbackElectron] Response status:', response.status, response.statusText)
            console.log('[AuthCallbackElectron] Response URL:', response.url)
            
            if (!response.ok) {
              // Try to get error details
              let errorMessage = `HTTP ${response.status} ${response.statusText}`
              try {
                const errorData = await response.json()
                errorMessage = errorData.error || errorMessage
                console.error('[AuthCallbackElectron] Error response:', errorData)
              } catch (e) {
                const text = await response.text().catch(() => '')
                console.error('[AuthCallbackElectron] Error response (text):', text)
                errorMessage = text || errorMessage
              }
              throw new Error(errorMessage)
            }
            
            // Backend should return JSON when Accept: application/json is sent
            const data = await response.json()
            if (data.success && data.token) {
              // Backend returned JSON with token - redirect to banbury:// with token
              setStatus('electron-redirect')
              const banburyParams = new URLSearchParams()
              banburyParams.set('token', data.token)
              const banburyUrl = `banbury://auth/callback?${banburyParams.toString()}`
              
              setTimeout(() => {
                if (typeof window !== 'undefined') {
                  window.location.href = banburyUrl
                }
              }, 1000)
            } else {
              throw new Error(data.error || 'Token exchange failed')
            }
          } catch (err) {
            setStatus('error')
            const errorMessage = err instanceof Error ? err.message : 'Unknown error'
            setError(`Authentication failed: ${errorMessage}`)
            setTimeout(() => router.push('/login'), 3000)
          }
        }
        
        exchangeCodeForToken()
      } else {
        // No code and no error - this shouldn't happen but handle it
        setStatus('error')
        setError('No authorization code received from Google')
        setTimeout(() => router.push('/login'), 3000)
      }
    }
  }, [router.isReady, router.query.code, router.query.scope, router.query.error, router])

  const handleOpenBanbury = () => {
    const code = router.query.code as string | undefined
    const scope = router.query.scope as string | undefined
    
    if (!code) return
    
    const params = new URLSearchParams()
    params.set('code', code)
    if (scope) {
      params.set('scope', scope)
    }
    // Include redirect URI
    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : ''
    const redirectUri = `${currentOrigin}/authentication/auth/electron/callback`
    params.set('redirect_uri', redirectUri)
    const banburyUrl = `banbury://auth/callback?${params.toString()}`
    if (typeof window !== 'undefined') {
      window.location.href = banburyUrl
    }
  }

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

        {status === 'error' && (
          <>
            <div className="text-red-400 text-sm mb-2">{error}</div>
            <p className="text-zinc-400 text-sm">Redirecting to login page...</p>
          </>
        )}
      </div>
    </div>
  )
}

export default AuthCallbackElectron
