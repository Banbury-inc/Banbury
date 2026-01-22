import React, { useState, useEffect } from 'react';

import ApiIcon from '@mui/icons-material/Api';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ChatIcon from '@mui/icons-material/Chat';
import FolderIcon from '@mui/icons-material/Folder';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import SearchIcon from '@mui/icons-material/Search';
import { Box, Card, CardMedia, Container, Grid, Typography, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Paper } from '@mui/material';
import axios from 'axios';
import Image from 'next/image';

import gmailLogo from '../assets/images/gmail_logo.png';
import googleCalendarLogo from '../assets/images/google_calendar_logo.png';


// Videos
const calendarDemo = require('../assets/images/calendar_demo.mp4');
const fantasyDraftDemo = require('../assets/images/fantasy_draft_demo.mp4');
const spreadsheetDemo = require('../assets/images/spreadsheet_demo.mp4');
const browserAutomationDemo = require('../assets/images/browser-automation-demo.mp4');
const emailSchedulingDemo = require('../assets/images/email-calendar-scheduling-demo.mp4');


interface ProductsProps {
  name: string;
  description: string;
  image: string;
}

const Features = (): JSX.Element => {
  const [products, setProducts] = useState<ProductsProps[]>([]);
  const [activeSection, setActiveSection] = useState<string>('overview');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = () => {
    axios.get<ProductsProps[]>('http://127.0.0.1:8000/products', {
      headers: {
        Accept: 'application/json',
      },
    }).then((response) => {
      setProducts(response.data);
    }).catch((_error) => {
      // Handle error silently
    });
  };

  const handleTabChange = (sectionId: string) => {
    setActiveSection(sectionId);
  };

  const sections = [
    { id: 'overview', label: 'Overview', icon: React.createElement(ChatIcon) },
    { id: 'features', label: 'Core Features', icon: React.createElement(RocketLaunchIcon) },
    { id: 'integrations', label: 'Integrations', icon: React.createElement(ApiIcon) },
  ];

  return (
    <>
    <Box sx={{ overflow: 'visible', background: '#000000', minHeight: '100vh' }}>
      <Box
        sx={{
          display: 'flex',
          background: '#000000',
          '&::before': {
            content: '""',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `
              linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
            opacity: 0.4,
            zIndex: 0,
          },
        }}
      >
        {/* Sidebar */}
        <Paper
          sx={{
            width: { xs: '100%', md: 280 },
            height: { xs: 'auto', md: 'calc(100vh - 80px)' },
            position: { xs: 'sticky', md: 'fixed' },
            top: { xs: 0, md: '80px' },
            left: 0,
            background: 'rgba(0, 0, 0, 0.95)',
            borderRight: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 0,
            zIndex: 10,
            backdropFilter: 'blur(10px)',
            overflowY: 'auto',
            display: { xs: 'block', md: 'block' },
          }}
        >
          
          <List sx={{ p: 2 }}>
            {sections.map((section) => (
              <ListItem key={section.id} disablePadding sx={{ mb: 1 }}>
                <ListItemButton
                  onClick={() => handleTabChange(section.id)}
                  sx={{
                    borderRadius: '12px',
                    background: activeSection === section.id ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                    '&:hover': {
                      background: 'rgba(255, 255, 255, 0.05)',
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color: activeSection === section.id ? '#ffffff' : '#a1a1aa',
                      minWidth: 40,
                    }}
                  >
                    {section.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={section.label}
                    sx={{
                      '& .MuiListItemText-primary': {
                        color: activeSection === section.id ? '#ffffff' : '#a1a1aa',
                        fontWeight: activeSection === section.id ? 600 : 400,
                        fontSize: '0.95rem',
                        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      },
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Paper>

        {/* Main Content */}
        <Box
          sx={{
            flex: 1,
            ml: { xs: 0, md: '280px' },
            pt: { xs: 8, md: '100px' },
            pb: { xs: 8, md: 12 },
            px: { xs: 2, sm: 4, md: 8 },
            position: 'relative',
            zIndex: 1,
            height: { xs: 'auto', md: 'calc(100vh - 80px)' },
            overflowY: 'auto',
            overflowX: 'hidden',
          }}
        >
          {/* Overview Tab */}
          {activeSection === 'overview' && (
            <>
              <Box sx={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
                <Typography
                  sx={{
                    fontSize: { xs: '2.5rem', md: '3.5rem' },
                    fontWeight: 600,
                    color: '#ffffff',
                    mb: 4,
                    letterSpacing: '-0.02em',
                    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  }}
                >
                  AI-Powered Document <br />
                  <Box component="span" sx={{ color: '#a1a1aa', fontWeight: 500 }}>
                    Workflows & Intelligence
                  </Box>
                </Typography>
                <Typography
                  sx={{
                    fontSize: { xs: '1.25rem', md: '1.5rem' },
                    color: '#a1a1aa',
                    mb: 3,
                    fontWeight: 500,
                    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  }}
                >
                  Create, Edit, and Enhance Documents with Intelligent AI Assistance
                </Typography>
                <Typography
                  sx={{
                    fontSize: { xs: '1rem', md: '1.125rem' },
                    color: '#a1a1aa',
                    maxWidth: '800px',
                    mx: 'auto',
                    lineHeight: 1.6,
                    fontWeight: 400,
                    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  }}
                >
                  From ChatGPT-style conversations to intelligent document creation, Banbury transforms how you work with files. 
                  Our AI searches the internet, analyzes content, and seamlessly integrates findings into your documents.
                </Typography>
              </Box>

              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  margin: '0 auto',
                  alignItems: 'center',
                  width: '90%',
                  maxWidth: '1200px',
                  background: 'rgba(255,255,255,0.02)',
                  padding: '48px',
                  borderRadius: '20px',
                  border: '1px solid rgba(255,255,255,0.08)',
                  mb: 8,
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '1px',
                    background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)',
                  },
                }}
              >
                <Box
                  sx={{
                    position: 'relative',
                    width: '100%',
                    height: 0,
                    paddingBottom: '56.25%', // 16:9 aspect ratio
                    borderRadius: '12px',
                    overflow: 'hidden',
                    filter: 'drop-shadow(0 8px 32px rgba(0,0,0,0.3))',
                  }}
                >
                  <iframe
                    src="https://www.youtube.com/embed/Ci8Wu93UIMU"
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      borderRadius: '12px',
                    }}
                  />
                </Box>
              </Box>

              {/* Product Demos moved to Overview */}
              <Box sx={{ textAlign: 'center', mt: 12, mb: 6 }}>
                <Typography
                  sx={{
                    fontSize: { xs: '1.75rem', md: '2.25rem' },
                    fontWeight: 600,
                    color: '#ffffff',
                    mb: 2,
                    letterSpacing: '-0.02em',
                    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  }}
                >
                  Product Demos
                </Typography>
                <Typography
                  sx={{
                    fontSize: { xs: '1rem', md: '1.05rem' },
                    color: '#a1a1aa',
                    maxWidth: '800px',
                    mx: 'auto',
                    lineHeight: 1.6,
                    fontWeight: 400,
                    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  }}
                >
                  Watch Banbury in action.
                </Typography>
              </Box>
              <Grid container spacing={6} sx={{ mb: 12 }}>
                <Grid item xs={12} md={4}>
                  <Box sx={{
                    p: 3,
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: '20px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    position: 'relative',
                    overflow: 'hidden',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                  }}>
                    <Typography
                      sx={{
                        mb: 2,
                        fontWeight: 600,
                        color: '#ffffff',
                        fontSize: '1.25rem',
                        letterSpacing: '-0.01em',
                        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      }}
                    >
                      Browser Automation Demo
                    </Typography>
                    <Typography
                      sx={{
                        mb: 3,
                        color: '#a1a1aa',
                        lineHeight: 1.6,
                        fontSize: '0.95rem',
                        fontWeight: 400,
                        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      }}
                    >
                      Watch how Banbury automates web tasks using natural language commands. The AI assistant navigates websites, fills out forms, and extracts information, showcasing its powerful browser automation capabilities.
                    </Typography>
                    <Box sx={{ 
                      position: 'relative', 
                      width: '100%', 
                      borderRadius: '12px', 
                      overflow: 'hidden',
                      flex: 1,
                      minHeight: '300px'
                    }}>
                      <video 
                        src={browserAutomationDemo} 
                        controls 
                        muted 
                        playsInline 
                        style={{ 
                          width: '100%', 
                          height: '100%', 
                          borderRadius: '12px',
                          objectFit: 'cover'
                        }} 
                      />
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{
                    p: 3,
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: '20px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    position: 'relative',
                    overflow: 'hidden',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                  }}>
                    <Typography
                      sx={{
                        mb: 2,
                        fontWeight: 600,
                        color: '#ffffff',
                        fontSize: '1.25rem',
                        letterSpacing: '-0.01em',
                        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      }}
                    >
                      Email Calendar Scheduling Demo
                    </Typography>
                    <Typography
                      sx={{
                        mb: 3,
                        color: '#a1a1aa',
                        lineHeight: 1.6,
                        fontSize: '0.95rem',
                        fontWeight: 400,
                        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      }}
                    >
                    See how Banbury can read your emails and schedule meetings directly from Gmail. Watch as the AI assistant understands natural language requests, checks your calendar availability, and sends out meeting invitations seamlessly.
                    </Typography>
                    <Box sx={{ 
                      position: 'relative', 
                      width: '100%', 
                      borderRadius: '12px', 
                      overflow: 'hidden',
                      flex: 1,
                      minHeight: '300px'
                    }}>
                      <video 
                        src={emailSchedulingDemo} 
                        controls 
                        muted 
                        playsInline 
                        style={{ 
                          width: '100%', 
                          height: '100%', 
                          borderRadius: '12px',
                          objectFit: 'cover'
                        }} 
                      />
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{
                    p: 3,
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: '20px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    position: 'relative',
                    overflow: 'hidden',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                  }}>
                    <Typography
                      sx={{
                        mb: 2,
                        fontWeight: 600,
                        color: '#ffffff',
                        fontSize: '1.25rem',
                        letterSpacing: '-0.01em',
                        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      }}
                    >
                      Calendar Integration Demo
                    </Typography>
                    <Typography
                      sx={{
                        mb: 3,
                        color: '#a1a1aa',
                        lineHeight: 1.6,
                        fontSize: '0.95rem',
                        fontWeight: 400,
                        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      }}
                    >
                      See how Banbury seamlessly integrates with Google Calendar. Watch as the AI assistant reads your calendar events, creates new appointments, and manages your schedule through natural language commands.
                    </Typography>
                    <Box sx={{ 
                      position: 'relative', 
                      width: '100%', 
                      borderRadius: '12px', 
                      overflow: 'hidden',
                      flex: 1,
                      minHeight: '300px'
                    }}>
                      <video 
                        src={calendarDemo} 
                        controls 
                        muted 
                        playsInline 
                        style={{ 
                          width: '100%', 
                          height: '100%', 
                          borderRadius: '12px',
                          objectFit: 'cover'
                        }} 
                      />
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{
                    p: 3,
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: '20px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    position: 'relative',
                    overflow: 'hidden',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                  }}>
                    <Typography
                      sx={{
                        mb: 2,
                        fontWeight: 600,
                        color: '#ffffff',
                        fontSize: '1.25rem',
                        letterSpacing: '-0.01em',
                        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      }}
                    >
                      Fantasy Draft Assistant
                    </Typography>
                    <Typography
                      sx={{
                        mb: 3,
                        color: '#a1a1aa',
                        lineHeight: 1.6,
                        fontSize: '0.95rem',
                        fontWeight: 400,
                        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      }}
                    >
                      Experience Banbury&apos;s AI-powered fantasy draft assistance. The AI analyzes player statistics, provides recommendations, and helps you make informed decisions during your fantasy sports drafts.
                    </Typography>
                    <Box sx={{ 
                      position: 'relative', 
                      width: '100%', 
                      borderRadius: '12px', 
                      overflow: 'hidden',
                      flex: 1,
                      minHeight: '300px'
                    }}>
                      <video 
                        src={fantasyDraftDemo} 
                        controls 
                        muted 
                        playsInline 
                        style={{ 
                          width: '100%', 
                          height: '100%', 
                          borderRadius: '12px',
                          objectFit: 'cover'
                        }} 
                      />
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{
                    p: 3,
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: '20px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    position: 'relative',
                    overflow: 'hidden',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                  }}>
                    <Typography
                      sx={{
                        mb: 2,
                        fontWeight: 600,
                        color: '#ffffff',
                        fontSize: '1.25rem',
                        letterSpacing: '-0.01em',
                        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      }}
                    >
                      Spreadsheet Intelligence
                    </Typography>
                    <Typography
                      sx={{
                        mb: 3,
                        color: '#a1a1aa',
                        lineHeight: 1.6,
                        fontSize: '0.95rem',
                        fontWeight: 400,
                        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      }}
                    >
                      Discover how Banbury&apos;s AI transforms spreadsheet workflows. Watch as it analyzes data, generates formulas, cleans datasets, and provides insights through natural language interactions.
                    </Typography>
                    <Box sx={{ 
                      position: 'relative', 
                      width: '100%', 
                      borderRadius: '12px', 
                      overflow: 'hidden',
                      flex: 1,
                      minHeight: '300px'
                    }}>
                      <video 
                        src={spreadsheetDemo} 
                        controls 
                        muted 
                        playsInline 
                        style={{ 
                          width: '100%', 
                          height: '100%', 
                          borderRadius: '12px',
                          objectFit: 'cover'
                        }} 
                      />
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </>
          )}

          {/* Features Tab */}
          {activeSection === 'features' && (
            <Container sx={{ my: 12 }}>
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography
              sx={{
                fontSize: { xs: '2rem', md: '2.75rem' },
                fontWeight: 600,
                color: '#ffffff',
                mb: 3,
                letterSpacing: '-0.02em',
                fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              }}
            >
              Powerful Banbury Features
            </Typography>
            <Typography
              sx={{
                fontSize: { xs: '1.05rem', md: '1.125rem' },
                color: '#a1a1aa',
                maxWidth: '600px',
                mx: 'auto',
                lineHeight: 1.6,
                fontWeight: 400,
                fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              }}
            >
              Discover the workflows that make Banbury your ultimate AI-powered productivity platform
            </Typography>
          </Box>

          <Grid container spacing={4} sx={{ mb: 12 }}>
            {/* Home ChatGPT Feature */}
            <Grid item xs={12} md={4}>
              <Box
                sx={{
                  p: 6,
                  height: '100%',
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: '20px',
                  border: '1px solid rgba(255,255,255,0.08)',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  overflow: 'hidden',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    background: 'rgba(255, 255, 255, 0.05)',
                  },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '1px',
                    background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)',
                  },
                }}
              >
                <Box
                  sx={{
                    mb: 3,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ChatIcon
                    sx={{
                      fontSize: '3rem',
                      color: '#a1a1aa',
                      p: 1.5,
                      borderRadius: '12px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                  />
                </Box>
                <Typography
                  sx={{
                    mb: 3,
                    fontWeight: 600,
                    color: '#ffffff',
                    fontSize: '1.25rem',
                    letterSpacing: '-0.01em',
                    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  }}
                >
                  ChatGPT-Style Interface
                </Typography>
                <Typography
                  sx={{
                    color: '#a1a1aa',
                    lineHeight: 1.6,
                    fontSize: '0.95rem',
                    fontWeight: 400,
                    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  }}
                >
                  Start with our intuitive home page - ask quick questions and get intelligent responses, just like ChatGPT but integrated with your workspace.
                </Typography>
              </Box>
            </Grid>

            {/* Workspaces Feature */}
            <Grid item xs={12} md={4}>
              <Box
                sx={{
                  p: 6,
                  height: '100%',
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: '20px',
                  border: '1px solid rgba(255,255,255,0.08)',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  overflow: 'hidden',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    background: 'rgba(255, 255, 255, 0.05)',
                  },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '1px',
                    background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)',
                  },
                }}
              >
                <Box
                  sx={{
                    mb: 3,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <FolderIcon
                    sx={{
                      fontSize: '3rem',
                      color: '#a1a1aa',
                      p: 1.5,
                      borderRadius: '12px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                  />
                </Box>
                <Typography
                  sx={{
                    mb: 3,
                    fontWeight: 600,
                    color: '#ffffff',
                    fontSize: '1.25rem',
                    letterSpacing: '-0.01em',
                    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  }}
                >
                  Smart Workspaces
                </Typography>
                <Typography
                  sx={{
                    color: '#a1a1aa',
                    lineHeight: 1.6,
                    fontSize: '0.95rem',
                    fontWeight: 400,
                    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  }}
                >
                  View and manage your files while the AI assistant in the right panel interacts with your documents to perform intelligent workflows.
                </Typography>
              </Box>
            </Grid>

            {/* Document Creation Feature */}
            <Grid item xs={12} md={4}>
              <Box
                sx={{
                  p: 6,
                  height: '100%',
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: '20px',
                  border: '1px solid rgba(255,255,255,0.08)',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  overflow: 'hidden',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    background: 'rgba(255, 255, 255, 0.05)',
                  },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '1px',
                    background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)',
                  },
                }}
              >
                <Box
                  sx={{
                    mb: 3,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <AddCircleOutlineIcon
                    sx={{
                      fontSize: '3rem',
                      color: '#a1a1aa',
                      p: 1.5,
                      borderRadius: '12px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                  />
                </Box>
                <Typography
                  sx={{
                    mb: 3,
                    fontWeight: 600,
                    color: '#ffffff',
                    fontSize: '1.25rem',
                    letterSpacing: '-0.01em',
                    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  }}
                >
                  Create & Upload
                </Typography>
                <Typography
                  sx={{
                    color: '#a1a1aa',
                    lineHeight: 1.6,
                    fontSize: '0.95rem',
                    fontWeight: 400,
                    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  }}
                >
                  Create documents, spreadsheets, folders, or upload existing files. Our full word editor gives you complete control over your content.
                </Typography>
              </Box>
            </Grid>

            {/* Internet Search Feature */}
            <Grid item xs={12} md={6}>
        <Box
          sx={{
                  p: 6,
                  height: '100%',
                  background: 'rgba(59, 130, 246, 0.1)',
                  borderRadius: '20px',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  overflow: 'hidden',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    background: 'rgba(59, 130, 246, 0.15)',
                  },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '1px',
                    background: 'linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.3), transparent)',
                  },
                }}
              >
                <Box
                  sx={{
                    mb: 3,
            display: 'flex',
            alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                                    <SearchIcon
                    sx={{
                      fontSize: '3rem',
                      color: '#60a5fa',
                      p: 1.5,
                      borderRadius: '12px',
                      background: 'rgba(59, 130, 246, 0.1)',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                    }}
                  />
                </Box>
                <Typography
                  sx={{
                    mb: 3,
                    fontWeight: 600,
                    color: '#ffffff',
                    fontSize: '1.4rem',
                    letterSpacing: '-0.01em',
                    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  }}
                >
                  Intelligent Internet Research
                </Typography>
                <Typography
                  sx={{
                    color: '#e2e8f0',
                    lineHeight: 1.6,
                    fontSize: '1rem',
                    fontWeight: 400,
                    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  }}
                >
                  Simply ask &ldquo;search the internet for latest NFL news and place a summary in this document&rdquo; and watch as Banbury 
                  searches multiple sources, analyzes the content, and automatically populates your document with comprehensive findings.
                </Typography>
        </Box>
            </Grid>

            {/* Beta Signup Feature */}
            <Grid item xs={12} md={6}>
        <Box
          sx={{
                  p: 6,
                  height: '100%',
                  background: 'rgba(34, 197, 94, 0.1)',
                  borderRadius: '20px',
                  border: '1px solid rgba(34, 197, 94, 0.2)',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  overflow: 'hidden',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                    background: 'rgba(34, 197, 94, 0.15)',
                  },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '1px',
                    background: 'linear-gradient(90deg, transparent, rgba(34, 197, 94, 0.3), transparent)',
                  },
                }}
              >
                <Box
                  sx={{
                    mb: 3,
            display: 'flex',
            alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <RocketLaunchIcon
                    sx={{
                      fontSize: '3rem',
                      color: '#4ade80',
                      p: 1.5,
                      borderRadius: '12px',
                      background: 'rgba(34, 197, 94, 0.1)',
                      border: '1px solid rgba(34, 197, 94, 0.3)',
                    }}
                  />
                </Box>
                <Typography
                  sx={{
                    mb: 3,
                    fontWeight: 600,
                    color: '#ffffff',
                    fontSize: '1.4rem',
                    letterSpacing: '-0.01em',
                    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  }}
                >
                  Free Beta Access
                </Typography>
                <Typography
                  sx={{
                    color: '#e2e8f0',
                    lineHeight: 1.6,
                    fontSize: '1rem',
                    fontWeight: 400,
                    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  }}
                >
                  Join our beta program today - completely free! Experience the future of AI-powered document workflows 
                  and help us shape the platform with your valuable feedback.
                </Typography>
        </Box>
            </Grid>
          </Grid>

          {/* Editors Section */}
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography
              sx={{
                fontSize: { xs: '1.75rem', md: '2.25rem' },
                fontWeight: 600,
                color: '#ffffff',
                mb: 2,
                letterSpacing: '-0.02em',
                fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              }}
            >
              Editors Built For Work
            </Typography>
            <Typography
              sx={{
                fontSize: { xs: '1rem', md: '1.05rem' },
                color: '#a1a1aa',
                maxWidth: '700px',
                mx: 'auto',
                lineHeight: 1.6,
                fontWeight: 400,
                fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              }}
            >
              Create and edit rich documents and data sheets with real-time AI assistance.
            </Typography>
          </Box>
          <Grid container spacing={4} sx={{ mb: 12 }}>
            <Grid item xs={12} md={6}>
              <Box sx={{
                p: 6,
                height: '100%',
                background: 'rgba(255,255,255,0.02)',
                borderRadius: '20px',
                border: '1px solid rgba(255,255,255,0.08)',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'hidden',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  background: 'rgba(255, 255, 255, 0.05)',
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '1px',
                  background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)',
                },
              }}>
                <Typography sx={{ mb: 3, fontWeight: 600, color: '#ffffff', fontSize: '1.25rem', letterSpacing: '-0.01em', fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                  Document Editor
                </Typography>
                <Typography sx={{ color: '#a1a1aa', lineHeight: 1.6, fontSize: '0.95rem', fontWeight: 400, fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                  A full-featured word processor with styles, images, and collaborative-ready structure. Ask the AI to draft, rewrite, or summarize within the editor.
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{
                p: 6,
                height: '100%',
                background: 'rgba(255,255,255,0.02)',
                borderRadius: '20px',
                border: '1px solid rgba(255,255,255,0.08)',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'hidden',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  background: 'rgba(255, 255, 255, 0.05)',
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '1px',
                  background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)',
                },
              }}>
                <Typography sx={{ mb: 3, fontWeight: 600, color: '#ffffff', fontSize: '1.25rem', letterSpacing: '-0.01em', fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                  Spreadsheet Editor
                </Typography>
                <Typography sx={{ color: '#a1a1aa', lineHeight: 1.6, fontSize: '0.95rem', fontWeight: 400, fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                  Manage data with formulas and formatting. Let the AI clean data, generate formulas, and explain computations inline.
                </Typography>
              </Box>
            </Grid>
          </Grid>

          {/* AI Capabilities */}
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography
              sx={{
                fontSize: { xs: '1.75rem', md: '2.25rem' },
                fontWeight: 600,
                color: '#ffffff',
                mb: 2,
                letterSpacing: '-0.02em',
                fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              }}
            >
              AI Features
            </Typography>
            <Typography
              sx={{
                fontSize: { xs: '1rem', md: '1.05rem' },
                color: '#a1a1aa',
                maxWidth: '700px',
                mx: 'auto',
                lineHeight: 1.6,
                fontWeight: 400,
                fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              }}
            >
              Powerful intelligence across chat, documents, and spreadsheets.
            </Typography>
          </Box>
          <Grid container spacing={4} sx={{ mb: 12 }}>
            <Grid item xs={12} md={4}>
              <Box sx={{ p: 6, height: '100%', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)', transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)', position: 'relative', overflow: 'hidden', '&:hover': { transform: 'translateY(-8px)', border: '1px solid rgba(255, 255, 255, 0.15)', background: 'rgba(255, 255, 255, 0.05)' }, '&::before': { content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)' } }}>
                <Typography sx={{ mb: 3, fontWeight: 600, color: '#ffffff', fontSize: '1.25rem', letterSpacing: '-0.01em', fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                  AI Memory
                </Typography>
                <Typography sx={{ color: '#a1a1aa', lineHeight: 1.6, fontSize: '0.95rem', fontWeight: 400, fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                  The assistant remembers key facts and preferences to personalize help across sessions.
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ p: 6, height: '100%', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)', transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)', position: 'relative', overflow: 'hidden', '&:hover': { transform: 'translateY(-8px)', border: '1px solid rgba(255, 255, 255, 0.15)', background: 'rgba(255, 255, 255, 0.05)' }, '&::before': { content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)' } }}>
                <Typography sx={{ mb: 3, fontWeight: 600, color: '#ffffff', fontSize: '1.25rem', letterSpacing: '-0.01em', fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                  AI Document Editing
                </Typography>
                <Typography sx={{ color: '#a1a1aa', lineHeight: 1.6, fontSize: '0.95rem', fontWeight: 400, fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                  Rewrite, expand, translate, and summarize selections directly in your docs.
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ p: 6, height: '100%', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)', transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)', position: 'relative', overflow: 'hidden', '&:hover': { transform: 'translateY(-8px)', border: '1px solid rgba(255, 255, 255, 0.15)', background: 'rgba(255, 255, 255, 0.05)' }, '&::before': { content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)' } }}>
                <Typography sx={{ mb: 3, fontWeight: 600, color: '#ffffff', fontSize: '1.25rem', letterSpacing: '-0.01em', fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                  AI Spreadsheet Editing
                </Typography>
                <Typography sx={{ color: '#a1a1aa', lineHeight: 1.6, fontSize: '0.95rem', fontWeight: 400, fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                  Clean data, generate formulas, and automate transformations with natural language.
                </Typography>
              </Box>
            </Grid>
          </Grid>

          {/* Storage and Email */}
          <Grid container spacing={4} sx={{ mb: 12 }}>
            <Grid item xs={12} md={6}>
              <Box sx={{ p: 6, height: '100%', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)', transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)', position: 'relative', overflow: 'hidden', '&:hover': { transform: 'translateY(-8px)', border: '1px solid rgba(255, 255, 255, 0.15)', background: 'rgba(255, 255, 255, 0.05)' }, '&::before': { content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)' } }}>
                <Typography sx={{ mb: 3, fontWeight: 600, color: '#ffffff', fontSize: '1.25rem', letterSpacing: '-0.01em', fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                  Cloud File Storage
                </Typography>
                <Typography sx={{ color: '#a1a1aa', lineHeight: 1.6, fontSize: '0.95rem', fontWeight: 400, fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                  Organize and secure your documents and spreadsheets in the cloud with seamless access across devices.
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ p: 6, height: '100%', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)', transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)', position: 'relative', overflow: 'hidden', '&:hover': { transform: 'translateY(-8px)', border: '1px solid rgba(255, 255, 255, 0.15)', background: 'rgba(255, 255, 255, 0.05)' }, '&::before': { content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)' } }}>
                <Typography sx={{ mb: 3, fontWeight: 600, color: '#ffffff', fontSize: '1.25rem', letterSpacing: '-0.01em', fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                  Read & Write Emails
                </Typography>
                <Typography sx={{ color: '#a1a1aa', lineHeight: 1.6, fontSize: '0.95rem', fontWeight: 400, fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                  Pull in Gmail, draft replies, and insert messages into documents to keep work and communication connected.
                </Typography>
              </Box>
            </Grid>
          </Grid>

          {/* Technical Features */}
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography
              sx={{
                fontSize: { xs: '1.75rem', md: '2.25rem' },
                fontWeight: 600,
                color: '#ffffff',
                mb: 2,
                letterSpacing: '-0.02em',
                fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              }}
            >
              Technical Features
            </Typography>
            <Typography
              sx={{
                fontSize: { xs: '1rem', md: '1.05rem' },
                color: '#a1a1aa',
                maxWidth: '800px',
                mx: 'auto',
                lineHeight: 1.6,
                fontWeight: 400,
                fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              }}
            >
              Built with robust architecture for reliability, security, and scale.
            </Typography>
          </Box>
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Box sx={{ p: 6, height: '100%', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)', transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)', position: 'relative', overflow: 'hidden', '&:hover': { transform: 'translateY(-8px)', border: '1px solid rgba(255, 255, 255, 0.15)', background: 'rgba(255, 255, 255, 0.05)' }, '&::before': { content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)' } }}>
                <Typography sx={{ mb: 1.5, fontWeight: 600, color: '#ffffff', fontSize: '1.15rem' }}>LangGraph Orchestration</Typography>
                <Typography sx={{ color: '#a1a1aa' }}>Multi-step reasoning and reliable tool execution.</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ p: 6, height: '100%', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)', transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)', position: 'relative', overflow: 'hidden', '&:hover': { transform: 'translateY(-8px)', border: '1px solid rgba(255, 255, 255, 0.15)', background: 'rgba(255, 255, 255, 0.05)' }, '&::before': { content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)' } }}>
                <Typography sx={{ mb: 1.5, fontWeight: 600, color: '#ffffff', fontSize: '1.15rem' }}>React-Agent Pattern</Typography>
                <Typography sx={{ color: '#a1a1aa' }}>Responsive loops for tool calling and UI updates.</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ p: 6, height: '100%', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)', transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)', position: 'relative', overflow: 'hidden', '&:hover': { transform: 'translateY(-8px)', border: '1px solid rgba(255, 255, 255, 0.15)', background: 'rgba(255, 255, 255, 0.05)' }, '&::before': { content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)' } }}>
                <Typography sx={{ mb: 1.5, fontWeight: 600, color: '#ffffff', fontSize: '1.15rem' }}>Error Handling</Typography>
                <Typography sx={{ color: '#a1a1aa' }}>Graceful fallbacks with rate limiting protections.</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ p: 6, height: '100%', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)', transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)', position: 'relative', overflow: 'hidden', '&:hover': { transform: 'translateY(-8px)', border: '1px solid rgba(255, 255, 255, 0.15)', background: 'rgba(255, 255, 255, 0.05)' }, '&::before': { content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)' } }}>
                <Typography sx={{ mb: 1.5, fontWeight: 600, color: '#ffffff', fontSize: '1.15rem' }}>Token Management</Typography>
                <Typography sx={{ color: '#a1a1aa' }}>Automatic truncation to keep interactions snappy.</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ p: 6, height: '100%', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)', transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)', position: 'relative', overflow: 'hidden', '&:hover': { transform: 'translateY(-8px)', border: '1px solid rgba(255, 255, 255, 0.15)', background: 'rgba(255, 255, 255, 0.05)' }, '&::before': { content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)' } }}>
                <Typography sx={{ mb: 1.5, fontWeight: 600, color: '#ffffff', fontSize: '1.15rem' }}>Authentication</Typography>
                <Typography sx={{ color: '#a1a1aa' }}>Secure token-based access across tools and APIs.</Typography>
              </Box>
            </Grid>
          </Grid>

          

          </Container>
          )}
          {/* Integrations Tab */}
          {activeSection === 'integrations' && (
            <Container sx={{ my: 12 }}>
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography
              sx={{
                fontSize: { xs: '2rem', md: '2.75rem' },
                fontWeight: 600,
                color: '#ffffff',
                mb: 3,
                letterSpacing: '-0.02em',
                fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              }}
            >
              Seamless Integrations
            </Typography>
            <Typography
              sx={{
                fontSize: { xs: '1.05rem', md: '1.125rem' },
                color: '#a1a1aa',
                maxWidth: '700px',
                mx: 'auto',
                lineHeight: 1.6,
                fontWeight: 400,
                fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              }}
            >
              Connect with your favorite Google services. Banbury integrates with the platforms you already use, 
              making your workflow more efficient and productive than ever before.
            </Typography>
          </Box>

          <Grid container spacing={4} sx={{ mb: 8 }}>
            {/* Gmail Integration */}
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  p: 6,
                  height: '100%',
                  background: 'rgba(59, 130, 246, 0.1)',
                  borderRadius: '20px',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  overflow: 'hidden',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    background: 'rgba(59, 130, 246, 0.15)',
                  },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '1px',
                    background: 'linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.3), transparent)',
                  },
                }}
              >
                <Box
                  sx={{
                    mb: 3,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Image src={gmailLogo} alt="Gmail Logo" width={100} height={100} />
                </Box>
                <Typography
                  sx={{
                    mb: 3,
                    fontWeight: 600,
                    color: '#ffffff',
                    fontSize: '1.4rem',
                    letterSpacing: '-0.01em',
                    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  }}
                >
                  Gmail Integration
                </Typography>
                <Typography
                  sx={{
                    color: '#e2e8f0',
                    lineHeight: 1.6,
                    fontSize: '1rem',
                    fontWeight: 400,
                    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    mb: 3,
                  }}
                >
                  Seamlessly integrate with Gmail to access your emails, compose messages, and manage your inbox 
                  directly from Banbury. Import email content into your documents and streamline your communication workflow.
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  <Box
                    sx={{
                      px: 2,
                      py: 1,
                      borderRadius: '20px',
                      background: 'rgba(59, 130, 246, 0.2)',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      fontSize: '0.875rem',
                      color: '#60a5fa',
                      fontWeight: 500,
                    }}
                  >
                    Gmail
                  </Box>
                </Box>
              </Box>
            </Grid>

            {/* Google Calendar Integration */}
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  p: 6,
                  height: '100%',
                  background: 'rgba(168, 85, 247, 0.1)',
                  borderRadius: '20px',
                  border: '1px solid rgba(168, 85, 247, 0.2)',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  overflow: 'hidden',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    border: '1px solid rgba(168, 85, 247, 0.3)',
                    background: 'rgba(168, 85, 247, 0.15)',
                  },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '1px',
                    background: 'linear-gradient(90deg, transparent, rgba(168, 85, 247, 0.3), transparent)',
                  },
                }}
              >
                <Box
                  sx={{
                    mb: 3,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Image src={googleCalendarLogo} alt="Google Calendar Logo" width={100} height={100} />
                </Box>
                <Typography
                  sx={{
                    mb: 3,
                    fontWeight: 600,
                    color: '#ffffff',
                    fontSize: '1.4rem',
                    letterSpacing: '-0.01em',
                    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  }}
                >
                  Google Calendar Integration
                </Typography>
                <Typography
                  sx={{
                    color: '#e2e8f0',
                    lineHeight: 1.6,
                    fontSize: '1rem',
                    fontWeight: 400,
                    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    mb: 3,
                  }}
                >
                  Connect with Google Calendar to view your schedule, create events, and manage appointments 
                  directly within Banbury. Sync your calendar data with your documents for better time management.
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  <Box
                    sx={{
                      px: 2,
                      py: 1,
                      borderRadius: '20px',
                      background: 'rgba(168, 85, 247, 0.2)',
                      border: '1px solid rgba(168, 85, 247, 0.3)',
                      fontSize: '0.875rem',
                      color: '#a855f7',
                      fontWeight: 500,
                    }}
                  >
                    Google Calendar
                  </Box>
                </Box>
              </Box>
            </Grid>
          </Grid>

          <Box sx={{ textAlign: 'center' }}>
            <Typography
              sx={{
                fontSize: { xs: '1rem', md: '1.125rem' },
                color: '#a1a1aa',
                maxWidth: '600px',
                mx: 'auto',
                lineHeight: 1.6,
                fontWeight: 400,
                fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              }}
            >
              More integrations coming soon! Our API is open and extensible. 
              Build custom integrations or request new ones through our developer portal.
            </Typography>
          </Box>
          </Container>
          )}

          {/* Products Tab */}
          {activeSection === 'products' && (
            <Container sx={{ mt: 8 }}>
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography
              sx={{
                fontSize: { xs: '2rem', md: '2.75rem' },
                fontWeight: 600,
                color: '#ffffff',
                mb: 3,
                letterSpacing: '-0.02em',
                fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              }}
            >
              Our Products
            </Typography>
            <Typography
              sx={{
                fontSize: { xs: '1.05rem', md: '1.125rem' },
                color: '#a1a1aa',
                maxWidth: '600px',
                mx: 'auto',
                lineHeight: 1.6,
                fontWeight: 400,
                fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              }}
            >
              Discover our suite of AI-powered products designed to enhance your productivity
            </Typography>
          </Box>
          <Grid container spacing={4}>
            {products.map((item: ProductsProps, index: number) => (
              <Grid item xs={12} sm={6} key={index}>
                <Box
                  component={Card}
                  sx={{
                    p: 6,
                    height: '100%',
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: '20px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    overflow: 'hidden',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      background: 'rgba(255, 255, 255, 0.05)',
                    },
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '1px',
                      background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)',
                    },
                  }}
                >
                  <Box display='flex' flexDirection='column'>
                    <Typography
                      sx={{
                        mb: 2,
                        fontWeight: 600,
                        color: '#ffffff',
                        fontSize: '1.25rem',
                        letterSpacing: '-0.01em',
                        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      }}
                    >
                      {item.name}
                    </Typography>
                    <Typography 
                      sx={{
                        color: '#a1a1aa',
                        lineHeight: 1.6,
                        fontSize: '0.95rem',
                        fontWeight: 400,
                        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      }}
                    >
                      {item.description}
                    </Typography>
                  </Box>
                  <Box display='block' width={1} height={1}>
                    <CardMedia
                      title=''
                      image={item.image}
                      sx={{
                        position: 'relative',
                        height: 320,
                        overflow: 'hidden',
                        borderRadius: 2,
                        filter: 'brightness(0.7)',
                        marginTop: 4,
                      }}
                    />
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
          </Container>
          )}
        </Box>
      </Box>
    </Box>
    </>
  );
};

export default Features;
