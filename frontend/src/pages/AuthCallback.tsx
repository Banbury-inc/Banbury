import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Box, CircularProgress, Typography, Alert } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { ApiService } from '../services/apiService';

const AuthCallback = (): JSX.Element => {
  const theme = useTheme();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      const code = router.query.code as string | undefined;
      const urlError = router.query.error as string | undefined;

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
        const result = await ApiService.handleOAuthCallback(code);

        if (result.success) {
          setStatus('success');
          // Redirect to dashboard after a short delay
          setTimeout(() => {
            router.push('/dashboard');
          }, 1500);
        }
      } catch (err) {
        setStatus('error');
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        setTimeout(() => router.push('/login'), 3000);
      }
    };

    handleCallback();
  }, [router]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.palette.mode === 'dark' ? '#0a0a0a' : '#f5f5f5'
      }}
    >
      <Box sx={{ textAlign: 'center', maxWidth: 400 }}>
        {status === 'loading' && (
          <>
            <CircularProgress size={60} sx={{ mb: 2 }} />
            <Typography
              variant="h6"
              sx={{
                color: theme.palette.mode === 'dark' ? '#ffffff' : '#171717',
                mb: 1
              }}
            >
              Completing Authentication
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Please wait while we finish setting up your account...
            </Typography>
          </>
        )}

        {status === 'success' && (
          <>
            <Box sx={{ 
              fontSize: 64, 
              mb: 2,
              color: 'success.main'
            }}>
              ✓
            </Box>
            <Typography variant="h6" sx={{ mb: 1, color: 'success.main' }}>
              Authentication Successful!
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Redirecting to your dashboard...
            </Typography>
          </>
        )}

        {status === 'error' && (
          <>
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
            <Typography variant="body2" color="textSecondary">
              Redirecting to login page...
            </Typography>
          </>
        )}
      </Box>
    </Box>
  );
};

export default AuthCallback;