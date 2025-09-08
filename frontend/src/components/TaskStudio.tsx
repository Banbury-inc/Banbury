import React from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import { Link } from 'react-router-dom';

const scrollbarStyles = {
  '&::-webkit-scrollbar': {
    width: '8px',
  },
  '&::-webkit-scrollbar-track': {
    backgroundColor: '#2B2C2F',
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: '#555',
    borderRadius: '4px',
    '&:hover': {
      backgroundColor: '#777',
    },
  },
};

const TaskStudio = (): JSX.Element => {
  const theme = useTheme();

  const sections = [
    { id: 'overview', title: 'Overview' },
    { id: 'getting-started', title: 'Getting Started' },
    { id: 'workspace-features', title: 'Workspace Features' },
    { id: 'file-management', title: 'File Management' },
    { id: 'task-management', title: 'Task Management' },
    { id: 'collaboration', title: 'Collaboration' },
    { id: 'api-integration', title: 'API Integration' },
    { id: 'troubleshooting', title: 'Troubleshooting' },
  ];

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: theme.palette.background.default }}>
      {/* Sidebar Navigation */}
      <Box 
        sx={{
          width: '280px',
          flexShrink: 0,
          backgroundColor: '#212121',
          borderRight: '1px solid #444',
          height: '100vh',
          position: 'sticky',
          top: 0,
          overflowY: 'auto',
          ...scrollbarStyles,
        }}
      >
        <List sx={{ paddingTop: '10px' }}>
          <ListSubheader 
            sx={{ 
              backgroundColor: '#212121', 
              color: '#FFFFFF', 
              fontWeight: 'bold', 
              paddingTop: '10px',
              paddingBottom: '5px',
              fontSize: '0.9rem'
            }}
          >
            Task Studio Guide
          </ListSubheader>
          {sections.map((section) => (
            <ListItem key={section.id} disablePadding>
              <ListItemButton 
                component="a" 
                href={`#${section.id}`} 
                sx={{
                  paddingLeft: 3, 
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)'
                  },
                  color: '#B0B1B4'
                }}
              >
                <ListItemText 
                  primary={section.title} 
                  primaryTypographyProps={{ 
                    fontSize: '0.85rem',
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>

      {/* Main Content Area */}
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          padding: 4, 
          overflowY: 'auto', 
          backgroundColor: '#212121',
          ...scrollbarStyles,
        }}
      >
        <style>{`html { scroll-behavior: smooth; }`}</style>

        {/* Header */}
        <Box marginBottom={4}>
          <Typography
            variant='h4'
            align='left'
            color='#FFFFFF'
            fontWeight={600}
            gutterBottom
            sx={{ marginBottom: 2 }}
          >
            Task Studio Documentation
          </Typography>
          <Typography
            variant='body1'
            align='left'
            color='#B0B1B4'
            gutterBottom
            sx={{ marginBottom: 4 }}
          >
            Learn how to use Banbury&apos;s Task Studio to manage files, collaborate with your team, and streamline your workflow.
          </Typography>
        </Box>

        <Container maxWidth="lg" sx={{ padding: 0 }}>
          
          {/* Overview Section */}
          <Box id="overview" sx={{ marginBottom: 6 }}>
            <Card sx={{ 
              backgroundColor: '#2c2c2c', 
              border: '1px solid #444', 
              borderRadius: '8px' 
            }}>
              <Box sx={{ backgroundColor: '#1c1c1c', padding: '16px', borderTopLeftRadius: '8px', borderTopRightRadius: '8px' }}>
                <Typography variant="h5" color="#FFFFFF">
                  Overview
                </Typography>
              </Box>
              <CardContent sx={{ padding: '24px' }}>
                <Typography variant="body1" color="#E1E1E3" sx={{ marginBottom: 3 }}>
                  Task Studio is Banbury&apos;s integrated workspace environment that combines file management, 
                  task tracking, and collaboration tools in one unified interface. It provides a powerful 
                  platform for managing your projects and working with your team.
                </Typography>
                
                <Typography variant="h6" color="#FFFFFF" sx={{ marginBottom: 2 }}>
                  Key Features
                </Typography>
                
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, marginBottom: 3 }}>
                  <Chip label="File Management" sx={{ backgroundColor: '#10A37F', color: 'white' }} />
                  <Chip label="Real-time Collaboration" sx={{ backgroundColor: '#FA6C17', color: 'white' }} />
                  <Chip label="Task Tracking" sx={{ backgroundColor: '#0A84FF', color: 'white' }} />
                  <Chip label="Cloud Synchronization" sx={{ backgroundColor: '#8B5CF6', color: 'white' }} />
                  <Chip label="Cross-device Access" sx={{ backgroundColor: '#F59E0B', color: 'white' }} />
                </Box>

                <Typography variant="body1" color="#E1E1E3">
                  Whether you&apos;re working on individual projects or collaborating with a team, 
                  Task Studio provides the tools you need to stay organized and productive.
                </Typography>
              </CardContent>
            </Card>
          </Box>

          {/* Getting Started Section */}
          <Box id="getting-started" sx={{ marginBottom: 6 }}>
            <Card sx={{ 
              backgroundColor: '#2c2c2c', 
              border: '1px solid #444', 
              borderRadius: '8px' 
            }}>
              <Box sx={{ backgroundColor: '#1c1c1c', padding: '16px', borderTopLeftRadius: '8px', borderTopRightRadius: '8px' }}>
                <Typography variant="h5" color="#FFFFFF">
                  Getting Started
                </Typography>
              </Box>
              <CardContent sx={{ padding: '24px' }}>
                <Typography variant="h6" color="#FFFFFF" sx={{ marginBottom: 2 }}>
                  Accessing Task Studio
                </Typography>
                
                <Typography variant="body1" color="#E1E1E3" sx={{ marginBottom: 3 }}>
                  To access Task Studio, you need to be logged into your Banbury account:
                </Typography>

                <Box sx={{ backgroundColor: '#1a1a1a', padding: 2, borderRadius: 1, marginBottom: 3 }}>
                  <Typography variant="body2" color="#E1E1E3" sx={{ fontFamily: 'monospace' }}>
                    1. Navigate to the Banbury website<br/>
                    2. Click &quot;Login&quot; in the top navigation<br/>
                    3. Sign in with your credentials or Google account<br/>
                    4. Access the Dashboard to view your Workspaces
                  </Typography>
                </Box>

                <Button 
                  component={Link} 
                  to="/login" 
                  variant="contained" 
                  sx={{ 
                    backgroundColor: '#10A37F', 
                    '&:hover': { backgroundColor: '#0d8f6f' },
                    marginBottom: 3
                  }}
                >
                  Go to Login
                </Button>

                <Typography variant="h6" color="#FFFFFF" sx={{ marginBottom: 2 }}>
                  First Time Setup
                </Typography>
                
                <Typography variant="body1" color="#E1E1E3">
                  Once logged in, you&apos;ll be taken to your Dashboard where you can access the Workspaces 
                  feature. This is your Task Studio environment where you can create, edit, and manage 
                  files across all your connected devices.
                </Typography>
              </CardContent>
            </Card>
          </Box>

          {/* Workspace Features Section */}
          <Box id="workspace-features" sx={{ marginBottom: 6 }}>
            <Card sx={{ 
              backgroundColor: '#2c2c2c', 
              border: '1px solid #444', 
              borderRadius: '8px' 
            }}>
              <Box sx={{ backgroundColor: '#1c1c1c', padding: '16px', borderTopLeftRadius: '8px', borderTopRightRadius: '8px' }}>
                <Typography variant="h5" color="#FFFFFF">
                  Workspace Features
                </Typography>
              </Box>
              <CardContent sx={{ padding: '24px' }}>
                <Typography variant="body1" color="#E1E1E3" sx={{ marginBottom: 3 }}>
                  The Workspace interface provides a comprehensive environment for managing your files and tasks:
                </Typography>

                <Typography variant="h6" color="#FFFFFF" sx={{ marginBottom: 2 }}>
                  File Editor
                </Typography>
                <Typography variant="body1" color="#E1E1E3" sx={{ marginBottom: 3 }}>
                  • Built-in text editor with syntax highlighting<br/>
                  • Support for multiple file formats<br/>
                  • Auto-save functionality<br/>
                  • Real-time collaboration features
                </Typography>

                <Typography variant="h6" color="#FFFFFF" sx={{ marginBottom: 2 }}>
                  File Browser
                </Typography>
                <Typography variant="body1" color="#E1E1E3" sx={{ marginBottom: 3 }}>
                  • Navigate through your cloud files<br/>
                  • Create new files and folders<br/>
                  • Upload and download files<br/>
                  • Organize your project structure
                </Typography>

                <Typography variant="h6" color="#FFFFFF" sx={{ marginBottom: 2 }}>
                  Tab Management
                </Typography>
                <Typography variant="body1" color="#E1E1E3">
                  • Open multiple files in tabs<br/>
                  • Switch between files quickly<br/>
                  • Close and reopen tabs as needed<br/>
                  • Maintain your workspace state across sessions
                </Typography>
              </CardContent>
            </Card>
          </Box>

          {/* File Management Section */}
          <Box id="file-management" sx={{ marginBottom: 6 }}>
            <Card sx={{ 
              backgroundColor: '#2c2c2c', 
              border: '1px solid #444', 
              borderRadius: '8px' 
            }}>
              <Box sx={{ backgroundColor: '#1c1c1c', padding: '16px', borderTopLeftRadius: '8px', borderTopRightRadius: '8px' }}>
                <Typography variant="h5" color="#FFFFFF">
                  File Management
                </Typography>
              </Box>
              <CardContent sx={{ padding: '24px' }}>
                <Typography variant="h6" color="#FFFFFF" sx={{ marginBottom: 2 }}>
                  Creating Files
                </Typography>
                <Typography variant="body1" color="#E1E1E3" sx={{ marginBottom: 3 }}>
                  Create new files directly in your workspace:
                </Typography>
                <Box sx={{ backgroundColor: '#1a1a1a', padding: 2, borderRadius: 1, marginBottom: 3 }}>
                  <Typography variant="body2" color="#E1E1E3" sx={{ fontFamily: 'monospace' }}>
                    1. Click &quot;Create New File&quot; in the workspace<br/>
                    2. Enter a filename with appropriate extension<br/>
                    3. Start editing your content<br/>
                    4. Files are automatically saved to the cloud
                  </Typography>
                </Box>

                <Typography variant="h6" color="#FFFFFF" sx={{ marginBottom: 2 }}>
                  File Synchronization
                </Typography>
                <Typography variant="body1" color="#E1E1E3" sx={{ marginBottom: 3 }}>
                  All files in Task Studio are automatically synchronized across your devices:
                </Typography>
                <Typography variant="body1" color="#E1E1E3" sx={{ marginBottom: 3 }}>
                  • Changes are saved in real-time<br/>
                  • Access files from any connected device<br/>
                  • Offline changes sync when reconnected<br/>
                  • Version history is maintained automatically
                </Typography>

                <Typography variant="h6" color="#FFFFFF" sx={{ marginBottom: 2 }}>
                  File Sharing
                </Typography>
                <Typography variant="body1" color="#E1E1E3">
                  Share files and collaborate with team members:
                </Typography>
                <Typography variant="body1" color="#E1E1E3">
                  • Share individual files or entire folders<br/>
                  • Set permissions for view or edit access<br/>
                  • Track changes and contributions<br/>
                  • Manage sharing settings from the workspace
                </Typography>
              </CardContent>
            </Card>
          </Box>

          {/* Task Management Section */}
          <Box id="task-management" sx={{ marginBottom: 6 }}>
            <Card sx={{ 
              backgroundColor: '#2c2c2c', 
              border: '1px solid #444', 
              borderRadius: '8px' 
            }}>
              <Box sx={{ backgroundColor: '#1c1c1c', padding: '16px', borderTopLeftRadius: '8px', borderTopRightRadius: '8px' }}>
                <Typography variant="h5" color="#FFFFFF">
                  Task Management
                </Typography>
              </Box>
              <CardContent sx={{ padding: '24px' }}>
                <Typography variant="body1" color="#E1E1E3" sx={{ marginBottom: 3 }}>
                  Task Studio integrates powerful task management capabilities to help you track progress and organize your work:
                </Typography>

                <Typography variant="h6" color="#FFFFFF" sx={{ marginBottom: 2 }}>
                  Creating Tasks
                </Typography>
                <Typography variant="body1" color="#E1E1E3" sx={{ marginBottom: 3 }}>
                  Tasks can be created and managed through the integrated task system:
                </Typography>
                <Box sx={{ backgroundColor: '#1a1a1a', padding: 2, borderRadius: 1, marginBottom: 3 }}>
                  <Typography variant="body2" color="#E1E1E3" sx={{ fontFamily: 'monospace' }}>
                    • Add new tasks with descriptions and priorities<br/>
                    • Assign tasks to team members<br/>
                    • Set due dates and milestones<br/>
                    • Track task status and progress
                  </Typography>
                </Box>

                <Typography variant="h6" color="#FFFFFF" sx={{ marginBottom: 2 }}>
                  Task Status Management
                </Typography>
                <Typography variant="body1" color="#E1E1E3" sx={{ marginBottom: 3 }}>
                  Monitor and update task progress:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, marginBottom: 3 }}>
                  <Chip label="To Do" sx={{ backgroundColor: '#6B7280', color: 'white' }} />
                  <Chip label="In Progress" sx={{ backgroundColor: '#F59E0B', color: 'white' }} />
                  <Chip label="Completed" sx={{ backgroundColor: '#10A37F', color: 'white' }} />
                  <Chip label="Failed" sx={{ backgroundColor: '#EF4444', color: 'white' }} />
                </Box>

                <Typography variant="h6" color="#FFFFFF" sx={{ marginBottom: 2 }}>
                  Task Integration
                </Typography>
                <Typography variant="body1" color="#E1E1E3">
                  Tasks are seamlessly integrated with your file management workflow:
                </Typography>
                <Typography variant="body1" color="#E1E1E3">
                  • Link tasks to specific files or projects<br/>
                  • Update task status as you work<br/>
                  • View task history and completion metrics<br/>
                  • Generate reports on task performance
                </Typography>
              </CardContent>
            </Card>
          </Box>

          {/* Collaboration Section */}
          <Box id="collaboration" sx={{ marginBottom: 6 }}>
            <Card sx={{ 
              backgroundColor: '#2c2c2c', 
              border: '1px solid #444', 
              borderRadius: '8px' 
            }}>
              <Box sx={{ backgroundColor: '#1c1c1c', padding: '16px', borderTopLeftRadius: '8px', borderTopRightRadius: '8px' }}>
                <Typography variant="h5" color="#FFFFFF">
                  Collaboration
                </Typography>
              </Box>
              <CardContent sx={{ padding: '24px' }}>
                <Typography variant="body1" color="#E1E1E3" sx={{ marginBottom: 3 }}>
                  Task Studio enables seamless collaboration with team members through shared workspaces and real-time editing:
                </Typography>

                <Typography variant="h6" color="#FFFFFF" sx={{ marginBottom: 2 }}>
                  Real-time Editing
                </Typography>
                <Typography variant="body1" color="#E1E1E3" sx={{ marginBottom: 3 }}>
                  • Multiple users can edit files simultaneously<br/>
                  • See live cursors and changes from collaborators<br/>
                  • Automatic conflict resolution<br/>
                  • Change tracking and attribution
                </Typography>

                <Typography variant="h6" color="#FFFFFF" sx={{ marginBottom: 2 }}>
                  Workspace Sharing
                </Typography>
                <Typography variant="body1" color="#E1E1E3" sx={{ marginBottom: 3 }}>
                  • Share entire workspaces with team members<br/>
                  • Control access permissions (view, edit, admin)<br/>
                  • Invite collaborators via email<br/>
                  • Manage team member roles and permissions
                </Typography>

                <Typography variant="h6" color="#FFFFFF" sx={{ marginBottom: 2 }}>
                  Communication Tools
                </Typography>
                <Typography variant="body1" color="#E1E1E3">
                  • Built-in commenting system<br/>
                  • Task assignments and notifications<br/>
                  • Activity feeds and change logs<br/>
                  • Integration with external communication tools
                </Typography>
              </CardContent>
            </Card>
          </Box>

          {/* API Integration Section */}
          <Box id="api-integration" sx={{ marginBottom: 6 }}>
            <Card sx={{ 
              backgroundColor: '#2c2c2c', 
              border: '1px solid #444', 
              borderRadius: '8px' 
            }}>
              <Box sx={{ backgroundColor: '#1c1c1c', padding: '16px', borderTopLeftRadius: '8px', borderTopRightRadius: '8px' }}>
                <Typography variant="h5" color="#FFFFFF">
                  API Integration
                </Typography>
              </Box>
              <CardContent sx={{ padding: '24px' }}>
                <Typography variant="body1" color="#E1E1E3" sx={{ marginBottom: 3 }}>
                  Task Studio is built on top of Banbury&apos;s comprehensive API, providing programmatic access to all features:
                </Typography>

                <Typography variant="h6" color="#FFFFFF" sx={{ marginBottom: 2 }}>
                  Task Management APIs
                </Typography>
                <Box sx={{ backgroundColor: '#1a1a1a', padding: 2, borderRadius: 1, marginBottom: 3 }}>
                  <Typography variant="body2" color="#E1E1E3" sx={{ fontFamily: 'monospace' }}>
                    POST /tasks/add_task/&#123;username&#125;<br/>
                    POST /tasks/fail_task/&#123;username&#125;<br/>
                    POST /tasks/update_task/&#123;username&#125;
                  </Typography>
                </Box>

                <Typography variant="h6" color="#FFFFFF" sx={{ marginBottom: 2 }}>
                  File Management APIs
                </Typography>
                <Typography variant="body1" color="#E1E1E3" sx={{ marginBottom: 3 }}>
                  • Upload and download files programmatically<br/>
                  • Manage file permissions and sharing<br/>
                  • Sync files across devices<br/>
                  • Access file metadata and history
                </Typography>

                <Button 
                  component={Link} 
                  to="/api" 
                  variant="outlined" 
                  sx={{ 
                    borderColor: '#10A37F', 
                    color: '#10A37F',
                    '&:hover': { 
                      borderColor: '#0d8f6f',
                      backgroundColor: 'rgba(16, 163, 127, 0.1)'
                    }
                  }}
                >
                  View Full API Documentation
                </Button>
              </CardContent>
            </Card>
          </Box>

          {/* Troubleshooting Section */}
          <Box id="troubleshooting" sx={{ marginBottom: 6 }}>
            <Card sx={{ 
              backgroundColor: '#2c2c2c', 
              border: '1px solid #444', 
              borderRadius: '8px' 
            }}>
              <Box sx={{ backgroundColor: '#1c1c1c', padding: '16px', borderTopLeftRadius: '8px', borderTopRightRadius: '8px' }}>
                <Typography variant="h5" color="#FFFFFF">
                  Troubleshooting
                </Typography>
              </Box>
              <CardContent sx={{ padding: '24px' }}>
                <Typography variant="h6" color="#FFFFFF" sx={{ marginBottom: 2 }}>
                  Common Issues
                </Typography>
                
                <Typography variant="body1" color="#E1E1E3" sx={{ marginBottom: 2, fontWeight: 'bold' }}>
                  Files not syncing
                </Typography>
                <Typography variant="body1" color="#E1E1E3" sx={{ marginBottom: 3 }}>
                  • Check your internet connection<br/>
                  • Verify device is online in Dashboard<br/>
                  • Try refreshing the workspace<br/>
                  • Contact support if issues persist
                </Typography>

                <Typography variant="body1" color="#E1E1E3" sx={{ marginBottom: 2, fontWeight: 'bold' }}>
                  Cannot access workspace
                </Typography>
                <Typography variant="body1" color="#E1E1E3" sx={{ marginBottom: 3 }}>
                  • Ensure you&apos;re logged in to your account<br/>
                  • Check workspace permissions<br/>
                  • Clear browser cache and cookies<br/>
                  • Try accessing from a different browser
                </Typography>

                <Typography variant="body1" color="#E1E1E3" sx={{ marginBottom: 2, fontWeight: 'bold' }}>
                  Task updates not saving
                </Typography>
                <Typography variant="body1" color="#E1E1E3" sx={{ marginBottom: 3 }}>
                  • Verify network connectivity<br/>
                  • Check task permissions<br/>
                  • Refresh the page and try again<br/>
                  • Review API status for service issues
                </Typography>

                <Typography variant="h6" color="#FFFFFF" sx={{ marginBottom: 2 }}>
                  Getting Help
                </Typography>
                <Typography variant="body1" color="#E1E1E3">
                  If you continue to experience issues:
                </Typography>
                <Typography variant="body1" color="#E1E1E3">
                  • Check the API documentation for technical details<br/>
                  • Review system status and known issues<br/>
                  • Contact our support team for assistance<br/>
                  • Join our community forums for tips and solutions
                </Typography>
              </CardContent>
            </Card>
          </Box>

        </Container>
      </Box>
    </Box>
  );
};

export default TaskStudio;
