import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, CircularProgress, Typography, Alert } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { ApiService } from '../services/apiService';

const AuthCallback = (): JSX.Element => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      
      if (!code) {
        setError('No authorization code received from Google');
        setTimeout(() => navigate('/login'), 3000);
        return;
      }

      try {
        const result = await ApiService.handleOAuthCallback(code);

        if (result.success) {
          // Redirect to dashboard
          navigate('/dashboard');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

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
        {error ? (
          <>
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
            <Typography variant="body2" color="textSecondary">
              Redirecting to login page...
            </Typography>
          </>
        ) : (
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
      </Box>
    </Box>
  );
};

export default AuthCallback;