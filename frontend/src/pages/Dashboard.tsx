import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Avatar,
  Button,
  Grid,
  Card,
  CardContent,
  Divider,
  Alert,
  CircularProgress
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import AccountBoxIcon from '@mui/icons-material/AccountBox';
import { CONFIG } from '../config/config';
import { ApiService } from '../services/apiService';

interface UserInfo {
  username: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  picture?: any;
  phone_number?: string;
  auth_method?: string;
}

const Dashboard = (): JSX.Element => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const checkAuthAndFetchUser = async () => {
      const token = localStorage.getItem('authToken');
      const username = localStorage.getItem('username');

      if (!token || !username) {
        navigate('/login');
        return;
      }

      try {
        // Validate token first
        const isValidToken = await ApiService.validateToken();

        if (!isValidToken) {
          // Token is invalid, redirect to login
          navigate('/login');
          return;
        }

        // Token is valid, fetch user info from MongoDB
        const response = await fetch(`${CONFIG.url}/authentication/getuserinfo4/${username}/${localStorage.getItem('tempPassword') || 'oauth'}/`, {
          method: 'GET'
        });

        if (response.ok) {
          const data = await response.json();
          if (data.result === 'success') {
            // For OAuth users, we might not have password-based endpoints working
            // So let's create a basic user object from localStorage
            const basicUserInfo: UserInfo = {
              username: username,
              email: localStorage.getItem('userEmail') || '',
              first_name: '',
              last_name: '',
              picture: null
            };
            setUserInfo(basicUserInfo);
          }
        } else {
          // If the endpoint fails, create user info from stored data
          const basicUserInfo: UserInfo = {
            username: username,
            email: localStorage.getItem('userEmail') || '',
            first_name: '',
            last_name: '',
            picture: null
          };
          setUserInfo(basicUserInfo);
        }
      } catch (err) {
        setError('Failed to load user information');
        // Still show basic info even if fetch fails
        const basicUserInfo: UserInfo = {
          username: username || '',
          email: localStorage.getItem('userEmail') || '',
          first_name: '',
          last_name: '',
          picture: null
        };
        setUserInfo(basicUserInfo);
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndFetchUser();
  }, [navigate]);

  const handleLogout = () => {
    // Clear all authentication data using ApiService
    ApiService.clearAuthToken();
    
    // Redirect to home page
    navigate('/');
  };

  const getProfileImage = (): string | undefined => {
    if (userInfo?.picture) {
      if (typeof userInfo.picture === 'string') {
        return userInfo.picture; // URL
      } else if (userInfo.picture.data) {
        return `data:${userInfo.picture.content_type};base64,${userInfo.picture.data}`;
      }
    }
    return undefined;
  };

  const getDisplayName = () => {
    if (userInfo?.first_name && userInfo?.last_name) {
      return `${userInfo.first_name} ${userInfo.last_name}`;
    } else if (userInfo?.first_name) {
      return userInfo.first_name;
    } else if (userInfo?.email) {
      return userInfo.email.split('@')[0];
    }
    return userInfo?.username || 'User';
  };

  if (loading) {
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
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: theme.palette.mode === 'dark' ? '#0a0a0a' : '#f5f5f5',
        py: 4
      }}
    >
      <Container maxWidth="lg">
        {/* Header */}
        <Paper
          elevation={3}
          sx={{
            p: 4,
            mb: 4,
            backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#ffffff',
            borderRadius: 2
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 600,
                color: theme.palette.mode === 'dark' ? '#ffffff' : '#171717'
              }}
            >
              Dashboard
            </Typography>
            <Button
              variant="outlined"
              startIcon={<LogoutIcon />}
              onClick={handleLogout}
              sx={{
                borderColor: theme.palette.mode === 'dark' ? '#ffffff' : '#171717',
                color: theme.palette.mode === 'dark' ? '#ffffff' : '#171717',
                '&:hover': {
                  borderColor: theme.palette.mode === 'dark' ? '#e0e0e0' : '#333333',
                  backgroundColor: 'transparent',
                },
              }}
            >
              Logout
            </Button>
          </Box>

          {error && (
            <Alert severity="warning" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* User Profile Section */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Avatar
              src={getProfileImage()}
              sx={{
                width: 80,
                height: 80,
                backgroundColor: theme.palette.mode === 'dark' ? '#333333' : '#e0e0e0'
              }}
            >
              {!getProfileImage() && <PersonIcon sx={{ fontSize: 40 }} />}
            </Avatar>
            <Box>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 600,
                  color: theme.palette.mode === 'dark' ? '#ffffff' : '#171717',
                  mb: 1
                }}
              >
                Welcome back, {getDisplayName()}!
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: theme.palette.mode === 'dark' ? '#a0a0a0' : '#666666'
                }}
              >
                Manage your Banbury Cloud account and services
              </Typography>
            </Box>
          </Box>
        </Paper>

        {/* User Information Cards */}
        <Grid container spacing={3}>
          {/* Account Information */}
          <Grid item xs={12} md={6}>
            <Card
              sx={{
                height: '100%',
                backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#ffffff'
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <AccountBoxIcon sx={{ mr: 1, color: theme.palette.mode === 'dark' ? '#ffffff' : '#171717' }} />
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      color: theme.palette.mode === 'dark' ? '#ffffff' : '#171717'
                    }}
                  >
                    Account Information
                  </Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                    Username
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{ color: theme.palette.mode === 'dark' ? '#ffffff' : '#171717' }}
                  >
                    {userInfo?.username || 'N/A'}
                  </Typography>
                </Box>

                {userInfo?.email && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                      Email
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{ color: theme.palette.mode === 'dark' ? '#ffffff' : '#171717' }}
                    >
                      {userInfo.email}
                    </Typography>
                  </Box>
                )}

                {(userInfo?.first_name || userInfo?.last_name) && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                      Full Name
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{ color: theme.palette.mode === 'dark' ? '#ffffff' : '#171717' }}
                    >
                      {`${userInfo.first_name || ''} ${userInfo.last_name || ''}`.trim() || 'N/A'}
                    </Typography>
                  </Box>
                )}

                {userInfo?.phone_number && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                      Phone Number
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{ color: theme.palette.mode === 'dark' ? '#ffffff' : '#171717' }}
                    >
                      {userInfo.phone_number}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Quick Actions */}
          <Grid item xs={12} md={6}>
            <Card
              sx={{
                height: '100%',
                backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#ffffff'
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    color: theme.palette.mode === 'dark' ? '#ffffff' : '#171717',
                    mb: 2
                  }}
                >
                  Quick Actions
                </Typography>
                <Divider sx={{ mb: 3 }} />
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => navigate('/features')}
                    sx={{
                      py: 1.5,
                      textTransform: 'none',
                      borderColor: theme.palette.mode === 'dark' ? '#ffffff' : '#171717',
                      color: theme.palette.mode === 'dark' ? '#ffffff' : '#171717',
                      '&:hover': {
                        borderColor: theme.palette.mode === 'dark' ? '#e0e0e0' : '#333333',
                        backgroundColor: 'transparent',
                      },
                    }}
                  >
                    View Features
                  </Button>
                  
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => navigate('/api')}
                    sx={{
                      py: 1.5,
                      textTransform: 'none',
                      borderColor: theme.palette.mode === 'dark' ? '#ffffff' : '#171717',
                      color: theme.palette.mode === 'dark' ? '#ffffff' : '#171717',
                      '&:hover': {
                        borderColor: theme.palette.mode === 'dark' ? '#e0e0e0' : '#333333',
                        backgroundColor: 'transparent',
                      },
                    }}
                  >
                    API Documentation
                  </Button>
                  
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={() => navigate('/')}
                    sx={{
                      py: 1.5,
                      textTransform: 'none',
                      backgroundColor: theme.palette.mode === 'dark' ? '#ffffff' : '#171717',
                      color: theme.palette.mode === 'dark' ? '#171717' : '#ffffff',
                      '&:hover': {
                        backgroundColor: theme.palette.mode === 'dark' ? '#e0e0e0' : '#333333',
                      },
                    }}
                  >
                    Back to Home
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Dashboard;