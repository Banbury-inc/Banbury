import { useState } from 'react';
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
import { Link, useNavigate } from 'react-router-dom';
import { CONFIG } from '../config/config';

const Login = (): JSX.Element => {
  const theme = useTheme();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      // First, check if login credentials are valid
      const loginResponse = await fetch(`${CONFIG.url}/authentication/login_api/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password
        })
      });

      const loginData = await loginResponse.json();

      if (loginData.response === 'success') {
        // Get user info and token using getuserinfo4 endpoint
        const userInfoResponse = await fetch(
          `${CONFIG.url}/authentication/getuserinfo4/${formData.username}/${formData.password}/`
        );
        
        const userInfoData = await userInfoResponse.json();
        
        if (userInfoData.result === 'success' && userInfoData.token) {
          // Store authentication token
          localStorage.setItem('authToken', userInfoData.token);
          localStorage.setItem('username', userInfoData.username);
          
          // Redirect to dashboard
          navigate('/dashboard');
        } else {
          setError('Failed to retrieve user information');
        }
      } else {
        setError('Invalid username or password');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      // Construct redirect URI for current environment
      // This should point to your frontend callback page, not the backend
      const redirectUri = `${window.location.origin}/authentication/auth/callback`;
      
      const response = await fetch(`${CONFIG.url}/authentication/google/?redirect_uri=${encodeURIComponent(redirectUri)}`, {
        method: 'GET'
      });
      
      const data = await response.json();
      
      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        setError('Failed to initiate Google login');
      }
    } catch (err) {
      setError('Google login failed. Please try again.');
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

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
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
              disabled={loading}
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
              {loading ? <CircularProgress size={24} /> : 'Sign In'}
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
              mb: 2
            }}
          >
            Continue with Google
          </Button>

          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Typography variant="body2" color="textSecondary">
              Don&apos;t have an account?{' '}
              <Link
                to="/register"
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
              to="/"
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