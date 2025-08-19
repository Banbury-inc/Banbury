import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';

import { ApiService } from '../services/apiService';
import { ScopeService } from '../services/scopeService';

const AuthCallback = (): JSX.Element => {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState('');
  const handledRef = useRef(false);

  useEffect(() => {
    if (!router.isReady) return;

    const code = router.query.code as string | undefined;
    const scope = router.query.scope as string | undefined;
    const urlError = router.query.error as string | undefined;

    // Guard: prevent double-calls in React Strict Mode or route re-mounts
    if (handledRef.current) return;
    if (!code && !urlError) return; // wait until params are present

    // Also guard by code value in sessionStorage (avoid reusing same code)
    const lastCode = typeof window !== 'undefined' ? sessionStorage.getItem('lastOAuthCode') : null;
    if (code && lastCode === code) return;

    handledRef.current = true;

    const handleCallback = async () => {
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
          const requestedFeatures = ScopeService.getRequestedFeatures();
          
          if (requestedFeatures.length > 0) {
            setStatus('success');
            ScopeService.clearRequestedFeatures();
            setTimeout(() => {
              router.replace('/dashboard?scopeActivated=true');
            }, 2000);
          } else {
            setStatus('success');
            router.replace('/dashboard');
          }
        } else {
          setStatus('error');
          setError('OAuth callback succeeded but result was not successful');
          router.replace('/login');
        }
      } catch (err) {
        setStatus('error');
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(`OAuth callback failed: ${errorMessage}`);
        router.replace('/login');
      }
    };

    handleCallback();
  }, [router.isReady, router.query.code, router.query.error]);

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

        {status === 'success' && (
          <>
            <div className="text-green-500 text-5xl mb-2">✓</div>
            <h2 className="text-green-500 text-lg mb-1">Authentication Successful!</h2>
            <p className="text-zinc-400 text-sm">
              {ScopeService.getRequestedFeatures().length > 0 
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