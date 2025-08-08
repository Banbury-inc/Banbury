import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Paper,
  Divider,
  Alert,
  CircularProgress
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import GoogleIcon from '@mui/icons-material/Google';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { CONFIG } from '../config/config';
import { ApiService } from '../services/apiService';
import { AUTH_CONFIG } from '../services/authConfig';
import { DebugService } from '../services/debugService';

const Login = (): JSX.Element => {
  const theme = useTheme();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');

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
        // Redirect to dashboard
        router.push('/dashboard');
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
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4,
        backgroundColor: theme.palette.mode === 'dark' ? '#0a0a0a' : '#f5f5f5'
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={3}
          sx={{
            p: 4,
            backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#ffffff',
            borderRadius: 2
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 600,
                color: theme.palette.mode === 'dark' ? '#ffffff' : '#171717',
                mb: 1
              }}
            >
              Welcome Back
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: theme.palette.mode === 'dark' ? '#a0a0a0' : '#666666'
              }}
            >
              Sign in to your Banbury account
            </Typography>
          </Box>

          {apiStatus === 'offline' && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              ⚠️ API Server appears to be offline. Please check your connection or try again later.
              <br />
              <small>Attempting to connect to: {CONFIG.url}</small>
            </Alert>
          )}
          
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
              {apiStatus === 'offline' && (
                <><br /><small>Note: This may be due to server connectivity issues.</small></>
              )}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ mb: 3 }}>
            <TextField
              fullWidth
              label="Username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              required
              sx={{ mb: 2 }}
              disabled={loading}
            />
            <TextField
              fullWidth
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              sx={{ mb: 3 }}
              disabled={loading}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading || apiStatus === 'offline'}
              sx={{
                py: 1.5,
                fontSize: '1.1rem',
                textTransform: 'none',
                backgroundColor: theme.palette.mode === 'dark' ? '#ffffff' : '#171717',
                color: theme.palette.mode === 'dark' ? '#171717' : '#ffffff',
                '&:hover': {
                  backgroundColor: theme.palette.mode === 'dark' ? '#e0e0e0' : '#333333',
                },
                '&:disabled': {
                  backgroundColor: theme.palette.mode === 'dark' ? '#666666' : '#cccccc',
                }
              }}
            >
              {loading ? <CircularProgress size={24} /> : apiStatus === 'offline' ? 'Service Offline' : 'Sign In'}
            </Button>
          </Box>

          <Divider sx={{ my: 3 }}>
            <Typography variant="body2" color="textSecondary">
              OR
            </Typography>
          </Divider>

          <Button
            fullWidth
            variant="outlined"
            size="large"
            onClick={handleGoogleLogin}
            disabled={apiStatus === 'offline'}
            startIcon={<GoogleIcon />}
            sx={{
              py: 1.5,
              fontSize: '1.1rem',
              textTransform: 'none',
              borderColor: theme.palette.mode === 'dark' ? '#ffffff' : '#171717',
              color: theme.palette.mode === 'dark' ? '#ffffff' : '#171717',
              '&:hover': {
                borderColor: theme.palette.mode === 'dark' ? '#e0e0e0' : '#333333',
                backgroundColor: 'transparent',
              },
              '&:disabled': {
                borderColor: theme.palette.mode === 'dark' ? '#666666' : '#cccccc',
                color: theme.palette.mode === 'dark' ? '#666666' : '#cccccc',
              },
              mb: 2
            }}
          >
            Continue with Google
          </Button>

          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Typography variant="body2" color="textSecondary">
              Don&apos;t have an account?{' '}
              <Link
                href="/register"
                style={{
                  color: theme.palette.mode === 'dark' ? '#ffffff' : '#171717',
                  textDecoration: 'none',
                  fontWeight: 500
                }}
              >
                Sign up
              </Link>
            </Typography>
          </Box>

          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Link
              href="/"
              style={{
                color: theme.palette.mode === 'dark' ? '#a0a0a0' : '#666666',
                textDecoration: 'none',
                fontSize: '0.9rem'
              }}
            >
              ← Back to Home
            </Link>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;