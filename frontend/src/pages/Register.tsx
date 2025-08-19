import { Visibility, VisibilityOff } from '@mui/icons-material';
import { CircularProgress } from '@mui/material';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';

import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { CONFIG } from '../config/config';
import { ApiService } from '../services/apiService';
import { DebugService } from '../services/debugService';
import { AUTH_CONFIG } from '../services/authConfig';

interface FormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
}

interface FormErrors {
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
}

const Register = (): JSX.Element => {
  const router = useRouter();
  
  const [formData, setFormData] = useState<FormData>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phoneNumber: ''
  });
  
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  // Check API connectivity on component mount
  useEffect(() => {
    const checkApiHealth = async () => {
      try {
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

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    // Username validation
    if (!formData.username.trim()) {
      errors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      errors.username = 'Username can only contain letters, numbers, and underscores';
    }

    // Email validation
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Password validation - only check if it's provided
    if (!formData.password) {
      errors.password = 'Password is required';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    // First name validation
    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required';
    }

    // Last name validation
    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }

    // Phone number validation (optional but if provided, validate format)
    if (formData.phoneNumber.trim() && !/^[\+]?[1-9][\d]{0,15}$/.test(formData.phoneNumber.replace(/\s/g, ''))) {
      errors.phoneNumber = 'Please enter a valid phone number';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field when user starts typing
    if (formErrors[name as keyof FormErrors]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const userData = {
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        phone_number: formData.phoneNumber.trim() || '',
        picture: ''
      };

      const response = await ApiService.post<{ result: string; message?: string }>('/authentication/register/', userData);
      
      if (response.result === 'success') {
        // Registration successful, redirect to login
        router.push('/login?registered=true');
      } else if (response.result === 'user_already_exists') {
        setError('A user with this username or email already exists');
      } else {
        setError(response.message || 'Registration failed. Please try again.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
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
      const errorMessage = err instanceof Error ? err.message : 'Google signup failed. Please try again.';
      setError(errorMessage);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <div className="w-full max-w-md">
        <div className="bg-zinc-900/90 backdrop-blur-sm rounded-xl border border-zinc-700 p-8 shadow-2xl">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
            <p className="text-zinc-400">Join Banbury and start managing your files</p>
          </div>

          {apiStatus === 'offline' && (
            <div className="mb-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <p className="text-amber-400 text-sm">
                ⚠️ API Server appears to be offline. Please check your connection or try again later.
              </p>
              <p className="text-amber-400/70 text-xs mt-1">
                Attempting to connect to: {CONFIG.url}
              </p>
            </div>
          )}
          
          {error && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
              {apiStatus === 'offline' && (
                <p className="text-red-400/70 text-xs mt-1">
                  Note: This may be due to server connectivity issues.
                </p>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-white text-sm font-medium">
                  First Name
                </Label>
                <Input
                  id="firstName"
                  name="firstName"
                  placeholder="Enter your first name"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                  className="w-full bg-zinc-800 border-zinc-600 text-white placeholder:text-zinc-400 focus:border-white focus:ring-white/20"
                />
                {formErrors.firstName && (
                  <p className="text-red-400 text-xs">{formErrors.firstName}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-white text-sm font-medium">
                  Last Name
                </Label>
                <Input
                  id="lastName"
                  name="lastName"
                  placeholder="Enter your last name"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                  className="w-full bg-zinc-800 border-zinc-600 text-white placeholder:text-zinc-400 focus:border-white focus:ring-white/20"
                />
                {formErrors.lastName && (
                  <p className="text-red-400 text-xs">{formErrors.lastName}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-white text-sm font-medium">
                  Username
                </Label>
                <Input
                  id="username"
                  name="username"
                  placeholder="Enter your username"
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                  className="w-full bg-zinc-800 border-zinc-600 text-white placeholder:text-zinc-400 focus:border-white focus:ring-white/20"
                />
                {formErrors.username && (
                  <p className="text-red-400 text-xs">{formErrors.username}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-white text-sm font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                  className="w-full bg-zinc-800 border-zinc-600 text-white placeholder:text-zinc-400 focus:border-white focus:ring-white/20"
                />
                {formErrors.email && (
                  <p className="text-red-400 text-xs">{formErrors.email}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber" className="text-white text-sm font-medium">
                Phone Number (Optional)
              </Label>
              <Input
                id="phoneNumber"
                name="phoneNumber"
                placeholder="Enter your phone number"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                disabled={loading}
                className="w-full bg-zinc-800 border-zinc-600 text-white placeholder:text-zinc-400 focus:border-white focus:ring-white/20"
              />
              {formErrors.phoneNumber && (
                <p className="text-red-400 text-xs">{formErrors.phoneNumber}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-white text-sm font-medium">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                  className="w-full bg-zinc-800 border-zinc-600 text-white placeholder:text-zinc-400 focus:border-white focus:ring-white/20 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-400 hover:text-zinc-300"
                >
                  {showPassword ? <VisibilityOff className="w-4 h-4" /> : <Visibility className="w-4 h-4" />}
                </button>
              </div>
              {formErrors.password && (
                <p className="text-red-400 text-xs">{formErrors.password}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-white text-sm font-medium">
                Confirm Password
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                  className="w-full bg-zinc-800 border-zinc-600 text-white placeholder:text-zinc-400 focus:border-white focus:ring-white/20 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-400 hover:text-zinc-300"
                >
                  {showConfirmPassword ? <VisibilityOff className="w-4 h-4" /> : <Visibility className="w-4 h-4" />}
                </button>
              </div>
              {formErrors.confirmPassword && (
                <p className="text-red-400 text-xs">{formErrors.confirmPassword}</p>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={loading || apiStatus === 'offline'}
                className="flex-1 bg-white hover:bg-zinc-100 text-black"
              >
                {loading ? <CircularProgress size={16} className="text-black" /> : 'Create Account'}
              </Button>
            </div>
          </form>

          <div className="mt-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-600" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-zinc-900 px-2 text-zinc-400">Or continue with</span>
              </div>
            </div>

            <div className="mt-4">
              <Button
                type="button"
                onClick={handleGoogleSignup}
                disabled={loading || apiStatus === 'offline'}
                className="w-full bg-white hover:bg-zinc-100 text-black border border-zinc-300 flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign up with Google
              </Button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-zinc-400 text-sm">
              Already have an account?{' '}
              <Link
                href="/login"
                className="text-white hover:text-zinc-300 font-medium"
              >
                Sign in
              </Link>
            </p>
          </div>

          <div className="mt-3 text-center">
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

export default Register;
