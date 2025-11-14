import React from 'react';
import CloudIcon from '@mui/icons-material/Cloud';
import DevicesIcon from '@mui/icons-material/Devices';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import { Box, Container, Grid } from '@mui/material';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import DemoApp from './components/DemoApp';
import EmailDemo from '../../assets/images/email_demo.png';
import CalendarDemo from '../../assets/images/calendar_demo.mp4';
import SpreadsheetDemo from '../../assets/images/spreadsheet_demo.mp4';
import BrowserDemo from '../../assets/images/browser-automation-demo.mp4';
import TaskCreationDemo from '../../assets/images/task-creation-demo.mp4';
import DiffViewDemo from '../../assets/images/diff-view.mp4';
import { Button } from '../../components/ui/button';
import { Typography } from '../../components/ui/typography';
import { determineOS } from '../../handlers/determineOS';
import { handleDownload } from '../handlers/home'
import {
  GmailIcon,
  GoogleDocsIcon,
  GoogleSheetsIcon,
  GoogleCalendarIcon,
  OutlookIcon,
  TwitterIcon,
  ZoomIcon,
  GoogleMeetIcon,
  SlackIcon,
  NotionIcon,
  GitHubIcon
} from '../../components/icons';
// Tracking handled globally in pages/_app.tsx via routeTracking handler

const Home = (): JSX.Element => {
  const [downloadText, setDownloadText] = useState<string>('Download');
  const [downloadUrl, setDownloadUrl] = useState<string>('');

  const stats = [
    { value: '10M+', label: 'Tasks Automated' },
    { value: '99.99%', label: 'Uptime' },
    { value: 'Unlimited', label: 'Cloud Storage' },
    { value: '24/7', label: 'Support' }
  ];

  const features = [
    {
      icon: <CloudIcon sx={{ fontSize: { xs: 40, md: 48 }, color: '#71717a' }} />,
      title: 'AI-Powered Automation',
      description: 'Intelligent workflows that adapt and optimize themselves, reducing manual work by up to 80%.',
      highlight: 'Save 20+ hours/week'
    },
    {
      icon: <DevicesIcon sx={{ fontSize: { xs: 40, md: 48 }, color: '#71717a' }} />,
      title: 'Lightning Fast Processing',
      description: 'Process thousands of operations per second with our optimized cloud infrastructure.',
      highlight: '< 100ms response time'
    },
    {
      icon: <FlashOnIcon sx={{ fontSize: { xs: 40, md: 48 }, color: '#71717a' }} />,
      title: 'Customer-Driven Development',
      description: 'We listen to your feedback and rapidly build the features you need. Your requests shape our roadmap.',
      highlight: 'Feature requests delivered fast'
    }
  ];

  useEffect(() => {
    determineOS(setDownloadText, setDownloadUrl);
  }, []);

  // Page tracking is handled globally; no local tracking here

  const fadeInUp = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <Box sx={{ overflow: 'hidden', overflowY: 'auto', background: '#000000', width: '100%', maxWidth: '100vw' }}>
      {/* Hero Section */}
      <Box
        sx={{
          minHeight: { xs: '70vh', lg: '85vh' },
          display: 'flex',
          alignItems: 'flex-start',
          position: 'relative',
          overflow: 'visible',
          pt: { xs: 4, sm: 6, lg: 8 },
          pb: { xs: 0, lg: 0 },
          background: '#000000',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `
              linear-gradient(rgba(255, 255, 255, 0.025) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.025) 1px, transparent 1px)
            `,
            backgroundSize: { xs: '20px 20px', md: '40px 40px' },
            opacity: 0.25,
            zIndex: 0,
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            top: '-10%',
            right: '-20%',
            width: '70vw',
            height: '70vw',
            background: 'radial-gradient(closest-side, rgba(255,255,255,0.08), rgba(255,255,255,0.03) 35%, rgba(0,0,0,0) 70%)',
            filter: 'blur(40px)',
            zIndex: 0,
          },
        }}
      >
        <Container maxWidth={false} sx={{
          overflow: 'visible',
          px: { xs: 3, sm: 4, lg: 0 },
          width: { xs: '100%', lg: '86%' },
          mx: 'auto'
        }}>
          <Grid 
            container 
            spacing={{ xs: 0, sm: 2, lg: 4, xl: 6 }} 
            alignItems="center"
            justifyContent="flex-start"
            sx={{ 
              position: 'relative',
              minHeight: { xs: '20vh', lg: '70vh' },
              overflow: 'visible',
              width: '100%'
            }}
          >
            {/* Text Content */}
            <Grid item xs={12} sm={12} lg={12} xl={12} sx={{ 
              position: 'relative', 
              zIndex: 2, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              pl: { xs: 0, lg: 2, xl: 2 },
              pr: { xs: 0, lg: 3, xl: 3 },
              order: { xs: 1, sm: 1, lg: 1, xl: 1 }
            }}>
              <Box sx={{
                pr: { lg: 6, xl: 6 },
                mb: { xs: 0, sm: 3, lg: 2, xl: 2 },
                pt: { xs: 2, sm: 2, lg: 3, xl: 4 },
                textAlign: 'center',
                maxWidth: { xs: '100%', sm: '100%', lg: '760px', xl: '860px' },
                ml: { xs: 0, sm: 0, lg: 0, xl: 0 }
              }}>
                <motion.div
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.3 }}
                  variants={fadeInUp}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                >
                  <Typography variant="h1" className="mb-4 md:mb-8">
                    Your AI-Powered <br />
                    <span className="text-white">
                      Workflow Engine
                    </span>
                  </Typography>
                </motion.div>

                <motion.div
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.3 }}
                  variants={fadeInUp}
                  transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
                >
                  <Typography variant="lead" className="text-zinc-400 leading-relaxed mb-3 md:mb-7 max-w-2xl text-base sm:text-lg md:text-xl px-2 md:px-0">
                    Transform your business operations with intelligent automation that learns, adapts, and scales with your needs.
                  </Typography>
                </motion.div>

                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: { xs: 'column', sm: 'row' }, 
                  gap: { xs: 1.5, sm: 3 }, 
                  mb: { xs: 0, md: 0 },
                  justifyContent: 'center',
                  px: { xs: 2, md: 0 }
                }}>
                  <Button
                    variant="default"
                    size="lg"
                    onClick={() => window.location.href = '/register'}
                  >
                    Get Started for Free
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => window.location.href = '/features'}
                    className="rounded-full px-5 md:px-6"
                    style={{
                      borderRadius: 9999,
                      background: 'transparent',
                      border: '1px solid rgba(255,255,255,0.12)',
                      color: 'rgba(255,255,255,0.85)'
                    }}
                  >
                    Watch Demo
                  </Button>
                </Box>
              </Box>
            </Grid>


            {/* Image - Beneath Hero Text */}
            <Grid item xs={12} sm={12} lg={12} xl={12} sx={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: { xs: 0, lg: 0, xl: 0 },
              overflow: 'visible',
              order: { xs: 2, sm: 2, lg: 2, xl: 2 },
            }}>
              {/* Gradient backdrop for depth */}
              <Box
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: { xs: '100%', md: '95%', lg: '90%' },
                  height: { xs: '80%', lg: '90%' },
                  background: 'radial-gradient(ellipse at center, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.02) 40%, transparent 100%)',
                  borderRadius: '50%',
                  filter: 'blur(80px)',
                  zIndex: 0,
                }}
              />
              
              <DemoApp />
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Integrations Section */}
      <Box sx={{ pt: { xs: 8, sm: 10, md: 12, lg: 16 }, pb: { xs: 1, md: 1 }, background: '#000000', position: 'relative', zIndex: 10 }}>
        <Box sx={{ width: '100%' }}>
          {/* Section Header */}
          <Box sx={{ textAlign: 'center', mb: { xs: 6, md: 8 }, px: { xs: 2, md: 0 } }}>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={fadeInUp}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            >
              <Typography variant="h2" className="text-3xl sm:text-4xl md:text-5xl mb-4 md:mb-6">
                Powerful Integrations
              </Typography>
            </motion.div>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={fadeInUp}
              transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
            >
              <Typography variant="lead" className="text-base sm:text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed px-4 md:px-0">
                Connect with your favorite tools and services. Seamlessly integrate with the platforms you already use to supercharge your workflow.
              </Typography>
            </motion.div>
          </Box>

          {/* Integrations Auto-Scroll */}
          <Box sx={{ 
            position: 'relative', 
            mb: 8,
            overflow: 'visible',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              width: '50px',
              height: '100%',
              background: 'linear-gradient(90deg, #000000 0%, transparent 100%)',
              zIndex: 10,
              pointerEvents: 'none'
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              top: 0,
              right: 0,
              width: '50px',
              height: '100%',
              background: 'linear-gradient(270deg, #000000 0%, transparent 100%)',
              zIndex: 10,
              pointerEvents: 'none'
            }
          }}>
            <Box 
              sx={{ 
                display: 'flex',
                animation: 'scroll 30s linear infinite',
                '@keyframes scroll': {
                  '0%': { transform: 'translateX(0)' },
                  '100%': { transform: 'translateX(-50%)' }
                },
                '&:hover': {
                  animationPlayState: 'paused'
                }
              }}
            >
                {/* Gmail */}
                <Box sx={{ 
                  minWidth: { xs: '280px', md: '320px', lg: '350px' },
                  flexShrink: 0,
                  px: 2
                }}>
                  <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.3 }}
                    variants={fadeInUp}
                    transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
                  >
                    <Box
                      sx={{
                        p: 4,
                        height: '200px',
                        background: 'rgba(0, 0, 0, 0.3)',
                        borderRadius: '20px',
                        border: '2px solid rgba(255, 255, 255, 0.1)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                        backdropFilter: 'blur(10px)',
                        position: 'relative',
                        overflow: 'visible',
                        '&:hover': {
                          transform: 'translateY(-8px) scale(1.02)',
                          background: 'rgba(0, 0, 0, 0.5)',
                          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
                          border: '2px solid rgba(255, 255, 255, 0.2)',
                        },
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: '1px',
                          background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
                        },
                      }}
                    >
                      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <GmailIcon size={48} />
                      </Box>
                    </Box>
                  </motion.div>
                </Box>

                {/* Google Docs */}
                <Box sx={{ 
                  minWidth: { xs: '280px', md: '320px', lg: '350px' },
                  flexShrink: 0,
                  px: 2
                }}>
                  <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.3 }}
                    variants={fadeInUp}
                    transition={{ duration: 0.5, ease: 'easeOut', delay: 0.15 }}
                  >
                    <Box
                      sx={{
                        p: 4,
                        height: '200px',
                        background: 'rgba(0, 0, 0, 0.3)',
                        borderRadius: '20px',
                        border: '2px solid rgba(255, 255, 255, 0.1)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                        backdropFilter: 'blur(10px)',
                        position: 'relative',
                        overflow: 'visible',
                        '&:hover': {
                          transform: 'translateY(-8px) scale(1.02)',
                          background: 'rgba(0, 0, 0, 0.5)',
                          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
                          border: '2px solid rgba(255, 255, 255, 0.2)',
                        },
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: '1px',
                          background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
                        },
                      }}
                    >
                      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
                        <GoogleDocsIcon size={48} />
                      </Box>
                    </Box>
                  </motion.div>
                </Box>

                {/* Google Sheets */}
                <Box sx={{ 
                  minWidth: { xs: '280px', md: '320px', lg: '350px' },
                  flexShrink: 0,
                  px: 2
                }}>
                  <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.3 }}
                    variants={fadeInUp}
                    transition={{ duration: 0.5, ease: 'easeOut', delay: 0.2 }}
                  >
                    <Box
                      sx={{
                        p: 4,
                        height: '200px',
                        background: 'rgba(0, 0, 0, 0.3)',
                        borderRadius: '20px',
                        border: '2px solid rgba(255, 255, 255, 0.1)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                        backdropFilter: 'blur(10px)',
                        position: 'relative',
                        overflow: 'visible',
                        '&:hover': {
                          transform: 'translateY(-8px) scale(1.02)',
                          background: 'rgba(0, 0, 0, 0.5)',
                          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
                          border: '2px solid rgba(255, 255, 255, 0.2)',
                        },
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: '1px',
                          background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
                        },
                      }}
                    >
                      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
                        <GoogleSheetsIcon size={48} />
                      </Box>
                    </Box>
                  </motion.div>
                </Box>


                {/* Outlook */}
                <Box sx={{ 
                  minWidth: { xs: '280px', md: '320px', lg: '350px' },
                  flexShrink: 0,
                  px: 2
                }}>
                  <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.3 }}
                    variants={fadeInUp}
                    transition={{ duration: 0.5, ease: 'easeOut', delay: 0.3 }}
                  >
                    <Box
                      sx={{
                        p: 4,
                        height: '200px',
                        background: 'rgba(0, 0, 0, 0.3)',
                        borderRadius: '20px',
                        border: '2px solid rgba(255, 255, 255, 0.1)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                        backdropFilter: 'blur(10px)',
                        position: 'relative',
                        overflow: 'visible',
                        '&:hover': {
                          transform: 'translateY(-8px) scale(1.02)',
                          background: 'rgba(0, 0, 0, 0.5)',
                          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
                          border: '2px solid rgba(255, 255, 255, 0.2)',
                        },
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: '1px',
                          background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
                        },
                      }}
                    >
                      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
                        <OutlookIcon size={48} />
                      </Box>
                    </Box>
                  </motion.div>
                </Box>

                {/* X (Twitter) */}
                <Box sx={{ 
                  minWidth: { xs: '280px', md: '320px', lg: '350px' },
                  flexShrink: 0,
                  px: 2
                }}>
                  <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.3 }}
                    variants={fadeInUp}
                    transition={{ duration: 0.5, ease: 'easeOut', delay: 0.35 }}
                  >
                    <Box
                      sx={{
                        p: 4,
                        height: '200px',
                        background: 'rgba(0, 0, 0, 0.3)',
                        borderRadius: '20px',
                        border: '2px solid rgba(255, 255, 255, 0.1)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                        backdropFilter: 'blur(10px)',
                        position: 'relative',
                        overflow: 'visible',
                        '&:hover': {
                          transform: 'translateY(-8px) scale(1.02)',
                          background: 'rgba(0, 0, 0, 0.5)',
                          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
                          border: '2px solid rgba(255, 255, 255, 0.2)',
                        },
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: '1px',
                          background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
                        },
                      }}
                    >
                      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
                        <TwitterIcon size={48} />
                      </Box>
                    </Box>
                  </motion.div>
                </Box>

                {/* Slack */}
                <Box sx={{ 
                  minWidth: { xs: '280px', md: '320px', lg: '350px' },
                  flexShrink: 0,
                  px: 2
                }}>
                  <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.3 }}
                    variants={fadeInUp}
                    transition={{ duration: 0.5, ease: 'easeOut', delay: 0.4 }}
                  >
                    <Box
                      sx={{
                        p: 4,
                        height: '200px',
                        background: 'rgba(0, 0, 0, 0.3)',
                        borderRadius: '20px',
                        border: '2px solid rgba(255, 255, 255, 0.1)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                        backdropFilter: 'blur(10px)',
                        position: 'relative',
                        overflow: 'visible',
                        '&:hover': {
                          transform: 'translateY(-8px) scale(1.02)',
                          background: 'rgba(0, 0, 0, 0.5)',
                          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
                          border: '2px solid rgba(255, 255, 255, 0.2)',
                        },
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: '1px',
                          background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
                        },
                      }}
                    >
                      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
                        <SlackIcon size={48} />
                      </Box>
                    </Box>
                  </motion.div>
                </Box>


                {/* GitHub */}
                <Box sx={{ 
                  minWidth: { xs: '280px', md: '320px', lg: '350px' },
                  flexShrink: 0,
                  px: 2
                }}>
                  <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.3 }}
                    variants={fadeInUp}
                    transition={{ duration: 0.5, ease: 'easeOut', delay: 0.5 }}
                  >

                    <Box
                      sx={{
                        p: 4,
                        height: '200px',
                        background: 'rgba(0, 0, 0, 0.3)',
                        borderRadius: '20px',
                        border: '2px solid rgba(255, 255, 255, 0.1)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                        backdropFilter: 'blur(10px)',
                        position: 'relative',
                        overflow: 'visible',
                        '&:hover': {
                          transform: 'translateY(-8px) scale(1.02)',
                          background: 'rgba(0, 0, 0, 0.5)',
                          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
                          border: '2px solid rgba(255, 255, 255, 0.2)',
                        },
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: '1px',
                          background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
                        },
                      }}
                    >
                      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
                        <GitHubIcon size={48} />
                      </Box>
                    </Box>
                  </motion.div>
                </Box>

                {/* Zoom */}
                <Box sx={{ 
                  minWidth: { xs: '280px', md: '320px', lg: '350px' },
                  flexShrink: 0,
                  px: 2
                }}>
                  <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.3 }}
                    variants={fadeInUp}
                    transition={{ duration: 0.5, ease: 'easeOut', delay: 0.55 }}
                  >
                    <Box
                      sx={{
                        p: 4,
                        height: '200px',
                        background: 'rgba(0, 0, 0, 0.3)',
                        borderRadius: '20px',
                        border: '2px solid rgba(255, 255, 255, 0.1)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                        backdropFilter: 'blur(10px)',
                        position: 'relative',
                        overflow: 'visible',
                        '&:hover': {
                          transform: 'translateY(-8px) scale(1.02)',
                          background: 'rgba(0, 0, 0, 0.5)',
                          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
                          border: '2px solid rgba(255, 255, 255, 0.2)',
                        },
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: '1px',
                          background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
                        },
                      }}
                    >
                      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
                        <ZoomIcon size={48} />
                      </Box>
                    </Box>
                  </motion.div>
                </Box>

                {/* Google Meet */}
                <Box sx={{ 
                  minWidth: { xs: '280px', md: '320px', lg: '350px' },
                  flexShrink: 0,
                  px: 2
                }}>
                  <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.3 }}
                    variants={fadeInUp}
                    transition={{ duration: 0.5, ease: 'easeOut', delay: 0.6 }}
                  >
                    <Box
                      sx={{
                        p: 4,
                        height: '200px',
                        background: 'rgba(0, 0, 0, 0.3)',
                        borderRadius: '20px',
                        border: '2px solid rgba(255, 255, 255, 0.1)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        position: 'relative',
                        overflow: 'visible',
                        '&:hover': {
                          transform: 'translateY(-8px)',
                          background: 'rgba(0, 0, 0, 0.4)',
                          border: '2px solid rgba(66, 133, 244, 0.5)',
                          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
                        },
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: '1px',
                          background: 'linear-gradient(90deg, transparent, rgba(66, 133, 244, 0.5), transparent)',
                        },
                      }}
                    >
                      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
                        <GoogleMeetIcon size={48} />
                      </Box>
                    </Box>
                  </motion.div>
                </Box>

                {/* Duplicate content for seamless scrolling */}
                {/* Gmail */}
                <Box sx={{ 
                  minWidth: { xs: '280px', md: '320px', lg: '350px' },
                  flexShrink: 0,
                  px: 2
                }}>
                  <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.3 }}
                    variants={fadeInUp}
                    transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
                  >
                    <Box
                      sx={{
                        p: 4,
                        height: '200px',
                        background: 'rgba(0, 0, 0, 0.3)',
                        borderRadius: '20px',
                        border: '2px solid rgba(255, 255, 255, 0.1)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                        backdropFilter: 'blur(10px)',
                        position: 'relative',
                        overflow: 'visible',
                        '&:hover': {
                          transform: 'translateY(-8px) scale(1.02)',
                          background: 'rgba(0, 0, 0, 0.5)',
                          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
                          border: '2px solid rgba(255, 255, 255, 0.2)',
                        },
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: '1px',
                          background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
                        },
                      }}
                    >
                      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
                        <GmailIcon size={48} />
                      </Box>
                    </Box>
                  </motion.div>
                </Box>

                {/* Google Docs */}
                <Box sx={{ 
                  minWidth: { xs: '280px', md: '320px', lg: '350px' },
                  flexShrink: 0,
                  px: 2
                }}>
                  <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.3 }}
                    variants={fadeInUp}
                    transition={{ duration: 0.5, ease: 'easeOut', delay: 0.15 }}
                  >
                    <Box
                      sx={{
                        p: 4,
                        height: '200px',
                        background: 'rgba(0, 0, 0, 0.3)',
                        borderRadius: '20px',
                        border: '2px solid rgba(255, 255, 255, 0.1)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                        backdropFilter: 'blur(10px)',
                        position: 'relative',
                        overflow: 'visible',
                        '&:hover': {
                          transform: 'translateY(-8px) scale(1.02)',
                          background: 'rgba(0, 0, 0, 0.5)',
                          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
                          border: '2px solid rgba(255, 255, 255, 0.2)',
                        },
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: '1px',
                          background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
                        },
                      }}
                    >
                      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
                        <GoogleDocsIcon size={48} />
                      </Box>
                    </Box>
                  </motion.div>
                </Box>

                {/* Google Sheets */}
                <Box sx={{ 
                  minWidth: { xs: '280px', md: '320px', lg: '350px' },
                  flexShrink: 0,
                  px: 2
                }}>
                  <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.3 }}
                    variants={fadeInUp}
                    transition={{ duration: 0.5, ease: 'easeOut', delay: 0.2 }}
                  >
                    <Box
                      sx={{
                        p: 4,
                        height: '200px',
                        background: 'rgba(0, 0, 0, 0.3)',
                        borderRadius: '20px',
                        border: '2px solid rgba(255, 255, 255, 0.1)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                        backdropFilter: 'blur(10px)',
                        position: 'relative',
                        overflow: 'visible',
                        '&:hover': {
                          transform: 'translateY(-8px) scale(1.02)',
                          background: 'rgba(0, 0, 0, 0.5)',
                          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
                          border: '2px solid rgba(255, 255, 255, 0.2)',
                        },
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: '1px',
                          background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
                        },
                      }}
                    >
                      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
                        <GoogleSheetsIcon size={48} />
                      </Box>
                    </Box>
                  </motion.div>
                </Box>
            </Box>
          </Box>

          {/* Coming Soon Section */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeInUp}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.4 }}
          >
          </motion.div>
        </Box>
      </Box>

      {/* Stats Section */}
      <Box sx={{ 
        py: { xs: 6, md: 8 },
        background: '#000000',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        <Container maxWidth="lg" sx={{ px: { xs: 3, md: 2 } }}>
          <Grid container spacing={4}>
            {stats.map((stat, index) => (
              <Grid item xs={6} md={3} key={index}>
                <Box sx={{ textAlign: 'center' }}>
                  <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.3 }}
                    variants={fadeInUp}
                    transition={{ duration: 0.5, ease: 'easeOut', delay: index * 0.08 }}
                  >
                    <div className="text-3xl sm:text-4xl md:text-5xl font-semibold text-white mb-2 tracking-tight font-inter">
                      {stat.value}
                    </div>
                    <div className="text-xs sm:text-sm md:text-base text-zinc-400 font-normal font-inter">
                      {stat.label}
                    </div>
                  </motion.div>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Box sx={{ py: { xs: 8, md: 12 }, background: '#000000' }}>
        <Container maxWidth="lg" sx={{ px: { xs: 3, md: 2 } }}>
          {/* Section Header */}
          <Box sx={{ textAlign: 'center', mb: { xs: 6, md: 8 } }}>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={fadeInUp}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            >
              <Typography variant="h2" className="text-3xl sm:text-4xl md:text-5xl mb-4 md:mb-6">
                Why Choose Banbury?
              </Typography>
            </motion.div>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={fadeInUp}
              transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
            >
              <Typography variant="lead" className="text-base sm:text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed px-4 md:px-0">
                Experience the power of AI-driven automation with features designed for modern businesses
              </Typography>
            </motion.div>
          </Box>

          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Box
                  sx={{
                    p: { xs: 4, md: 6 },
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
                      '& .feature-highlight': {
                        opacity: 1,
                        transform: 'translateY(0)',
                      },
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
                  {/* Icon */}
                  <Box sx={{ mb: 3 }}>
                    {feature.icon}
                  </Box>

                  {/* Title */}
                  <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.2 }}
                    variants={fadeInUp}
                    transition={{ duration: 0.5, ease: 'easeOut', delay: 0.05 }}
                  >
                    <Typography variant="h3" className="mb-4 text-lg md:text-xl">
                      {feature.title}
                    </Typography>
                  </motion.div>

                  {/* Description */}
                  <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.2 }}
                    variants={fadeInUp}
                    transition={{ duration: 0.5, ease: 'easeOut', delay: 0.12 }}
                  >
                    <Typography variant="p" className="text-zinc-400 leading-relaxed mb-6 text-sm md:text-base">
                      {feature.description}
                    </Typography>
                  </motion.div>

                  {/* Highlight Badge */}
                  <Box
                    className="feature-highlight"
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      px: { xs: 2, md: 3 },
                      py: 1,
                      borderRadius: '50px',
                      background: 'rgba(59, 130, 246, 0.1)',
                      border: '1px solid rgba(59, 130, 246, 0.2)',
                      opacity: 0.7,
                      transform: 'translateY(10px)',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    <span className="text-blue-500 text-xs md:text-sm font-semibold">
                      {feature.highlight}
                    </span>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Use Cases Section */}
      <Box sx={{ 
        py: { xs: 8, md: 12 }, 
        background: '#000000',
        borderTop: '1px solid rgba(255,255,255,0.08)',
      }}>
        <Container maxWidth="xl" sx={{ px: { xs: 3, md: 4 } }}>
          {/* Section Header */}
          <Box sx={{ textAlign: 'center', mb: { xs: 8, md: 12 } }}>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={fadeInUp}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            >
              <Typography variant="h2" className="text-3xl sm:text-4xl md:text-5xl mb-4 md:mb-6">
                See Banbury in Action
              </Typography>
            </motion.div>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={fadeInUp}
              transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
            >
              <Typography variant="lead" className="text-base sm:text-lg md:text-xl text-zinc-400 max-w-3xl mx-auto leading-relaxed px-4 md:px-0">
                Discover powerful automation workflows that save hours every day
              </Typography>
            </motion.div>
          </Box>

          {/* Use Case 1 - Email Management (Image Left) */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={fadeInUp}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <Box sx={{ mb: { xs: 8, md: 12 } }}>
              <Grid container spacing={{ xs: 4, md: 6 }} alignItems="center">
                <Grid item xs={12} md={6}>
                  <Box
                    sx={{
                      position: 'relative',
                      borderRadius: '20px',
                      overflow: 'hidden',
                      border: '1px solid rgba(59, 130, 246, 0.2)',
                      '&:hover': {
                        transform: 'scale(1.02)',
                      },
                    }}
                  >
                    <Image
                      src={EmailDemo}
                      alt="Email automation demo"
                      width={800}
                      height={500}
                      style={{
                        width: '100%',
                        height: 'auto',
                        display: 'block',
                      }}
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ pl: { md: 4 } }}>
                    <Typography variant="h3" className="text-2xl sm:text-3xl md:text-4xl mb-4">
                      Smart Email Management
                    </Typography>
                    <Typography variant="p" className="text-base md:text-lg text-zinc-400 leading-relaxed mb-6">
                      Automatically categorize, prioritize, and respond to emails based on content and context. Set up intelligent filters that route messages to the right team members and draft personalized responses instantly.
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'start', gap: 2 }}>
                        <Box
                          sx={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: 'rgba(59, 130, 246, 0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            mt: 0.5,
                          }}
                        >
                          <span style={{ color: '#3B82F6', fontSize: '14px' }}>✓</span>
                        </Box>
                        <p className="text-sm md:text-base text-zinc-300 font-inter">
                          Auto-categorize emails by priority, sender, and content
                        </p>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'start', gap: 2 }}>
                        <Box
                          sx={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            mt: 0.5,
                          }}
                        >
                          <span style={{ color: '#3B82F6', fontSize: '14px' }}>✓</span>
                        </Box>
                        <p className="text-sm md:text-base text-zinc-300 font-inter">
                          Generate intelligent draft responses using AI
                        </p>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'start', gap: 2 }}>
                        <Box
                          sx={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            mt: 0.5,
                          }}
                        >
                          <span style={{ color: '#3B82F6', fontSize: '14px' }}>✓</span>
                        </Box>
                        <p className="text-sm md:text-base text-zinc-300 font-inter">
                          Route emails to the right team based on content
                        </p>
                      </Box>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </motion.div>

          {/* Use Case 2 - Meeting Automation (Video Right) */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={fadeInUp}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <Box sx={{ mb: { xs: 8, md: 12 } }}>
              <Grid container spacing={{ xs: 4, md: 6 }} alignItems="center" direction={{ xs: 'column', md: 'row-reverse' }}>
                <Grid item xs={12} md={6}>
                  <Box
                    sx={{
                      position: 'relative',
                      borderRadius: '20px',
                      overflow: 'hidden',
                      border: '1px solid rgba(168, 85, 247, 0.2)',
                      boxShadow: '0 20px 60px rgba(168, 85, 247, 0.15)',
                      transition: 'all 0.4s ease',
                      '&:hover': {
                        transform: 'scale(1.02)',
                        boxShadow: '0 30px 80px rgba(168, 85, 247, 0.25)',
                      },
                    }}
                  >
                    <video
                      autoPlay
                      loop
                      muted
                      playsInline
                      style={{
                        width: '100%',
                        height: 'auto',
                        display: 'block',
                      }}
                    >
                      <source src={CalendarDemo} type="video/mp4" />
                    </video>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ pr: { md: 4 } }}>
                    <Typography variant="h3" className="text-2xl sm:text-3xl md:text-4xl mb-4">
                      Automated Meeting Scheduling
                    </Typography>
                    <Typography variant="p" className="text-base md:text-lg text-zinc-400 leading-relaxed mb-6">
                      Schedule meetings across time zones, send automatic reminders, generate meeting agendas, and distribute notes to all attendees without lifting a finger.
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'start', gap: 2 }}>
                        <Box
                          sx={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: 'rgba(59, 130, 246, 0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            mt: 0.5,
                          }}
                        >
                          <span style={{ color: '#3B82F6', fontSize: '14px' }}>✓</span>
                        </Box>
                        <p className="text-sm md:text-base text-zinc-300 font-inter">
                          Smart scheduling across multiple time zones
                        </p>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'start', gap: 2 }}>
                        <Box
                          sx={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: 'rgba(59, 130, 246, 0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            mt: 0.5,
                          }}
                        >
                          <span style={{ color: '#3B82F6', fontSize: '14px' }}>✓</span>
                        </Box>
                        <p className="text-sm md:text-base text-zinc-300 font-inter">
                          Automatic meeting reminders and follow-ups
                        </p>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'start', gap: 2 }}>
                        <Box
                          sx={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: 'rgba(59, 130, 246, 0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            mt: 0.5,
                          }}
                        >
                          <span style={{ color: '#3B82F6', fontSize: '14px' }}>✓</span>
                        </Box>
                        <p className="text-sm md:text-base text-zinc-300 font-inter">
                          Generate and distribute meeting notes instantly
                        </p>
                      </Box>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </motion.div>

          {/* Use Case 3 - Data Automation (Video Left) */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={fadeInUp}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <Box sx={{ mb: { xs: 8, md: 12 } }}>
              <Grid container spacing={{ xs: 4, md: 6 }} alignItems="center">
                <Grid item xs={12} md={6}>
                  <Box
                    sx={{
                      position: 'relative',
                      borderRadius: '20px',
                      overflow: 'hidden',
                      border: '1px solid rgba(249, 115, 22, 0.2)',
                      transition: 'all 0.4s ease',
                      '&:hover': {
                        transform: 'scale(1.02)',
                      },
                    }}
                  >
                    <video
                      autoPlay
                      loop
                      muted
                      playsInline
                      style={{
                        width: '100%',
                        height: 'auto',
                        display: 'block',
                      }}
                    >
                      <source src={SpreadsheetDemo} type="video/mp4" />
                    </video>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ pl: { md: 4 } }}>
                    <Typography variant="h3" className="text-2xl sm:text-3xl md:text-4xl mb-4">
                      Data Sync & Reporting
                    </Typography>
                    <Typography variant="p" className="text-base md:text-lg text-zinc-400 leading-relaxed mb-6">
                      Keep your data synchronized across all platforms in real-time. Generate comprehensive reports and distribute them to stakeholders automatically on your preferred schedule.
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'start', gap: 2 }}>
                        <Box
                          sx={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            mt: 0.5,
                          }}
                        >
                          <span style={{ color: '#3B82F6', fontSize: '14px' }}>✓</span>
                        </Box>
                        <p className="text-sm md:text-base text-zinc-300 font-inter">
                          Real-time data synchronization across platforms
                        </p>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'start', gap: 2 }}>
                        <Box
                          sx={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            mt: 0.5,
                          }}
                        >
                          <span style={{ color: '#3B82F6', fontSize: '14px' }}>✓</span>
                        </Box>
                        <p className="text-sm md:text-base text-zinc-300 font-inter">
                          Automated report generation with custom schedules
                        </p>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'start', gap: 2 }}>
                        <Box
                          sx={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            mt: 0.5,
                          }}
                        >
                          <span style={{ color: '#3B82F6', fontSize: '14px' }}>✓</span>
                        </Box>
                        <p className="text-sm md:text-base text-zinc-300 font-inter">
                          Data validation and error detection
                        </p>
                      </Box>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </motion.div>

          {/* Use Case 4 - Task Automation (Image Right) */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={fadeInUp}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <Box sx={{ mb: { xs: 8, md: 12 } }}>
              <Grid container spacing={{ xs: 4, md: 6 }} alignItems="center" direction={{ xs: 'column', md: 'row-reverse' }}>
                <Grid item xs={12} md={6}>
                  <Box
                    sx={{
                      position: 'relative',
                      borderRadius: '20px',
                      overflow: 'hidden',
                      transition: 'all 0.4s ease',
                      '&:hover': {
                        transform: 'scale(1.02)',
                      },
                    }}
                  >
                    <video
                      autoPlay
                      loop
                      muted
                      playsInline
                      style={{
                        width: '100%',
                        height: 'auto',
                        display: 'block',
                      }}
                    >
                      <source src={TaskCreationDemo} type="video/mp4" />
                    </video>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ pr: { md: 4 } }}>
                    <Typography variant="h3" className="text-2xl sm:text-3xl md:text-4xl mb-4">
                      Schedule Tasks When You're Away
                    </Typography>
                    <Typography variant="p" className="text-base md:text-lg text-zinc-400 leading-relaxed mb-6">
                      Schedule tasks when you're away and let Banbury handle the rest.
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'start', gap: 2 }}>
                        <Box
                          sx={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            mt: 0.5,
                          }}
                        >
                          <span style={{ color: '#3B82F6', fontSize: '14px' }}>✓</span>
                        </Box>
                        <p className="text-sm md:text-base text-zinc-300 font-inter">
                          Create tasks with detailed information including titles, descriptions, scheduled dates and times.
                        </p>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'start', gap: 2 }}>
                        <Box
                          sx={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            mt: 0.5,
                          }}
                        >
                          <span style={{ color: '#3B82F6', fontSize: '14px' }}>✓</span>
                        </Box>
                        <p className="text-sm md:text-base text-zinc-300 font-inter">
                          Set recurring tasks to ensure consistency and efficiency.
                        </p>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'start', gap: 2 }}>
                        <Box
                          sx={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            mt: 0.5,
                          }}
                        >
                          <span style={{ color: '#3B82F6', fontSize: '14px' }}>✓</span>
                        </Box>
                        <p className="text-sm md:text-base text-zinc-300 font-inter">
                          See the results of your tasks when you come back.
                        </p>
                      </Box>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </motion.div>

          {/* Use Case 5 - AI Assistant (Image Left) */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={fadeInUp}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <Box sx={{ mb: { xs: 8, md: 12 } }}>
              <Grid container spacing={{ xs: 4, md: 6 }} alignItems="center">
                <Grid item xs={12} md={6}>
                  <Box
                    sx={{
                      position: 'relative',
                      borderRadius: '20px',
                      overflow: 'hidden',
                      border: '1px solid rgba(139, 92, 246, 0.2)',
                      transition: 'all 0.4s ease',
                      '&:hover': {
                        transform: 'scale(1.02)',
                      },
                    }}
                  >
                    <video
                      autoPlay
                      loop
                      muted
                      playsInline
                      style={{
                        width: '100%',
                        height: 'auto',
                        display: 'block',
                      }}
                    >
                      <source src={DiffViewDemo} type="video/mp4" />
                    </video>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ pl: { md: 4 } }}>
                    <Typography variant="h3" className="text-2xl sm:text-3xl md:text-4xl mb-4">
                      Intelligent AI Support
                    </Typography>
                    <Typography variant="p" className="text-base md:text-lg text-zinc-400 leading-relaxed mb-6">
                      Chat with your AI assistant to create workflows, get insights, and automate tasks using natural language. Just describe what you want, and let AI do the rest.
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'start', gap: 2 }}>
                        <Box
                          sx={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            mt: 0.5,
                          }}
                        >
                          <span style={{ color: '#3B82F6', fontSize: '14px' }}>✓</span>
                        </Box>
                        <p className="text-sm md:text-base text-zinc-300 font-inter">
                          Natural language workflow creation
                        </p>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'start', gap: 2 }}>
                        <Box
                          sx={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            mt: 0.5,
                          }}
                        >
                          <span style={{ color: '#3B82F6', fontSize: '14px' }}>✓</span>
                        </Box>
                        <p className="text-sm md:text-base text-zinc-300 font-inter">
                          Smart suggestions and optimizations
                        </p>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'start', gap: 2 }}>
                        <Box
                          sx={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: 'rgba(59, 130, 246, 0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            mt: 0.5,
                          }}
                        >
                          <span style={{ color: '#3B82F6', fontSize: '14px' }}>✓</span>
                        </Box>
                        <p className="text-sm md:text-base text-zinc-300 font-inter">
                          24/7 intelligent assistance and troubleshooting
                        </p>
                      </Box>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </motion.div>

          {/* Use Case 6 - Browser Automation (Video Right) */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={fadeInUp}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <Box>
              <Grid container spacing={{ xs: 4, md: 6 }} alignItems="center" direction={{ xs: 'column', md: 'row-reverse' }}>
                <Grid item xs={12} md={6}>
                  <Box
                    sx={{
                      position: 'relative',
                      borderRadius: '20px',
                      overflow: 'hidden',
                      border: '1px solid rgba(14, 165, 233, 0.2)',
                      transition: 'all 0.4s ease',
                      '&:hover': {
                        transform: 'scale(1.02)',
                      },
                    }}
                  >
                    <video
                      autoPlay
                      loop
                      muted
                      playsInline
                      style={{
                        width: '100%',
                        height: 'auto',
                        display: 'block',
                      }}
                    >
                      <source src={BrowserDemo} type="video/mp4" />
                    </video>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ pr: { md: 4 } }}>
                    <Typography variant="h3" className="text-2xl sm:text-3xl md:text-4xl mb-4">
                      Browser Automation
                    </Typography>
                    <Typography variant="p" className="text-base md:text-lg text-zinc-400 leading-relaxed mb-6">
                      Automate repetitive web tasks like data entry, form filling, and web scraping. Let Banbury navigate websites and extract information while you focus on important work.
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'start', gap: 2 }}>
                        <Box
                          sx={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: 'rgba(59, 130, 246, 0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            mt: 0.5,
                          }}
                        >
                          <span style={{ color: '#3B82F6', fontSize: '14px' }}>✓</span>
                        </Box>
                        <p className="text-sm md:text-base text-zinc-300 font-inter">
                          Automated form filling and data entry
                        </p>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'start', gap: 2 }}>
                        <Box
                          sx={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: 'rgba(59, 130, 246, 0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            mt: 0.5,
                          }}
                        >
                          <span style={{ color: '#3B82F6', fontSize: '14px' }}>✓</span>
                        </Box>
                        <p className="text-sm md:text-base text-zinc-300 font-inter">
                          Intelligent web scraping and data extraction
                        </p>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'start', gap: 2 }}>
                        <Box
                          sx={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: 'rgba(59, 130, 246, 0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            mt: 0.5,
                          }}
                        >
                          <span style={{ color: '#3B82F6', fontSize: '14px' }}>✓</span>
                        </Box>
                        <p className="text-sm md:text-base text-zinc-300 font-inter">
                          Schedule automated browser tasks
                        </p>
                      </Box>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </motion.div>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box
        sx={{
          py: { xs: 8, md: 16 },
          background: '#000000',
          borderTop: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <Container maxWidth="md" sx={{ px: { xs: 3, md: 2 } }}>
          <Box sx={{ textAlign: 'center' }}>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={fadeInUp}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            >
              <Typography variant="h2" className="text-3xl sm:text-4xl md:text-5xl mb-6 md:mb-8">
                Ready to Transform Your Workflow?
              </Typography>
            </motion.div>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={fadeInUp}
              transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
            >
              <Typography variant="lead" className="text-base sm:text-lg md:text-xl text-zinc-400 mb-10 md:mb-12 leading-relaxed max-w-2xl mx-auto px-4 md:px-0">
                Join Banbury to automate your processes and boost productivity by 300%.
              </Typography>
            </motion.div>
            
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', sm: 'row' }, 
              gap: { xs: 2, sm: 3 }, 
              justifyContent: 'center', 
              mb: 6,
              px: { xs: 2, md: 0 }
            }}>
                  <Button
                    variant="default"
                    size="lg"
                    onClick={() => window.location.href = '/register'}
                  >
                    Get Started for Free
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => window.location.href = '/features'}
                    className="rounded-full px-5 md:px-6"
                    style={{
                      borderRadius: 9999,
                      background: 'transparent',
                      border: '1px solid rgba(255,255,255,0.12)',
                      color: 'rgba(255,255,255,0.85)'
                    }}
                  >
                    Watch Demo
                  </Button>
            </Box>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default Home;

