import CloudIcon from '@mui/icons-material/Cloud';
import DevicesIcon from '@mui/icons-material/Devices';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import { Box, Typography, Container, Grid, Paper } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import Image from 'next/image';
import NextLink from 'next/link';
import { useState, useEffect } from 'react';

import AppImage from '../assets/images/app_image.png';
import { Button } from '../components/ui/button';
import { determineOS } from '../handlers/determineOS';
import { trackPageView } from '../services/trackingService';

const Home = (): JSX.Element => {
  const theme = useTheme();
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

  // Track page visit when component mounts
  useEffect(() => {
    trackPageView('/');
  }, []);

  const handleDownload = () => {
    window.open(downloadUrl, '_blank');
  };

  return (
    <Box sx={{ overflow: 'visible', background: '#000000' }}>
      {/* Hero Section */}
      <Box
        sx={{
          minHeight: { xs: '100vh', md: '85vh' },
          display: 'flex',
          alignItems: 'flex-start',
          position: 'relative',
          overflow: 'visible',
          pt: { xs: 4, sm: 6, md: 8 },
          pb: { xs: 4, md: 0 },
          background: '#000000',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `
              linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
            `,
            backgroundSize: { xs: '20px 20px', md: '40px 40px' },
            opacity: 0.4,
            zIndex: 0,
          },
        }}
      >
        <Container maxWidth={false} sx={{ 
          overflow: 'visible', 
          px: { xs: 3, sm: 4, md: 0 }, 
          width: { xs: '100%', md: '80%' },
          mx: 'auto'
        }}>
          <Grid 
            container 
            spacing={0} 
            alignItems="center"
            justifyContent="flex-start"
            sx={{ 
              position: 'relative',
              minHeight: { xs: '80vh', md: '70vh' },
              overflow: 'visible',
              width: '100%'
            }}
          >
            {/* Text Content - Left Side */}
            <Grid item xs={12} md={4} sx={{ 
              position: 'relative', 
              zIndex: 2, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: { xs: 'center', md: 'flex-start' },
              pl: { xs: 0, md: 2 },
              order: { xs: 1, md: 1 }
            }}>
              <Box sx={{ 
                pr: { md: 6 }, 
                mb: { xs: 6, md: 0 }, 
                pt: { xs: 2, md: 4 },
                textAlign: { xs: 'center', md: 'left' },
                maxWidth: { xs: '100%', md: '450px' },
                ml: { xs: 0, md: 0 }
              }}>
                <Typography
                  variant="h1"
                  sx={{
                    fontSize: { xs: '2.5rem', sm: '3rem', md: '4rem' },
                    fontWeight: 600,
                    lineHeight: { xs: 1.2, md: 1.1 },
                    color: '#ffffff',
                    mb: { xs: 3, md: 4 },
                    letterSpacing: '-0.02em',
                    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  }}
                >
                  Your AI-Powered <br />
                  <Box component="span" sx={{ 
                    color: '#a1a1aa',
                    fontWeight: 500,
                  }}>
                    Workflow Engine
                  </Box>
                </Typography>

                <Typography
                  sx={{
                    color: '#a1a1aa',
                    lineHeight: 1.6,
                    mb: { xs: 4, md: 5 },
                    maxWidth: '600px',
                    fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' },
                    fontWeight: 400,
                    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    px: { xs: 1, md: 0 }
                  }}
                >
                  Transform your business operations with intelligent automation that learns, adapts, and scales with your needs.
                </Typography>

                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: { xs: 'column', sm: 'row' }, 
                  gap: { xs: 2, sm: 3 }, 
                  mb: 4,
                  px: { xs: 2, md: 0 }
                }}>
                  <Button
                    variant="default"
                    size="lg"
                    onClick={() => window.location.href = '/dashboard'}
                    className="min-h-[48px] md:min-h-auto text-base md:text-auto py-2 md:py-auto px-4 md:px-auto"
                  >
                    Get Started for Free
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => window.location.href = '/features'}
                    className="min-h-[48px] md:min-h-auto text-base md:text-auto py-2 md:py-auto px-4 md:px-auto"
                  >
                    Watch Demo
                  </Button>
                </Box>
              </Box>
            </Grid>

            {/* Image - Right Side */}
            <Grid item xs={12} md={5} sx={{ 
              position: 'relative',
              height: { xs: '300px', sm: '350px', md: '500px' },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: { xs: 0, md: 0 },
              overflow: 'visible',
              order: { xs: 2, md: 2 },
              mb: { xs: 4, md: 0 }
            }}>
              {/* Gradient backdrop for depth */}
              <Box
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: { xs: '100%', md: '100%' },
                  height: '90%',
                  background: 'radial-gradient(ellipse at center, rgba(255, 255, 255, 0.03) 0%, transparent 70%)',
                  borderRadius: '50%',
                  filter: 'blur(60px)',
                  zIndex: 0,
                }}
              />
              
              {/* Main image container with enhanced styling */}
              <Box sx={{ 
                position: 'absolute',
                left: { xs: '50%', md: '0%' },
                right: { xs: '-50%', md: '-60%' },
                top: '50%',
                transform: { 
                  xs: 'translateX(-50%) translateY(-50%) perspective(1000px) rotateY(-5deg) rotateX(1deg)',
                  md: 'translateY(-50%) perspective(1000px) rotateY(-5deg) rotateX(1deg)'
                },
                width: { xs: '100%', sm: '120%', md: '150%' },
                height: 'auto',
                zIndex: 2,
                transformOrigin: 'center center',
                transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                '&:hover': {
                  transform: { 
                    xs: 'translateX(-50%) translateY(-50%) perspective(1000px) rotateY(-2deg) rotateX(0.5deg) scale(1.02)',
                    md: 'translateY(-50%) perspective(1000px) rotateY(-2deg) rotateX(0.5deg) scale(1.02)'
                  },
                }
              }}>
                <Image
                  src={AppImage}
                  alt="AI-powered workflow automation platform interface"
                  width={1600}
                  height={900}
                  style={{
                    width: '100%',
                    height: 'auto',
                    borderRadius: '16px',
                    filter: 'drop-shadow(0 32px 64px rgba(0,0,0,0.8)) drop-shadow(0 8px 32px rgba(255, 255, 255, 0.1))',
                    backgroundColor: '#0f0f0f',
                    border: '1px solid rgba(255,255,255,0.15)',
                    backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%)',
                  }}
                  priority
                />
                
                {/* Subtle highlight overlay */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '40%',
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, transparent 100%)',
                    borderRadius: '16px 16px 0 0',
                    pointerEvents: 'none',
                  }}
                />
              </Box>
            </Grid>

            {/* Dense Floating Particle System - Surrounding the entire hero area */}
            {/* Left side particles */}
            <Box
              sx={{
                position: 'absolute',
                top: '15%',
                left: '5%',
                width: { xs: '3px', md: '4px' },
                height: { xs: '3px', md: '4px' },
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.3)',
                filter: 'blur(0.5px)',
                animation: 'float 5s ease-in-out infinite',
                zIndex: 1,
                '@keyframes float': {
                  '0%, 100%': { transform: 'translateY(0px)' },
                  '50%': { transform: 'translateY(-15px)' },
                },
                display: { xs: 'none', md: 'block' }
              }}
            />

            <Box
              sx={{
                position: 'absolute',
                top: '25%',
                left: '3%',
                width: { xs: '4px', md: '6px' },
                height: { xs: '4px', md: '6px' },
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.2)',
                filter: 'blur(0.8px)',
                animation: 'float 7s ease-in-out infinite 1s',
                zIndex: 1,
                display: { xs: 'none', md: 'block' }
              }}
            />

            <Box
              sx={{
                position: 'absolute',
                top: '35%',
                left: '2%',
                width: { xs: '2px', md: '3px' },
                height: { xs: '2px', md: '3px' },
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.4)',
                filter: 'blur(0.3px)',
                animation: 'float 4s ease-in-out infinite 2s',
                zIndex: 1,
                display: { xs: 'none', md: 'block' }
              }}
            />

            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '4%',
                width: { xs: '5px', md: '8px' },
                height: { xs: '5px', md: '8px' },
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.15)',
                filter: 'blur(1px)',
                animation: 'float 9s ease-in-out infinite reverse',
                zIndex: 1,
                display: { xs: 'none', md: 'block' }
              }}
            />

            <Box
              sx={{
                position: 'absolute',
                top: '65%',
                left: '6%',
                width: { xs: '2px', md: '2px' },
                height: { xs: '2px', md: '2px' },
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.5)',
                filter: 'blur(0.2px)',
                animation: 'float 3s ease-in-out infinite 0.5s',
                zIndex: 1,
                display: { xs: 'none', md: 'block' }
              }}
            />

            {/* Right side particles - around and beyond the image */}
            <Box
              sx={{
                position: 'absolute',
                top: '12%',
                right: '2%',
                width: { xs: '3px', md: '5px' },
                height: { xs: '3px', md: '5px' },
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.25)',
                filter: 'blur(0.7px)',
                animation: 'float 6s ease-in-out infinite reverse 1.5s',
                zIndex: 1,
                display: { xs: 'none', md: 'block' }
              }}
            />

            <Box
              sx={{
                position: 'absolute',
                top: '20%',
                right: '4%',
                width: { xs: '5px', md: '7px' },
                height: { xs: '5px', md: '7px' },
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.18)',
                filter: 'blur(0.9px)',
                animation: 'float 8s ease-in-out infinite 2.5s',
                zIndex: 1,
                display: { xs: 'none', md: 'block' }
              }}
            />

            <Box
              sx={{
                position: 'absolute',
                top: '35%',
                right: '1%',
                width: { xs: '3px', md: '4px' },
                height: { xs: '3px', md: '4px' },
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.35)',
                filter: 'blur(0.4px)',
                animation: 'float 5s ease-in-out infinite reverse 4s',
                zIndex: 1,
                display: { xs: 'none', md: 'block' }
              }}
            />

            <Box
              sx={{
                position: 'absolute',
                top: '55%',
                right: '3%',
                width: { xs: '6px', md: '9px' },
                height: { xs: '6px', md: '9px' },
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.12)',
                filter: 'blur(1.2px)',
                animation: 'float 10s ease-in-out infinite reverse 2s',
                zIndex: 1,
                display: { xs: 'none', md: 'block' }
              }}
            />

            <Box
              sx={{
                position: 'absolute',
                top: '70%',
                right: '5%',
                width: { xs: '2px', md: '3px' },
                height: { xs: '2px', md: '3px' },
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.45)',
                filter: 'blur(0.3px)',
                animation: 'float 4s ease-in-out infinite 1s',
                zIndex: 1,
                display: { xs: 'none', md: 'block' }
              }}
            />

            {/* Top area particles */}
            <Box
              sx={{
                position: 'absolute',
                top: '8%',
                left: '20%',
                width: { xs: '4px', md: '6px' },
                height: { xs: '4px', md: '6px' },
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.22)',
                filter: 'blur(0.8px)',
                animation: 'float 7s ease-in-out infinite 3.5s',
                zIndex: 1,
                display: { xs: 'none', md: 'block' }
              }}
            />

            <Box
              sx={{
                position: 'absolute',
                top: '5%',
                left: '40%',
                width: { xs: '3px', md: '5px' },
                height: { xs: '3px', md: '5px' },
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.28)',
                filter: 'blur(0.6px)',
                animation: 'float 6s ease-in-out infinite reverse 0.8s',
                zIndex: 1,
                display: { xs: 'none', md: 'block' }
              }}
            />

            <Box
              sx={{
                position: 'absolute',
                top: '10%',
                right: '35%',
                width: { xs: '3px', md: '4px' },
                height: { xs: '3px', md: '4px' },
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.32)',
                filter: 'blur(0.5px)',
                animation: 'float 5s ease-in-out infinite 4.2s',
                zIndex: 1,
                display: { xs: 'none', md: 'block' }
              }}
            />

            {/* Bottom area particles */}
            <Box
              sx={{
                position: 'absolute',
                bottom: '15%',
                left: '15%',
                width: { xs: '5px', md: '8px' },
                height: { xs: '5px', md: '8px' },
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.16)',
                filter: 'blur(1px)',
                animation: 'float 9s ease-in-out infinite reverse 1.8s',
                zIndex: 1,
                display: { xs: 'none', md: 'block' }
              }}
            />

            <Box
              sx={{
                position: 'absolute',
                bottom: '10%',
                left: '35%',
                width: { xs: '2px', md: '2px' },
                height: { xs: '2px', md: '2px' },
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.6)',
                filter: 'blur(0.2px)',
                animation: 'float 3s ease-in-out infinite 2.3s',
                zIndex: 1,
                display: { xs: 'none', md: 'block' }
              }}
            />

            <Box
              sx={{
                position: 'absolute',
                bottom: '8%',
                right: '25%',
                width: { xs: '5px', md: '7px' },
                height: { xs: '5px', md: '7px' },
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.19)',
                filter: 'blur(0.9px)',
                animation: 'float 8s ease-in-out infinite 3.7s',
                zIndex: 1,
                display: { xs: 'none', md: 'block' }
              }}
            />

            <Box
              sx={{
                position: 'absolute',
                bottom: '12%',
                right: '15%',
                width: { xs: '3px', md: '5px' },
                height: { xs: '3px', md: '5px' },
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.26)',
                filter: 'blur(0.7px)',
                animation: 'float 6s ease-in-out infinite 2.8s',
                zIndex: 1,
                display: { xs: 'none', md: 'block' }
              }}
            />

            {/* Micro particles for density */}
            <Box
              sx={{
                position: 'absolute',
                top: '45%',
                left: '8%',
                width: { xs: '1px', md: '1px' },
                height: { xs: '1px', md: '1px' },
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.7)',
                animation: 'float 2s ease-in-out infinite 0.3s',
                zIndex: 1,
                display: { xs: 'none', md: 'block' }
              }}
            />

            <Box
              sx={{
                position: 'absolute',
                top: '30%',
                right: '12%',
                width: { xs: '1px', md: '1px' },
                height: { xs: '1px', md: '1px' },
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.8)',
                animation: 'float 2s ease-in-out infinite reverse 1.1s',
                zIndex: 1,
                display: { xs: 'none', md: 'block' }
              }}
            />

            <Box
              sx={{
                position: 'absolute',
                bottom: '25%',
                left: '25%',
                width: { xs: '1px', md: '1px' },
                height: { xs: '1px', md: '1px' },
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.9)',
                animation: 'float 2s ease-in-out infinite 1.7s',
                zIndex: 1,
                display: { xs: 'none', md: 'block' }
              }}
            />
          </Grid>
        </Container>
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
                  <Typography
                    sx={{
                      fontSize: { xs: '1.75rem', sm: '2.25rem', md: '3rem' },
                      fontWeight: 600,
                      color: '#ffffff',
                      mb: 1,
                      letterSpacing: '-0.025em',
                      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    }}
                  >
                    {stat.value}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: { xs: '0.75rem', sm: '0.875rem', md: '1rem' },
                      color: '#a1a1aa',
                      fontWeight: 400,
                      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    }}
                  >
                    {stat.label}
                  </Typography>
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
            <Typography
              sx={{
                fontSize: { xs: '1.75rem', sm: '2rem', md: '2.75rem' },
                fontWeight: 600,
                color: '#ffffff',
                mb: { xs: 2, md: 3 },
                letterSpacing: '-0.02em',
                fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              }}
            >
              Why Choose Banbury?
            </Typography>
            <Typography
              sx={{
                fontSize: { xs: '1rem', sm: '1.05rem', md: '1.125rem' },
                color: '#a1a1aa',
                maxWidth: '600px',
                mx: 'auto',
                lineHeight: 1.6,
                fontWeight: 400,
                fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                px: { xs: 2, md: 0 }
              }}
            >
              Experience the power of AI-driven automation with features designed for modern businesses
            </Typography>
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
                  <Typography
                    sx={{
                      mb: 2,
                      fontWeight: 600,
                      color: '#ffffff',
                      fontSize: { xs: '1.125rem', md: '1.25rem' },
                      letterSpacing: '-0.01em',
                      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    }}
                  >
                    {feature.title}
                  </Typography>

                  {/* Description */}
                  <Typography
                    sx={{
                      color: '#a1a1aa',
                      lineHeight: 1.6,
                      mb: 3,
                      fontSize: { xs: '0.9rem', md: '0.95rem' },
                      fontWeight: 400,
                      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    }}
                  >
                    {feature.description}
                  </Typography>

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
                    <Typography
                      sx={{
                        color: '#3b82f6',
                        fontSize: { xs: '0.8rem', md: '0.85rem' },
                        fontWeight: 600,
                      }}
                    >
                      {feature.highlight}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
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
            <Typography
              sx={{
                fontSize: { xs: '1.75rem', sm: '2rem', md: '2.75rem' },
                fontWeight: 600,
                mb: { xs: 3, md: 4 },
                color: '#ffffff',
                letterSpacing: '-0.02em',
                fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              }}
            >
              Ready to Transform Your Workflow?
            </Typography>
            <Typography
              sx={{
                fontSize: { xs: '1rem', sm: '1.1rem', md: '1.2rem' },
                color: '#a1a1aa',
                mb: { xs: 5, md: 6 },
                lineHeight: 1.6,
                maxWidth: '600px',
                mx: 'auto',
                fontWeight: 400,
                fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                px: { xs: 2, md: 0 }
              }}
            >
              Join Banbury to automate your processes and boost productivity by 300%.
            </Typography>
            
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
                onClick={() => window.location.href = '/dashboard'}
                className="bg-white/10 border-none px-6 md:px-8 py-2.5 md:py-3 text-base md:text-xl font-semibold rounded-2xl transition-all duration-300 ease-in-out min-h-[48px] md:min-h-auto hover:-translate-y-1 hover:shadow-2xl hover:bg-white/15"
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  borderRadius: '16px',
                  transition: 'all 0.3s ease',
                }}
              >
                Get Started for Free
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={handleDownload}
                className="rounded-2xl py-2.5 md:py-3 px-4 md:px-6 text-base md:text-xl font-medium min-h-[48px] md:min-h-auto hover:-translate-y-0.5"
                style={{
                  borderRadius: '16px',
                  fontWeight: 500,
                  textTransform: 'none',
                  borderColor: 'rgba(255,255,255,0.2)',
                  color: '#ffffff',
                  backdropFilter: 'blur(10px)',
                  background: 'rgba(255,255,255,0.05)',
                  transition: 'all 0.3s ease',
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

