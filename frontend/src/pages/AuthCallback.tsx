import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, CircularProgress, Typography, Alert } from '@mui/material';
import { CONFIG } from '../config/config';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const error = searchParams.get('error');

      if (error) {
        setStatus('error');
        setError(`Authentication failed: ${error}`);
        return;
      }

      if (!code) {
        setStatus('error');
        setError('No authorization code received');
        return;
      }

      try {
        // Send the authorization code to our backend
        const response = await fetch(`${CONFIG.url}/authentication/auth/callback?code=${code}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();

        if (response.ok && data.success) {
          // Store authentication data
          const userData = data.user;
          const token = data.token;
          
          localStorage.setItem('authToken', token);
          localStorage.setItem('authUsername', userData.username);
          localStorage.setItem('userEmail', userData.email);
          localStorage.setItem('googleOAuthSession', 'true');
          
          // Store user data for dashboard
          localStorage.setItem('userData', JSON.stringify(userData));
          
          setStatus('success');
          
          // Redirect to dashboard after a short delay
          setTimeout(() => {
            navigate('/dashboard');
          }, 2000);
        } else {
          setStatus('error');
          setError(data.error || 'Authentication failed');
        }
      } catch (err) {
        setStatus('error');
        setError('Network error occurred during authentication');
        console.error('Auth callback error:', err);
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
        p: 4
      }}
    >
      {status === 'loading' && (
        <>
          <CircularProgress size={60} sx={{ mb: 3 }} />
          <Typography variant="h6" sx={{ mb: 2 }}>
            Completing authentication...
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Please wait while we verify your credentials.
          </Typography>
        </>
      )}

      {status === 'success' && (
        <>
          <Box sx={{ 
            fontSize: 64, 
            mb: 3,
            color: 'success.main'
          }}>
            ✓
          </Box>
          <Typography variant="h6" sx={{ mb: 2, color: 'success.main' }}>
            Authentication Successful!
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Redirecting to your dashboard...
          </Typography>
        </>
      )}

      {status === 'error' && (
        <>
          <Alert severity="error" sx={{ mb: 3, maxWidth: 400 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Authentication Failed
            </Typography>
            <Typography variant="body2">
              {error}
            </Typography>
          </Alert>
          <Typography 
            variant="body2" 
            color="primary" 
            sx={{ cursor: 'pointer', textDecoration: 'underline' }}
            onClick={() => navigate('/login')}
          >
            Return to Login
          </Typography>
        </>
      )}
    </Box>
  );
};

export default AuthCallback;