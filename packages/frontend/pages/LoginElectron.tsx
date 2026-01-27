import {
  CircularProgress
} from '@mui/material';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/old-input';
import { Label } from '../components/ui/label';
import { CONFIG } from '../config/config';
import { ApiService } from '../../backend/api/apiService';
import { handleGoogleLogin as handleGoogleLoginAction, isElectronApp } from './handlers/login';
import { WindowControls } from '../components/WorkspacesTopBar/WindowControls';

const LoginElectron = (): JSX.Element => {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  // Check API connectivity on component mount
  useEffect(() => {
    const checkApiHealth = async () => {
      try {
        // Run comprehensive API diagnostics
        const apiInfo = await ApiService.Debug.getApiInfo();
        
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await ApiService.login(formData.username, formData.password);
      
      if (result.success) {
        // Redirect to workspaces
        router.push('/workspaces');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };


  const handleGoogleLogin = async () => {
    try {
      const result = await handleGoogleLoginAction()
      
      if (!result.success && result.error) {
        setError(result.error)
        return
      }

      // When running in Electron, the OAuth URL opens in system browser
      // so we show a message to guide the user
      if (isElectronApp()) {
        setSuccess('Opening Google sign-in in your browser. Please complete the authentication there.')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
    }
  }

  const isDesktop = typeof window !== 'undefined' && window.desktopApp?.isDesktop === true

  return (
    <div className="min-h-screen flex flex-col bg-card">
      {/* Electron Top Bar */}
      {isDesktop && (
        <div 
          className="h-[35px] w-full bg-card border-b border-border flex items-center justify-end"
          style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
        >
          <div 
            className="flex items-center h-full"
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          >
            <WindowControls />
          </div>
        </div>
      )}
      
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-accent backdrop-blur-sm rounded-xl border border-border p-8 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Sign in to Banbury</h1>
            <p className="text-muted-foreground text-sm">Desktop App</p>
          </div>

          {apiStatus === 'offline' && (
            <div className="mb-6 p-4 bg-muted/50 border border-border rounded-lg">
              <p className="text-muted-foreground text-sm">
                ⚠️ API Server appears to be offline. Please check your connection or try again later.
              </p>
              <p className="text-muted-foreground/70 text-xs mt-1">
                Attempting to connect to: {CONFIG.url}
              </p>
            </div>
          )}
          
          {success && (
            <div className="mb-6 p-4 bg-accent/10 border border-accent/20 rounded-lg">
              <p className="text-accent-foreground text-sm">{success}</p>
            </div>
          )}
          
          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-destructive text-sm">{error}</p>
              {apiStatus === 'offline' && (
                <p className="text-destructive/70 text-xs mt-1">
                  Note: This may be due to server connectivity issues.
                </p>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-foreground text-sm font-medium">
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
                className="w-full bg-popover border-border text-foreground placeholder:text-muted-foreground focus:border-foreground focus:ring-foreground/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground text-sm font-medium">
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
                className="w-full bg-popover border-border text-foreground placeholder:text-muted-foreground focus:border-foreground focus:ring-foreground/20"
              />
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                onClick={() => router.push('/register')}
                className="flex-1 bg-popover hover:bg-muted border border-border text-foreground"
              >
                Sign up for free
              </Button>
              
              <Button
                type="submit"
                disabled={loading || apiStatus === 'offline'}
                className="flex-1 bg-primary hover:bg-primary/90 text-background"
              >
                {loading ? <CircularProgress size={16} className="text-background" /> : 'Sign in'}
              </Button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <div className="mt-6">
              <Button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full bg-popover text-foreground border border-border flex items-center justify-center gap-3"
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
            <p className="text-muted-foreground text-sm">
              Don&apos;t have an account?{' '}
              <Link
                href="/register"
                className="text-foreground hover:text-foreground/80 font-medium"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default LoginElectron;
