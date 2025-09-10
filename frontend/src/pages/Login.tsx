import GoogleIcon from '@mui/icons-material/Google';
import {
  Box,
  Container,
  Typography,
  Alert,
  CircularProgress
} from '@mui/material';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';

import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { CONFIG } from '../config/config';
import { ApiService } from '../services/apiService';
import { AUTH_CONFIG } from '../services/authConfig';
import { DebugService } from '../services/debugService';

const Login = (): JSX.Element => {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [showRetryButton, setShowRetryButton] = useState(false);

  // Check API connectivity on component mount
  useEffect(() => {
    const checkApiHealth = async () => {
      try {
        // Run comprehensive API diagnostics
        const apiInfo = await DebugService.getApiInfo();
        
        if (apiInfo.connectivity.available) {
          setApiStatus('online');
        } else {
          setApiStatus('offline');
        }
      } catch {
        setApiStatus('offline');
      }
    };

    checkApiHealth();
  }, []);

  // Check for registration success message
  useEffect(() => {
    if (router.query.registered === 'true') {
      setSuccess('Account created successfully! Please sign in with your credentials.');
    }
  }, [router.query.registered]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent, retryCount = 0) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await ApiService.login(formData.username, formData.password);
      
      if (result.success) {
        // Redirect to dashboard
        router.push('/dashboard');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      
      // Check if this is a server error that might benefit from a retry
      const isServerError = errorMessage.includes('server') || 
                           errorMessage.includes('temporarily unavailable') ||
                           errorMessage.includes('technical difficulties');
      
      // Retry up to 2 times for server errors with exponential backoff
      if (isServerError && retryCount < 2) {
        const retryDelay = Math.pow(2, retryCount) * 1000; // 1s, 2s
        setError(`${errorMessage} Retrying in ${retryDelay / 1000} seconds...`);
        setShowRetryButton(false);
        
        setTimeout(() => {
          handleSubmit(e, retryCount + 1);
        }, retryDelay);
        
        return;
      }
      
      setError(errorMessage);
      setShowRetryButton(isServerError); // Show retry button for server errors
    } finally {
      setLoading(false);
    }
  };


  const handleGoogleLogin = async () => {
    try {
      // Check if current domain is allowed for OAuth
      if (!AUTH_CONFIG.isAllowedDomain()) {
        setError(AUTH_CONFIG.getRedirectUriError());
        return;
      }

      const redirectUri = AUTH_CONFIG.getRedirectUri();
      
      const result = await ApiService.initiateGoogleAuth(redirectUri);
      
      if (result.success && result.authUrl) {
        window.location.href = result.authUrl;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <div className="w-full max-w-md">
        <div className="bg-zinc-900/90 backdrop-blur-sm rounded-xl border border-zinc-700 p-8 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Sign in</h1>
          </div>

          {apiStatus === 'offline' && (
            <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <p className="text-amber-400 text-sm">
                ⚠️ API Server appears to be offline. Please check your connection or try again later.
              </p>
              <p className="text-amber-400/70 text-xs mt-1">
                Attempting to connect to: {CONFIG.url}
              </p>
            </div>
          )}
          
          {success && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p className="text-green-400 text-sm">{success}</p>
            </div>
          )}
          
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
              {apiStatus === 'offline' && (
                <p className="text-red-400/70 text-xs mt-1">
                  Note: This may be due to server connectivity issues.
                </p>
              )}
              {showRetryButton && (
                <button
                  onClick={(e) => handleSubmit(e, 0)}
                  disabled={loading}
                  className="mt-2 text-xs text-red-300 hover:text-red-200 underline disabled:opacity-50"
                >
                  Try again
                </button>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-white text-sm font-medium">
                Username
              </Label>
              <Input
                id="username"
                name="username"
                type="text"
                placeholder="Enter your username"
                value={formData.username}
                onChange={handleInputChange}
                required
                disabled={loading}
                className="w-full bg-zinc-800 border-zinc-600 text-white placeholder:text-zinc-400 focus:border-white focus:ring-white/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-white text-sm font-medium">
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleInputChange}
                required
                disabled={loading}
                className="w-full bg-zinc-800 border-zinc-600 text-white placeholder:text-zinc-400 focus:border-white focus:ring-white/20"
              />
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                onClick={() => router.push('/register')}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-white"
              >
                Sign up for free
              </Button>
              
              <Button
                type="submit"
                disabled={loading || apiStatus === 'offline'}
                className="flex-1 bg-white hover:bg-zinc-100 text-black"
              >
                {loading ? <CircularProgress size={16} className="text-black" /> : 'Sign in'}
              </Button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-600" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-zinc-900 px-2 text-zinc-400">Or continue with</span>
              </div>
            </div>

            <div className="mt-6">
              <Button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading || apiStatus === 'offline'}
                className="w-full bg-white hover:bg-zinc-100 text-black border border-zinc-300 flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign in with Google
              </Button>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-zinc-400 text-sm">
              Don&apos;t have an account?{' '}
              <Link
                href="/register"
                className="text-white hover:text-zinc-300 font-medium"
              >
                Sign up
              </Link>
            </p>
          </div>

          <div className="mt-4 text-center">
            <Link
              href="/"
              className="text-zinc-500 hover:text-zinc-400 text-sm"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;