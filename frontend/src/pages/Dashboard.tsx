import { useState, useEffect, useCallback } from 'react';
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
  CircularProgress,
  Tab,
  Tabs,
  IconButton,
  Menu,
  MenuItem,
  TextField,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import AccountBoxIcon from '@mui/icons-material/AccountBox';
import FolderIcon from '@mui/icons-material/Folder';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import DownloadIcon from '@mui/icons-material/Download';
import GoogleIcon from '@mui/icons-material/Google';
import { ApiService } from '../services/apiService';
import { CONFIG } from '../config/config';

// Google OAuth configuration
const GOOGLE_OAUTH_REDIRECT_URI = `${window.location.origin}/auth/callback`;

interface UserInfo {
  username: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  picture?: any;
  phone_number?: string;
  auth_method?: string;
}

interface FileTab {
  id: string;
  name: string;
  content: string;
  type: 'text' | 'json' | 'markdown';
  modified: boolean;
}

interface CloudFile {
  id: string;
  name: string;
  type: string;
  size: number;
  modified: Date;
  content?: string;
}

const Dashboard = (): JSX.Element => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Workspaces state
  const [currentView, setCurrentView] = useState<'dashboard' | 'workspaces'>('dashboard');
  const [openTabs, setOpenTabs] = useState<FileTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [cloudFiles, setCloudFiles] = useState<CloudFile[]>([]);
  const [filesDrawerOpen, setFilesDrawerOpen] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileDialogOpen, setNewFileDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  useEffect(() => {
    const checkAuthAndFetchUser = async () => {
      try {
        setLoading(true);
        
        // Validate token first using ApiService
        const isValidToken = await ApiService.validateToken();

        if (!isValidToken) {
          // Token is invalid, redirect to login
          navigate('/login');
          return;
        }

        // Token is valid, create user info from stored data
        const username = localStorage.getItem('authUsername') || localStorage.getItem('username');
        const basicUserInfo: UserInfo = {
          username: username || 'User',
          email: localStorage.getItem('userEmail') || username || '',
          first_name: '',
          last_name: '',
          picture: null
        };
        setUserInfo(basicUserInfo);
      } catch (err) {
        console.error('Auth check error:', err);
        setError('Failed to load user information');
        // Still try to show basic info if we have some stored data
        const username = localStorage.getItem('authUsername') || localStorage.getItem('username');
        if (username) {
          const basicUserInfo: UserInfo = {
            username: username,
            email: localStorage.getItem('userEmail') || username,
            first_name: '',
            last_name: '',
            picture: null
          };
          setUserInfo(basicUserInfo);
        } else {
          navigate('/login');
          return;
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndFetchUser();
  }, [navigate]);

  const handleLogout = () => {
    // Clear all authentication data using ApiService
    ApiService.clearAuthToken();
    
    // Clear any additional session data
    localStorage.removeItem('deviceId');
    localStorage.removeItem('googleOAuthSession');
    localStorage.removeItem('userData');
    
    // Redirect to home page
    navigate('/');
  };

  // Google OAuth login function
  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      
      // Get the Google OAuth URL from the backend
      const response = await fetch(`${CONFIG.url}/authentication/google/?redirect_uri=${encodeURIComponent(GOOGLE_OAUTH_REDIRECT_URI)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.authUrl) {
          // Redirect to Google OAuth
          window.location.href = data.authUrl;
        } else {
          setError('Failed to initiate Google OAuth');
        }
      } else {
        setError('Failed to connect to authentication server');
      }
    } catch (err) {
      console.error('Google OAuth error:', err);
      setError('Failed to initiate Google login');
    } finally {
      setLoading(false);
    }
  };

  // Workspaces functionality
  const createNewFile = useCallback((name: string, type: 'text' | 'json' | 'markdown' = 'text') => {
    const newTab: FileTab = {
      id: `file-${Date.now()}`,
      name,
      content: type === 'json' ? '{}' : '',
      type,
      modified: false
    };
    
    setOpenTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
    setNewFileDialogOpen(false);
    setNewFileName('');
  }, []);

  const closeTab = useCallback((tabId: string) => {
    setOpenTabs(prev => prev.filter(tab => tab.id !== tabId));
    if (activeTabId === tabId) {
      setActiveTabId(_prev => {
        const remainingTabs = openTabs.filter(tab => tab.id !== tabId);
        return remainingTabs.length > 0 ? remainingTabs[remainingTabs.length - 1].id : null;
      });
    }
  }, [activeTabId, openTabs]);

  const updateTabContent = useCallback((tabId: string, content: string) => {
    setOpenTabs(prev => prev.map(tab => 
      tab.id === tabId 
        ? { ...tab, content, modified: true }
        : tab
    ));
  }, []);

  const saveFile = useCallback(async (tabId: string) => {
    const tab = openTabs.find(t => t.id === tabId);
    if (!tab) return;

    try {
      // In a real implementation, this would save to the backend
      // For now, just mark as saved
      setOpenTabs(prev => prev.map(t => 
        t.id === tabId ? { ...t, modified: false } : t
      ));
      
      // Show success message
      console.log(`File ${tab.name} saved successfully`);
    } catch (error) {
      console.error('Error saving file:', error);
    }
  }, [openTabs]);

  const loadCloudFiles = useCallback(async () => {
    try {
      // Mock data for demonstration
      const mockFiles: CloudFile[] = [
        {
          id: '1',
          name: 'project-notes.md',
          type: 'markdown',
          size: 1024,
          modified: new Date(),
          content: '# Project Notes\n\nThis is a sample markdown file.'
        },
        {
          id: '2',
          name: 'config.json',
          type: 'json',
          size: 512,
          modified: new Date(),
          content: '{\n  "api_url": "https://api.example.com",\n  "timeout": 5000\n}'
        },
        {
          id: '3',
          name: 'readme.txt',
          type: 'text',
          size: 256,
          modified: new Date(),
          content: 'Welcome to your workspace!\n\nYou can create and edit files here.'
        }
      ];
      
      setCloudFiles(mockFiles);
    } catch (error) {
      console.error('Error loading cloud files:', error);
    }
  }, []);

  const openCloudFile = useCallback((file: CloudFile) => {
    const existingTab = openTabs.find(tab => tab.name === file.name);
    if (existingTab) {
      setActiveTabId(existingTab.id);
      return;
    }

    const fileType = file.type === 'markdown' ? 'markdown' : 
                    file.type === 'json' ? 'json' : 'text';
    
    const newTab: FileTab = {
      id: `cloud-${file.id}`,
      name: file.name,
      content: file.content || '',
      type: fileType,
      modified: false
    };
    
    setOpenTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
    setFilesDrawerOpen(false);
  }, [openTabs]);

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'json':
      case 'markdown':
      case 'text':
        return <InsertDriveFileIcon />;
      default:
        return <InsertDriveFileIcon />;
    }
  };

  // Load cloud files when switching to workspaces view
  useEffect(() => {
    if (currentView === 'workspaces') {
      loadCloudFiles();
    }
  }, [currentView, loadCloudFiles]);

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

  if (currentView === 'workspaces') {
    const activeTab = openTabs.find(tab => tab.id === activeTabId);
    
    return (
      <Box
        sx={{
          minHeight: '100vh',
          backgroundColor: theme.palette.mode === 'dark' ? '#0a0a0a' : '#f5f5f5',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Workspaces Header */}
        <Paper
          elevation={1}
          sx={{
            p: 2,
            backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#ffffff',
            borderRadius: 0
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Workspaces
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<FolderIcon />}
                onClick={() => setFilesDrawerOpen(true)}
                size="small"
              >
                Files
              </Button>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => setNewFileDialogOpen(true)}
                size="small"
              >
                New File
              </Button>
              <Button
                variant="outlined"
                onClick={() => setCurrentView('dashboard')}
                size="small"
              >
                Back to Dashboard
              </Button>
            </Box>
          </Box>
        </Paper>

        {/* File Tabs */}
        {openTabs.length > 0 && (
          <Paper
            elevation={0}
            sx={{
              backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#ffffff',
              borderBottom: 1,
              borderColor: 'divider'
            }}
          >
            <Tabs
              value={activeTabId}
              onChange={(_, newValue) => setActiveTabId(newValue)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ minHeight: 40 }}
            >
              {openTabs.map((tab) => (
                <Tab
                  key={tab.id}
                  value={tab.id}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getFileIcon(tab.type)}
                      <span>{tab.name}</span>
                      {tab.modified && <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'warning.main' }} />}
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          closeTab(tab.id);
                        }}
                        sx={{ ml: 1, p: 0.25 }}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  }
                  sx={{ minHeight: 40, textTransform: 'none' }}
                />
              ))}
            </Tabs>
          </Paper>
        )}

        {/* Editor Area */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {activeTab ? (
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              {/* Editor Toolbar */}
              <Paper
                elevation={0}
                sx={{
                  p: 1,
                  backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f5f5f5',
                  borderBottom: 1,
                  borderColor: 'divider',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Editing: {activeTab.name}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<SaveIcon />}
                    onClick={() => saveFile(activeTab.id)}
                    disabled={!activeTab.modified}
                  >
                    Save
                  </Button>
                  <IconButton
                    size="small"
                    onClick={(e) => setAnchorEl(e.currentTarget)}
                  >
                    <MoreVertIcon />
                  </IconButton>
                </Box>
              </Paper>

              {/* Text Editor */}
              <Box sx={{ flex: 1, p: 2, backgroundColor: theme.palette.mode === 'dark' ? '#0a0a0a' : '#ffffff' }}>
                <TextField
                  fullWidth
                  multiline
                  value={activeTab.content}
                  onChange={(e) => updateTabContent(activeTab.id, e.target.value)}
                  variant="outlined"
                  placeholder="Start typing..."
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      fontFamily: 'monospace',
                      fontSize: '14px',
                      minHeight: '400px',
                      alignItems: 'flex-start',
                      '& fieldset': {
                        border: 'none'
                      }
                    },
                    '& textarea': {
                      resize: 'none'
                    }
                  }}
                />
              </Box>
            </Box>
          ) : (
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: 2,
                color: 'text.secondary'
              }}
            >
              <InsertDriveFileIcon sx={{ fontSize: 64, opacity: 0.5 }} />
              <Typography variant="h6">No file open</Typography>
              <Typography variant="body2">Create a new file or open an existing one to get started</Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setNewFileDialogOpen(true)}
              >
                Create New File
              </Button>
            </Box>
          )}
        </Box>

        {/* Files Drawer */}
        <Drawer
          anchor="left"
          open={filesDrawerOpen}
          onClose={() => setFilesDrawerOpen(false)}
        >
          <Box sx={{ width: 300, p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Cloud Files</Typography>
            <List>
              {cloudFiles.map((file) => (
                <ListItem key={file.id} disablePadding>
                  <ListItemButton onClick={() => openCloudFile(file)}>
                    <ListItemIcon>
                      {getFileIcon(file.type)}
                    </ListItemIcon>
                    <ListItemText
                      primary={file.name}
                      secondary={`${(file.size / 1024).toFixed(1)} KB`}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Box>
        </Drawer>

        {/* New File Dialog */}
        {newFileDialogOpen && (
          <Box
            sx={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1300
            }}
            onClick={() => setNewFileDialogOpen(false)}
          >
            <Paper
              sx={{ p: 3, minWidth: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              <Typography variant="h6" sx={{ mb: 2 }}>Create New File</Typography>
              <TextField
                fullWidth
                label="File Name"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                sx={{ mb: 2 }}
                autoFocus
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && newFileName.trim()) {
                    createNewFile(newFileName.trim());
                  }
                }}
              />
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                <Button onClick={() => setNewFileDialogOpen(false)}>Cancel</Button>
                <Button
                  variant="contained"
                  onClick={() => createNewFile(newFileName.trim())}
                  disabled={!newFileName.trim()}
                >
                  Create
                </Button>
              </Box>
            </Paper>
          </Box>
        )}

        {/* File Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
        >
          <MenuItem onClick={() => setAnchorEl(null)}>
            <FileUploadIcon sx={{ mr: 1 }} />
            Upload
          </MenuItem>
          <MenuItem onClick={() => setAnchorEl(null)}>
            <DownloadIcon sx={{ mr: 1 }} />
            Download
          </MenuItem>
        </Menu>
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
                   {!localStorage.getItem('googleOAuthSession') && (
                     <Button
                       variant="outlined"
                       fullWidth
                       startIcon={<GoogleIcon />}
                       onClick={handleGoogleLogin}
                       disabled={loading}
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
                       Connect Google Account
                     </Button>
                   )}

                   <Button
                     variant="outlined"
                     fullWidth
                     onClick={() => setCurrentView('workspaces')}
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
                     Open Workspaces
                   </Button>

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